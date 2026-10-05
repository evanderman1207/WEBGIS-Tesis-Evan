-- ============================================================================
-- SKEMA BASIS DATA POSTGIS: WEBGIS ANALISIS SPASIAL KEMISKINAN KOTAWARINGIN TIMUR
-- Tesis Evan 2025: "Variasi Spasial Pembentuk Karakteristik Kemiskinan"
-- ============================================================================

-- 1. Mengaktifkan ekstensi spasial PostGIS jika belum aktif
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. DDL Tabel Kluster Kemiskinan (Poligon batas desa/kelurahan dengan atribut indikator)
CREATE TABLE IF NOT EXISTS kluster_kemiskinan (
    id SERIAL PRIMARY KEY,
    namobj VARCHAR(150) NOT NULL,                    -- Nama Desa / Kelurahan
    wadmkc VARCHAR(100) NOT NULL,                    -- Nama Kecamatan
    wadmkk VARCHAR(100) DEFAULT 'Kotawaringin Timur',-- Nama Kabupaten
    luas_ha NUMERIC(12, 2) NOT NULL,                 -- Luas Wilayah (Hektar)
    wq_pov VARCHAR(255) NOT NULL,                    -- Kategori Kluster Pola Kemiskinan
    rasio_ketergantungan NUMERIC(5, 2) DEFAULT 0.0,  -- Dependency Ratio (%)
    sanitasi_layak_persen NUMERIC(5, 2) DEFAULT 0.0, -- Akses Sanitasi Layak (%)
    kepemilikan_aset_skor NUMERIC(5, 2) DEFAULT 0.0, -- Indeks Kepemilikan Aset (0-100)
    akses_pendidikan_km NUMERIC(5, 2) DEFAULT 0.0,   -- Jarak Rata-rata ke SMA/SMK (km)
    akses_kesehatan_km NUMERIC(5, 2) DEFAULT 0.0,    -- Jarak Rata-rata ke Faskes (km)
    indeks_kerentanan NUMERIC(5, 2) DEFAULT 0.0,     -- Indeks Komposit Kerentanan Spasial
    geom GEOMETRY(MultiPolygon, 4326),               -- Kolom Geometri Spasial (WGS84 EPSG:4326)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Spasial GIST untuk mempercepat query spasial (ST_Intersects, ST_Contains, ST_Buffer, dll)
CREATE INDEX IF NOT EXISTS idx_kluster_kemiskinan_geom 
ON kluster_kemiskinan USING GIST (geom);

-- Indeks B-Tree untuk filter atribut
CREATE INDEX IF NOT EXISTS idx_kluster_kemiskinan_wadmkc 
ON kluster_kemiskinan (wadmkc);

CREATE INDEX IF NOT EXISTS idx_kluster_kemiskinan_wq_pov 
ON kluster_kemiskinan (wq_pov);


-- 3. DDL Tabel Area Bencana (Zona Bahaya Banjir Mentaya, Karhutla Lahan Gambut, dll)
CREATE TABLE IF NOT EXISTS area_bencana (
    id SERIAL PRIMARY KEY,
    nama_zona VARCHAR(150) NOT NULL,                 -- Nama Kawasan Risiko Bencana
    jenis_bencana VARCHAR(100) NOT NULL,             -- 'Banjir Luapan Sungai', 'Karhutla Lahan Gambut'
    tingkat_risiko VARCHAR(50) NOT NULL,             -- 'Tinggi', 'Sedang', 'Rendah'
    bobot_kerentanan NUMERIC(4, 2) DEFAULT 1.0,      -- Bobot Dampak Bencana (0.0 - 1.0)
    luas_zona_ha NUMERIC(12, 2) NOT NULL,            -- Luas Zona Bencana (Ha)
    geom GEOMETRY(MultiPolygon, 4326),               -- Geometri Spasial Poligon Bencana
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Spasial GIST untuk Area Bencana
CREATE INDEX IF NOT EXISTS idx_area_bencana_geom 
ON area_bencana USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_area_bencana_jenis 
ON area_bencana (jenis_bencana, tingkat_risiko);


-- ============================================================================
-- CONTOH KUERI ANALISIS SPASIAL POSTGIS TINGKAT LANJUT
-- ============================================================================

-- Query 1: Mengambil GeoJSON Kluster Kemiskinan
-- SELECT jsonb_build_object(
--     'type', 'FeatureCollection',
--     'features', jsonb_agg(
--         jsonb_build_object(
--             'type', 'Feature',
--             'geometry', ST_AsGeoJSON(geom)::jsonb,
--             'properties', to_jsonb(t) - 'geom'
--         )
--     )
-- ) FROM (SELECT id, namobj, wadmkc, luas_ha, wq_pov, geom FROM kluster_kemiskinan) t;

-- Query 2: Buffer Analysis (Zona Penyangga Jarak Rata-rata dari Fitur)
-- SELECT id, namobj, ST_AsGeoJSON(ST_Buffer(geom::geography, 3000)::geometry)::jsonb AS buffer_geom
-- FROM kluster_kemiskinan WHERE id = 1;

-- Query 3: Overlay Intersection Analysis (Tumpang-Tindih Kluster Kemiskinan vs Area Rawan Bencana)
-- SELECT 
--     k.id AS desa_id,
--     k.namobj AS nama_desa,
--     k.wadmkc AS kecamatan,
--     k.wq_pov AS tipe_kemiskinan,
--     b.jenis_bencana,
--     b.tingkat_risiko,
--     ROUND((ST_Area(ST_Intersection(k.geom, b.geom)::geography) / 10000.0)::numeric, 2) AS luas_terdampak_ha,
--     ST_AsGeoJSON(ST_Intersection(k.geom, b.geom))::jsonb AS geom_irisan
-- FROM kluster_kemiskinan k
-- JOIN area_bencana b 
--   ON ST_Intersects(k.geom, b.geom)
-- WHERE b.tingkat_risiko = 'Tinggi'
-- ORDER BY luas_terdampak_ha DESC;
