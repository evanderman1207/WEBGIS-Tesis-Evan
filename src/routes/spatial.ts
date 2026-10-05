import express from 'express';
import fs from 'fs';
import path from 'path';
import { pool, db } from '../db/index.ts';
import { spatialBookmarks } from '../db/schema.ts';
import { desc, eq } from 'drizzle-orm';
import { optionalAuth, requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

const layerCache = new Map<string, any>();

const LAYER_FILE_MAP: Record<string, string> = {
  'poverty-patterns': 'SpatialPatternPovertyPolaSpasialKemiskinanKotawaringinTimur_5.js',
  'districts': 'DistrictboundaryBatasKecamatanKotawaringinTimur_3.js',
  'poverty-clusters': 'SpatialPovertyPatternKlasterKemiskinanKotawaringinTimur_2.js',
  'healthcare': 'HealthcareFacilityFasilitasKesehatanKotawaringinTimur_9.js',
  'education': 'EducationFacilityFasilitasPendidikanKotawaringinTimur_11.js',
  'hospital-isochrone': 'IsochroneHospitalJangkauanPelayananRumahSakitKotawaringinTimur_8.js',
  'education-isochrone': 'IsochroneEducationJangkauanSMASMKKotawaringinTimur_10.js',
  'roads': 'RoadJalanKotawaringinTimur_6.js',
  'rivers': 'RiverSungaiKotawaringinTimur_7.js',
  'tourism': 'TourismandCulturalHeritagePariwisataKotawaringinTimur_4.js',
};

function loadGeoJson(layerId: string) {
  if (layerCache.has(layerId)) {
    return layerCache.get(layerId);
  }

  const filename = LAYER_FILE_MAP[layerId];
  if (!filename) return null;

  const filePath = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const jsonStr = raw.replace(/^var\s+[a-zA-Z0-9_]+\s*=\s*/, '').trim().replace(/;$/, '');
  const parsed = JSON.parse(jsonStr);
  layerCache.set(layerId, parsed);
  return parsed;
}

router.get('/layers/:layerId', (req, res) => {
  try {
    const { layerId } = req.params;
    const data = loadGeoJson(layerId);
    if (!data) {
      return res.status(404).json({ error: `Layer '${layerId}' not found.` });
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.json(data);
  } catch (error) {
    console.error('Error fetching layer:', error);
    return res.status(500).json({ error: 'Failed to fetch spatial layer' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const categoryStatsQuery = `
      SELECT 
        poverty_category,
        COUNT(*)::int AS count,
        ROUND(SUM(area_ha)::numeric, 2)::float AS total_area_ha,
        ROUND(AVG(area_ha)::numeric, 2)::float AS avg_area_ha
      FROM spatial_poverty_zones
      GROUP BY poverty_category
      ORDER BY total_area_ha DESC;
    `;

    const districtStatsQuery = `
      SELECT 
        district_name,
        COUNT(*)::int AS village_count,
        ROUND(SUM(area_ha)::numeric, 2)::float AS total_area_ha,
        ROUND(AVG(area_ha)::numeric, 2)::float AS avg_area_ha,
        COUNT(CASE WHEN poverty_category LIKE '%Urban Slum%' THEN 1 END)::int AS urban_slum_count,
        COUNT(CASE WHEN poverty_category LIKE '%Rural Area%' THEN 1 END)::int AS rural_dep_count,
        COUNT(CASE WHEN poverty_category LIKE '%Remote Area%' THEN 1 END)::int AS remote_asset_count
      FROM spatial_poverty_zones
      GROUP BY district_name
      ORDER BY total_area_ha DESC;
    `;

    const [categoryRes, districtRes] = await Promise.all([
      pool.query(categoryStatsQuery),
      pool.query(districtStatsQuery),
    ]);

    const totalArea = categoryRes.rows.reduce((sum, r) => sum + (r.total_area_ha || 0), 0);
    const totalVillages = categoryRes.rows.reduce((sum, r) => sum + (r.count || 0), 0);

    return res.json({
      summary: {
        totalVillages,
        totalAreaHa: Math.round(totalArea * 100) / 100,
        districtsCount: districtRes.rows.length,
      },
      categoryStats: categoryRes.rows,
      districtStats: districtRes.rows,
    });
  } catch (error) {
    console.error('Error computing spatial stats:', error);
    return res.status(500).json({ error: 'Failed to compute PostGIS spatial statistics' });
  }
});

router.get('/buffer-analysis', async (req, res) => {
  try {
    const lon = parseFloat(req.query.lon as string);
    const lat = parseFloat(req.query.lat as string);
    const radiusKm = parseFloat((req.query.radiusKm as string) || '10');

    if (isNaN(lon) || isNaN(lat)) {
      return res.status(400).json({ error: 'Valid lon and lat coordinates are required' });
    }

    const radiusMeters = radiusKm * 1000;

    const query = `
      SELECT 
        id,
        village_name,
        district_name,
        area_ha,
        poverty_category,
        ROUND(ST_Distance(
          geom::geography, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        )::numeric, 1)::float AS distance_meters,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM spatial_poverty_zones
      WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance_meters ASC
      LIMIT 60;
    `;

    const result = await pool.query(query, [lon, lat, radiusMeters]);

    let totalBufferArea = 0;
    const catMap: Record<string, number> = {};
    for (const row of result.rows) {
      totalBufferArea += row.area_ha || 0;
      catMap[row.poverty_category] = (catMap[row.poverty_category] || 0) + 1;
    }

    return res.json({
      center: { lon, lat },
      radiusKm,
      totalIntersectingZones: result.rows.length,
      totalAreaHa: Math.round(totalBufferArea * 100) / 100,
      breakdown: catMap,
      zones: result.rows,
    });
  } catch (error) {
    console.error('Error executing PostGIS buffer query:', error);
    return res.status(500).json({ error: 'Failed to run PostGIS spatial buffer query' });
  }
});

router.get('/bookmarks', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    let bookmarks;
    if (userId) {
      bookmarks = await db.select().from(spatialBookmarks)
        .where(eq(spatialBookmarks.userId, userId))
        .orderBy(desc(spatialBookmarks.createdAt));
    } else {
      bookmarks = await db.select().from(spatialBookmarks)
        .orderBy(desc(spatialBookmarks.createdAt))
        .limit(10);
    }
    return res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return res.status(500).json({ error: 'Failed to fetch spatial bookmarks' });
  }
});

router.post('/bookmarks', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { title, notes, centerLon, centerLat, zoom, activeLayers, districtFilter, povertyCategory } = req.body;
    if (!title || centerLon == null || centerLat == null || zoom == null) {
      return res.status(400).json({ error: 'Missing required bookmark parameters' });
    }

    const inserted = await db.insert(spatialBookmarks).values({
      userId: req.user?.uid || 'anonymous',
      title,
      notes: notes || '',
      centerLon: parseFloat(centerLon),
      centerLat: parseFloat(centerLat),
      zoom: parseFloat(zoom),
      activeLayers: activeLayers || ['poverty-patterns', 'districts', 'healthcare'],
      districtFilter: districtFilter || null,
      povertyCategory: povertyCategory || null,
    }).returning();

    return res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Error saving bookmark:', error);
    return res.status(500).json({ error: 'Failed to save spatial bookmark' });
  }
});

export default router;
