const db = require('../config/db');
const geojsonStore = require('../data/geojsonStore');

/**
 * Endpoint Analisis Spasial: Buffer (Zona Penyangga Fasilitas 5km, 10km, 25km)
 * Menggunakan ST_Buffer, ST_DWithin, ST_Intersects
 */
exports.calculateBuffer = async (req, res) => {
  try {
    const facilityId = req.body?.facilityId || req.query?.facilityId || req.body?.featureId || req.query?.featureId;
    const facilityType = req.body?.facilityType || req.query?.facilityType || 'healthcare';
    const radiusMeters = Number(req.body?.radius || req.query?.radius || 5000);
    const lat = req.body?.lat || req.query?.lat;
    const lng = req.body?.lng || req.query?.lng;
    const customCoords = (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null;

    if (radiusMeters <= 0 || radiusMeters > 50000) {
      return res.status(400).json({ error: 'Radius buffer harus antara 100 dan 50.000 meter (misal: 5000, 10000, 25000).' });
    }

    if (db.isPostgisActive() && customCoords) {
      try {
        const sql = `
          WITH buffer_geom AS (
            SELECT ST_Buffer(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)::geometry AS geom
          )
          SELECT 
            ST_AsGeoJSON(b.geom)::json AS buffer_geometry,
            ROUND((ST_Area(b.geom::geography) / 10000.0)::numeric, 2) AS luas_buffer_ha,
            ROUND((ST_Area(b.geom::geography) / 1000000.0)::numeric, 2) AS luas_buffer_km2,
            (
              SELECT json_agg(json_build_object(
                'id', k.id,
                'nama_desa', k.namobj,
                'kecamatan', k.wadmkc,
                'tipe_kemiskinan', k.wq_pov,
                'jarak_meter', ROUND(ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, k.geom::geography)::numeric, 1)
              ) ORDER BY ST_Distance(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, k.geom::geography) ASC)
              FROM kluster_kemiskinan k, buffer_geom bg
              WHERE ST_Intersects(k.geom, bg.geom) OR ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, k.geom::geography, $3)
            ) AS desa_terjangkau
          FROM buffer_geom b;
        `;
        const result = await db.query(sql, [customCoords.lng, customCoords.lat, radiusMeters]);
        if (result.rows.length > 0) {
          const row = result.rows[0];
          const desaList = row.desa_terjangkau || [];
          return res.json({
            type: 'FeatureCollection',
            metadata: {
              engine: 'PostgreSQL PostGIS ST_Buffer + ST_Intersects',
              radius_meter: radiusMeters,
              radius_km: radiusMeters / 1000.0,
              luas_buffer_ha: row.luas_buffer_ha,
              luas_buffer_km2: row.luas_buffer_km2,
              total_desa_terjangkau: desaList.length
            },
            features: [
              {
                type: 'Feature',
                id: `buffer-postgis-${Date.now()}`,
                properties: {
                  target_nama: facilityId || 'Titik Kustom Peta',
                  target_kategori: facilityType,
                  radius_meter: radiusMeters,
                  radius_km: radiusMeters / 1000.0,
                  luas_buffer_ha: row.luas_buffer_ha,
                  luas_buffer_km2: row.luas_buffer_km2,
                  total_desa_terjangkau: desaList.length,
                  desa_terjangkau: desaList,
                  metode: 'PostGIS ST_Buffer(geom::geography, radius)'
                },
                geometry: row.buffer_geometry
              }
            ]
          });
        }
      } catch (dbErr) {
        console.warn('[PostGIS Buffer Fallback to Spatial Engine]', dbErr.message);
      }
    }

    // Engine Spasial GeoJSON Store (Turf.js Geodesic Fallback)
    const result = geojsonStore.computeBuffer(facilityId, radiusMeters, facilityType, customCoords);
    res.json(result);
  } catch (error) {
    console.error('Error calculateBuffer:', error);
    res.status(500).json({ error: 'Gagal melakukan kalkulasi buffer spasial: ' + error.message });
  }
};

/**
 * Endpoint Analisis Spasial: Overlay / Tumpang-Tindih Irisan (Intersection)
 */
exports.calculateOverlay = async (req, res) => {
  try {
    const kecamatan = req.body?.kecamatan || req.query?.kecamatan || 'all';
    const jenisBencana = req.body?.jenisBencana || req.query?.jenisBencana || 'all';

    if (db.isPostgisActive()) {
      try {
        let sql = `
          SELECT 
            k.id AS desa_id,
            k.namobj AS nama_desa,
            k.wadmkc AS kecamatan,
            k.wq_pov AS tipe_kemiskinan,
            b.jenis_bencana,
            b.tingkat_risiko,
            ROUND((ST_Area(ST_Intersection(k.geom, b.geom)::geography) / 10000.0)::numeric, 2) AS luas_terdampak_ha,
            ST_AsGeoJSON(ST_Intersection(k.geom, b.geom))::json AS geometry
          FROM kluster_kemiskinan k
          JOIN area_bencana b ON ST_Intersects(k.geom, b.geom)
          WHERE 1=1
        `;
        const params = [];
        if (kecamatan !== 'all') {
          params.push(kecamatan);
          sql += ` AND LOWER(k.wadmkc) = LOWER($${params.length})`;
        }
        if (jenisBencana !== 'all') {
          params.push(`%${jenisBencana}%`);
          sql += ` AND b.jenis_bencana ILIKE $${params.length}`;
        }
        sql += ` ORDER BY luas_terdampak_ha DESC LIMIT 100;`;

        const result = await db.query(sql, params);
        const features = result.rows.map(row => ({
          type: 'Feature',
          id: `overlay-${row.desa_id}-${row.jenis_bencana}`,
          properties: {
            desa_id: row.desa_id,
            nama_desa: row.nama_desa,
            kecamatan: row.kecamatan,
            tipe_kemiskinan: row.tipe_kemiskinan,
            jenis_bencana: row.jenis_bencana,
            tingkat_risiko: row.tingkat_risiko,
            luas_terdampak_ha: Number(row.luas_terdampak_ha),
            metode: 'PostGIS ST_Intersection'
          },
          geometry: row.geometry
        }));

        const totalLuas = features.reduce((acc, f) => acc + (f.properties.luas_terdampak_ha || 0), 0);

        return res.json({
          type: 'FeatureCollection',
          metadata: {
            metode: 'PostgreSQL PostGIS ST_Intersection',
            total_fitur_terdampak: features.length,
            total_luas_terdampak_ha: Number(totalLuas.toFixed(2))
          },
          features
        });
      } catch (dbErr) {
        console.warn('[PostGIS Overlay Fallback]', dbErr.message);
      }
    }

    // Engine Spasial GeoJSON Store Fallback
    const result = geojsonStore.computeOverlay(kecamatan, jenisBencana);
    res.json(result);
  } catch (error) {
    console.error('Error calculateOverlay:', error);
    res.status(500).json({ error: 'Gagal melakukan kalkulasi overlay spasial: ' + error.message });
  }
};

/**
 * 1. Batas Kecamatan (DistrictboundaryBatasKecamatanKotawaringinTimur_3)
 */
exports.getDistrictBoundaries = (req, res) => {
  try {
    const data = geojsonStore.getDistrictBoundaries();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 2. Fasilitas Pendidikan (EducationFacilityFasilitasPendidikanKotawaringinTimur_11)
 */
exports.getEducationFacilities = (req, res) => {
  try {
    const data = geojsonStore.getEducationFacilities();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 3. Fasilitas Kesehatan (HealthcareFacilityFasilitasKesehatanKotawaringinTimur_9)
 */
exports.getHealthcareFacilities = (req, res) => {
  try {
    const data = geojsonStore.getHealthcareFacilities();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 4. Isochrone Pendidikan SMA/SMK (IsochroneEducationJangkauanSMASMKKotawaringinTimur_10)
 */
exports.getIsochroneEducation = (req, res) => {
  try {
    const data = geojsonStore.getIsochroneEducation();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 5. Isochrone Pelayanan Rumah Sakit (IsochroneHospitalJangkauanPelayananRumahSakitKotawaringinTimur_8)
 */
exports.getIsochroneHospital = (req, res) => {
  try {
    const data = geojsonStore.getIsochroneHospital();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 6. Badan Air & Sungai Mentaya (RiverSungaiKotawaringinTimur_7)
 */
exports.getRivers = (req, res) => {
  try {
    const data = geojsonStore.getRivers();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 7. Jaringan Jalan (RoadJalanKotawaringinTimur_6)
 */
exports.getRoads = (req, res) => {
  try {
    const data = geojsonStore.getRoads();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 8. Pola Spasial Kemiskinan (SpatialPatternPovertyPolaSpasialKemiskinanKotawaringinTimur_5)
 */
exports.getSpatialPatternPoverty = (req, res) => {
  try {
    const data = geojsonStore.getSpatialPatternPoverty();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 9. Pariwisata & Cagar Budaya (TourismandCulturalHeritagePariwisataKotawaringinTimur_4)
 */
exports.getTourism = (req, res) => {
  try {
    const data = geojsonStore.getTourism();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 10. Zona Risiko Bencana
 */
exports.getDisasterZones = (req, res) => {
  try {
    const data = geojsonStore.getDisasterRiskZones();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
