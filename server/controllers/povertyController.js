const db = require('../config/db');
const geojsonStore = require('../data/geojsonStore');

/**
 * Controller: Mengambil Data GeoJSON Kluster Kemiskinan
 */
exports.getPovertyClusters = async (req, res) => {
  try {
    const { kecamatan, tipe_kemiskinan, search } = req.query;

    if (db.isPostgisActive()) {
      try {
        let sql = `
          SELECT 
            id, namobj, wadmkc, wadmkk, luas_ha, wq_pov,
            rasio_ketergantungan, sanitasi_layak_persen, kepemilikan_aset_skor,
            akses_pendidikan_km, akses_kesehatan_km, indeks_kerentanan,
            ST_AsGeoJSON(geom)::json AS geometry
          FROM kluster_kemiskinan
          WHERE 1=1
        `;
        const params = [];

        if (kecamatan) {
          params.push(kecamatan);
          sql += ` AND LOWER(wadmkc) = LOWER($${params.length})`;
        }
        if (tipe_kemiskinan) {
          params.push(`%${tipe_kemiskinan}%`);
          sql += ` AND wq_pov ILIKE $${params.length}`;
        }
        if (search) {
          params.push(`%${search}%`);
          sql += ` AND (namobj ILIKE $${params.length} OR wadmkc ILIKE $${params.length})`;
        }

        const result = await db.query(sql, params);
        const features = result.rows.map(row => {
          const { geometry, ...props } = row;
          return {
            type: 'Feature',
            id: row.id,
            properties: props,
            geometry: geometry
          };
        });

        return res.json({
          type: 'FeatureCollection',
          source: 'PostgreSQL / PostGIS (Active Database)',
          total: features.length,
          features
        });
      } catch (dbErr) {
        console.warn('[PostGIS Query Fallback]', dbErr.message);
      }
    }

    // Menggunakan GeoJSON Store Kotawaringin Timur
    let data = geojsonStore.getPovertyClusters();
    let features = data.features;

    if (kecamatan && kecamatan !== 'all') {
      features = features.filter(f => f.properties.WADMKC.toLowerCase() === kecamatan.toLowerCase());
    }

    if (tipe_kemiskinan && tipe_kemiskinan !== 'all') {
      features = features.filter(f => (f.properties.wq_Pov || '').toLowerCase().includes(tipe_kemiskinan.toLowerCase()));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      features = features.filter(f => 
        (f.properties.NAMOBJ || '').toLowerCase().includes(q) ||
        (f.properties.WADMKC || '').toLowerCase().includes(q)
      );
    }

    return res.json({
      type: 'FeatureCollection',
      source: db.isPostgisActive() ? 'PostgreSQL PostGIS' : 'PostGIS Engine (Simulated Mode)',
      total: features.length,
      features
    });
  } catch (error) {
    console.error('Error getPovertyClusters:', error);
    res.status(500).json({ error: 'Gagal mengambil data kluster kemiskinan: ' + error.message });
  }
};

/**
 * Controller: Mengambil Detail Desa / Kluster berdasarkan ID
 */
exports.getPovertyClusterById = async (req, res) => {
  try {
    const { id } = req.params;
    const all = geojsonStore.getPovertyClusters();
    const feature = all.features.find(f => String(f.id) === String(id) || f.properties.NAMOBJ === id);

    if (!feature) {
      return res.status(404).json({ error: `Kluster kemiskinan ID '${id}' tidak ditemukan.` });
    }

    res.json(feature);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Controller: Ringkasan Statistik Spasial
 */
exports.getPovertySummaryStats = (req, res) => {
  try {
    const data = geojsonStore.getPovertyClusters();
    const features = data.features;

    let totalLuasHa = 0;
    const byClusterType = {};
    const byKecamatan = {};

    features.forEach(f => {
      const p = f.properties;
      const luas = Number(p.Luas_Ha) || 0;
      totalLuasHa += luas;

      const povType = p.wq_Pov || 'Lainnya';
      let shortType = 'Urban Slum (Kawasan Kumuh)';
      if (povType.includes('High dependency ratio') || povType.includes('Pedesaan')) {
        shortType = 'Rural High Dependency (Pedesaan)';
      } else if (povType.includes('Limited asset ownership') || povType.includes('Terpencil')) {
        shortType = 'Remote Area (Wilayah Terpencil)';
      }

      byClusterType[shortType] = (byClusterType[shortType] || 0) + 1;

      const kec = p.WADMKC || 'Tidak Teridentifikasi';
      byKecamatan[kec] = (byKecamatan[kec] || 0) + 1;
    });

    res.json({
      total_desa: features.length,
      total_luas_ha: Math.round(totalLuasHa),
      distribusi_tipe_kemiskinan: byClusterType,
      distribusi_kecamatan: byKecamatan,
      kabupaten: 'Kotawaringin Timur',
      provinsi: 'Kalimantan Tengah'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
