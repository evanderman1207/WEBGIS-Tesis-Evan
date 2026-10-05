import fs from 'fs';
import path from 'path';
import { pool } from './index.ts';

export async function seedDatabase() {
  try {
    const checkRes = await pool.query('SELECT COUNT(*) FROM spatial_poverty_zones');
    const count = parseInt(checkRes.rows[0].count, 10);
    if (count > 0) {
      console.log(`[Seed] spatial_poverty_zones already has ${count} records.`);
      return;
    }

    console.log('[Seed] Seeding spatial_poverty_zones from research data...');
    const dataPath = path.join(process.cwd(), 'data', 'SpatialPatternPovertyPolaSpasialKemiskinanKotawaringinTimur_5.js');
    if (!fs.existsSync(dataPath)) {
      console.warn(`[Seed] Data file not found at ${dataPath}`);
      return;
    }

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const jsonStr = raw.replace(/^var\s+[a-zA-Z0-9_]+\s*=\s*/, '').trim().replace(/;$/, '');
    const geojson = JSON.parse(jsonStr);

    let inserted = 0;
    for (const feature of geojson.features) {
      const props = feature.properties || {};
      const village = props.NAMOBJ || 'Unknown';
      const district = props.WADMKC || 'Unknown';
      const regency = props.WADMKK || 'Kotawaringin Timur';
      const areaHa = parseFloat(props.Luas_Ha) || 0;
      const povCat = props.wq_Pov || 'Uncategorized';
      const geomJson = JSON.stringify(feature.geometry);

      // Insert polygon and centroid into PostGIS
      await pool.query(
        `INSERT INTO spatial_poverty_zones 
          (village_name, district_name, regency_name, area_ha, poverty_category, geom, centroid)
         VALUES 
          ($1, $2, $3, $4, $5, ST_SetSRID(ST_GeomFromGeoJSON($6), 4326), ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($6), 4326)))`,
        [village, district, regency, areaHa, povCat, geomJson]
      );

      // Also record in analytics table
      await pool.query(
        `INSERT INTO spatial_poverty_analysis
          (district_name, village_name, poverty_category, area_ha, asset_status, dependency_ratio_rank)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [district, village, povCat, areaHa, props['wq_Join Ne'] || null, props['wq_Join De'] || null]
      );

      inserted++;
    }

    console.log(`[Seed] Successfully seeded ${inserted} spatial poverty zones with PostGIS geometries.`);
  } catch (error) {
    console.error('[Seed] Error seeding spatial data:', error);
  }
}
