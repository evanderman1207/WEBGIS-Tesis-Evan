import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import spatialRouter from './src/routes/spatial.ts';
import { seedDatabase } from './src/db/seed.ts';
import { pool } from './src/db/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/spatial', spatialRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW() AS now, PostGIS_Version() AS postgis');
    res.json({
      status: 'ok',
      database: 'connected',
      postgis: dbRes.rows[0]?.postgis || 'active',
      timestamp: dbRes.rows[0]?.now,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'degraded', error: err?.message });
  }
});

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));
app.use('/legend', express.static(path.join(process.cwd(), 'legend')));
app.use('/data', express.static(path.join(process.cwd(), 'data')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(Number(PORT), HOST, () => {
  console.log(`[WebGIS] Server listening on http://${HOST}:${PORT}`);
  seedDatabase().catch((err) => {
    console.warn('[WebGIS] Non-fatal seed note:', err.message);
  });
});
