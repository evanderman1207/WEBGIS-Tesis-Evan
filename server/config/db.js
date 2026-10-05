const { Pool } = require('pg');

// Konfigurasi koneksi PostgreSQL / PostGIS
const pool = new Pool({
  host: process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.PGPORT || process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.PGDATABASE || process.env.POSTGRES_DB || 'webgis_kotim',
  user: process.env.PGUSER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || '',
  connectionTimeoutMillis: 2000,
  max: 10
});

let isPostgisConnected = false;
let postgisVersionString = null;

/**
 * Memeriksa ketersediaan koneksi PostgreSQL dan ekstensi PostGIS
 */
async function checkPostgisConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT PostGIS_Full_Version();');
    client.release();
    isPostgisConnected = true;
    postgisVersionString = res.rows[0]?.postgis_full_version || 'PostGIS Active';
    console.log(`[PostGIS] Terhubung ke PostgreSQL PostGIS: ${postgisVersionString.split(' ')[0]}`);
    return { connected: true, version: postgisVersionString };
  } catch (err) {
    isPostgisConnected = false;
    postgisVersionString = 'Embedded PostGIS Engine (Simulated Fallback)';
    return { connected: false, fallback: true, message: err.message };
  }
}

// Inisialisasi awal
checkPostgisConnection().catch(() => {});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  checkPostgisConnection,
  isPostgisActive: () => isPostgisConnected,
  getVersion: () => postgisVersionString
};
