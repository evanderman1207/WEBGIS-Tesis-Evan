import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Globe2, 
  ListTree, 
  SlidersHorizontal, 
  MapPin, 
  CloudSun, 
  Split, 
  Wind, 
  ShieldAlert, 
  Play, 
  Trash2, 
  Ruler, 
  Check, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft,
  Mail,
  GraduationCap,
  Sparkles,
  School,
  HeartPulse,
  Compass,
  Footprints,
  Trees,
  Maximize2
} from 'lucide-react';

export default function LayerManagerPanel({
  activeSidebarTab = 'layers',
  setActiveSidebarTab,
  layersConfig,
  setLayersConfig,
  layerOpacity,
  setLayerOpacity,
  swipeEnabled,
  setSwipeEnabled,
  swipePosition,
  setSwipePosition,
  showWindParticles,
  setShowWindParticles,
  windPattern,
  setWindPattern,
  windSpeedMode,
  setWindSpeedMode,
  windDensity,
  setWindDensity,
  basemapType,
  setBasemapType,
  onRunBuffer,
  onRunOverlay,
  onClearAnalysis,
  analysisLoading,
  analysisResult,
  selectedFeature,
  onSelectVillage,
  weatherData,
  onRefreshWeather,
  onStartMeasure,
  onClosePanel
}) {
  // Wilayah List & Filter
  const [villageSearch, setVillageSearch] = useState('');
  const [clusterFilter, setClusterFilter] = useState('all');
  const [allVillages, setAllVillages] = useState([]);

  // Form State Analisis Spasial
  const [bufferRadius, setBufferRadius] = useState(2500);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [overlayKecamatan, setOverlayKecamatan] = useState('all');
  const [overlayBencana, setOverlayBencana] = useState('all');
  const [kecamatanList, setKecamatanList] = useState([]);

  useEffect(() => {
    fetch('/api/poverty-clusters')
      .then(r => r.json())
      .then(data => {
        if (data && data.features) {
          const list = data.features.map(f => ({
            id: f.id,
            name: f.properties.NAMOBJ || f.properties.namobj,
            kecamatan: f.properties.WADMKC || f.properties.wadmkc,
            type: f.properties.wq_Pov || f.properties.wq_pov,
            luas: f.properties.Luas_Ha || f.properties.luas_ha,
            properties: f.properties
          })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setAllVillages(list);
          if (list.length > 0 && !selectedVillageId) {
            setSelectedVillageId(list[0].id);
          }

          const kSet = new Set(data.features.map(f => f.properties.WADMKC || f.properties.wadmkc).filter(Boolean));
          setKecamatanList(Array.from(kSet).sort());
        }
      })
      .catch(() => {});
  }, []);

  const toggleLayer = (layerKey) => {
    setLayersConfig(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  const updateOpacity = (layerKey, val) => {
    setLayerOpacity(prev => ({
      ...prev,
      [layerKey]: parseFloat(val)
    }));
  };

  // Filter Desa
  const filteredVillages = allVillages.filter(v => {
    const matchSearch = (v.name || '').toLowerCase().includes(villageSearch.toLowerCase()) ||
                        (v.kecamatan || '').toLowerCase().includes(villageSearch.toLowerCase());
    if (!matchSearch) return false;

    if (clusterFilter === 'pedesaan') return (v.type || '').includes('Rural') || (v.type || '').includes('Pedesaan');
    if (clusterFilter === 'terpencil') return (v.type || '').includes('Remote') || (v.type || '').includes('Terpencil');
    if (clusterFilter === 'kumuh') return (v.type || '').includes('Urban') || (v.type || '').includes('Kumuh') || (v.type || '').includes('sanitation');
    return true;
  });

  return (
    <aside className="w-full h-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col select-none overflow-hidden relative">
      {/* Header Panel dengan Navigasi Tab Glassmorphism & Tombol Tutup */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/40 p-2 shrink-0">
        {/* 6 Tab Icon Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 pr-1">
          <button
            onClick={() => setActiveSidebarTab('layers')}
            className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeSidebarTab === 'layers'
                ? 'text-indigo-400 bg-indigo-500/20 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Lapisan Tematik & Vektor"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lapisan</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('basemap')}
            className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeSidebarTab === 'basemap'
                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Peta Dasar (Satelit HD & OSM)"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Basemap</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('legend')}
            className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeSidebarTab === 'legend'
                ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Legenda Kartografis"
          >
            <ListTree className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Legenda</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('tools')}
            className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeSidebarTab === 'tools'
                ? 'text-sky-400 bg-sky-500/20 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Alat Analisis (Swipe, Angin & PostGIS)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Alat</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('wilayah')}
            className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeSidebarTab === 'wilayah'
                ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Daftar Wilayah Desa / Kelurahan"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Wilayah</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('cuaca')}
            className={`py-1.5 px-2.5 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeSidebarTab === 'cuaca'
                ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Cuaca Terkini Kotawaringin Timur"
          >
            <CloudSun className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Cuaca</span>
          </button>
        </div>

        {/* Tombol Ciutkan / Tutup Panel */}
        <button
          onClick={onClosePanel}
          className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors shadow-sm cursor-pointer ml-1"
          title="Ciutkan Panel Kiri"
          aria-label="Tutup Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Konten Scrollable */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* TAB 1: LAPISAN (SELURUH 10 DATASET KOTIM) */}
        {activeSidebarTab === 'layers' && (
          <div className="space-y-3.5">
            {/* Kelompok 1: Klaster & Pola Kemiskinan */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3.5 space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Klaster & Pola Kemiskinan</span>
              </div>

              {/* 1. Klaster Kemiskinan Kotim */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.povertyClusters}
                      onChange={() => toggleLayer('povertyClusters')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Klaster Kemiskinan (Tesis 2025)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.povertyClusters ?? 0.55) * 100)}%
                  </span>
                </div>
                {layersConfig.povertyClusters && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.povertyClusters ?? 0.55}
                    onChange={(e) => updateOpacity('povertyClusters', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-indigo-500"
                  />
                )}
              </div>

              {/* 2. Pola Spasial Kemiskinan */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.povertyPatterns}
                      onChange={() => toggleLayer('povertyPatterns')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Pola Spasial Kemiskinan</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.povertyPatterns ?? 0.5) * 100)}%
                  </span>
                </div>
                {layersConfig.povertyPatterns && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.povertyPatterns ?? 0.5}
                    onChange={(e) => updateOpacity('povertyPatterns', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-purple-500"
                  />
                )}
              </div>
            </div>

            {/* Kelompok 2: Fisik & Lingkungan */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3.5 space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Fisik, Hidrologi & Bencana</span>
              </div>

              {/* 3. Batas Kecamatan */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.districtBoundary}
                      onChange={() => toggleLayer('districtBoundary')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Batas 17 Kecamatan</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.districtBoundary ?? 0.8) * 100)}%
                  </span>
                </div>
                {layersConfig.districtBoundary && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.districtBoundary ?? 0.8}
                    onChange={(e) => updateOpacity('districtBoundary', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-slate-400"
                  />
                )}
              </div>

              {/* 4. Sungai Mentaya & Badan Air */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.rivers}
                      onChange={() => toggleLayer('rivers')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Sungai Mentaya & Badan Air</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.rivers ?? 0.75) * 100)}%
                  </span>
                </div>
                {layersConfig.rivers && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.rivers ?? 0.75}
                    onChange={(e) => updateOpacity('rivers', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-sky-400"
                  />
                )}
              </div>

              {/* 5. Zona Risiko Bencana */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.disasterRisk}
                      onChange={() => toggleLayer('disasterRisk')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Risiko Bencana (Banjir & Karhutla)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.disasterRisk ?? 0.5) * 100)}%
                  </span>
                </div>
                {layersConfig.disasterRisk && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.disasterRisk ?? 0.5}
                    onChange={(e) => updateOpacity('disasterRisk', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-orange-500"
                  />
                )}
              </div>

              {/* 6. Jaringan Jalan */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.roads}
                      onChange={() => toggleLayer('roads')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Jaringan Jalan Kotim</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.roads ?? 0.65) * 100)}%
                  </span>
                </div>
                {layersConfig.roads && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.roads ?? 0.65}
                    onChange={(e) => updateOpacity('roads', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-yellow-400"
                  />
                )}
              </div>
            </div>

            {/* Kelompok 3: Fasilitas Publik & Isochrone Pelayanan */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3.5 space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Fasilitas & Jangkauan Isochrone</span>
              </div>

              {/* 7. Fasilitas Kesehatan */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.healthcareFacilities}
                      onChange={() => toggleLayer('healthcareFacilities')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Fasilitas Kesehatan (RS/Puskesmas)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.healthcareFacilities ?? 1.0) * 100)}%
                  </span>
                </div>
                {layersConfig.healthcareFacilities && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.healthcareFacilities ?? 1.0}
                    onChange={(e) => updateOpacity('healthcareFacilities', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-emerald-500"
                  />
                )}
              </div>

              {/* 8. Isochrone Pelayanan Rumah Sakit */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.isochroneHospital}
                      onChange={() => toggleLayer('isochroneHospital')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Isochrone Rumah Sakit (5-50 km)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.isochroneHospital ?? 0.45) * 100)}%
                  </span>
                </div>
                {layersConfig.isochroneHospital && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.isochroneHospital ?? 0.45}
                    onChange={(e) => updateOpacity('isochroneHospital', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-teal-400"
                  />
                )}
              </div>

              {/* 9. Fasilitas Pendidikan */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.educationFacilities}
                      onChange={() => toggleLayer('educationFacilities')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Fasilitas Pendidikan (SD-SMA/SMK)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.educationFacilities ?? 0.9) * 100)}%
                  </span>
                </div>
                {layersConfig.educationFacilities && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.educationFacilities ?? 0.9}
                    onChange={(e) => updateOpacity('educationFacilities', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-blue-400"
                  />
                )}
              </div>

              {/* 10. Isochrone Pendidikan SMA/SMK */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.isochroneEducation}
                      onChange={() => toggleLayer('isochroneEducation')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Isochrone SMA/SMK (15-50 km)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.isochroneEducation ?? 0.45) * 100)}%
                  </span>
                </div>
                {layersConfig.isochroneEducation && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.isochroneEducation ?? 0.45}
                    onChange={(e) => updateOpacity('isochroneEducation', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-amber-500"
                  />
                )}
              </div>

              {/* 11. Pariwisata & Cagar Budaya */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!layersConfig.tourism}
                      onChange={() => toggleLayer('tourism')}
                      className="gis-switch cursor-pointer"
                    />
                    <span>Pariwisata & Cagar Budaya</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((layerOpacity.tourism ?? 1.0) * 100)}%
                  </span>
                </div>
                {layersConfig.tourism && (
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.tourism ?? 1.0}
                    onChange={(e) => updateOpacity('tourism', e.target.value)}
                    className="gis-slider w-full cursor-pointer accent-amber-400"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BASEMAP (HANYA SATELIT HD & OSM STANDAR) */}
        {activeSidebarTab === 'basemap' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Pilih peta dasar resolusi tinggi untuk visualisasi spasial:
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Kartu 1: Satelit HD (Default) */}
              <button
                onClick={() => setBasemapType('satellite')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden group ${
                  basemapType === 'satellite' || basemapType === 'carto_dark'
                    ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/40 shadow-xl'
                    : 'border-white/10 bg-slate-950/40 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Globe2 className="w-4 h-4" />
                  </div>
                  {(basemapType === 'satellite' || basemapType === 'carto_dark') && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400"></span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Satelit HD</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ArcGIS World Imagery</div>
                </div>
              </button>

              {/* Kartu 2: OSM Standar */}
              <button
                onClick={() => setBasemapType('osm')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden group ${
                  basemapType === 'osm'
                    ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/40 shadow-xl'
                    : 'border-white/10 bg-slate-950/40 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  {basemapType === 'osm' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">OSM Standar</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">OpenStreetMap Carto</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: LEGENDA DINAMIS (HANYA UNTUK LAYER YANG AKTIF) */}
        {activeSidebarTab === 'legend' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400">
              Legenda dinamis menampilkan simbol/klasifikasi untuk layer yang sedang aktif:
            </div>

            {/* 1. Klaster Kemiskinan */}
            {layersConfig.povertyClusters && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200">Klaster Kemiskinan Kotim</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-indigo-500/80 border border-indigo-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">Kawasan Kumuh (Urban Slum)</div>
                      <div className="text-[10px] text-slate-400">Defisit sanitasi & fasilitas dasar perkotaan</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500/80 border border-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">Pedesaan (High Dependency)</div>
                      <div className="text-[10px] text-slate-400">Rasio ketergantungan ekonomi tinggi</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-red-500/80 border border-red-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">Wilayah Terpencil (Limited Asset)</div>
                      <div className="text-[10px] text-slate-400">Keterbatasan kepemilikan aset & aksesibilitas</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Risiko Bencana */}
            {layersConfig.disasterRisk && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200">Risiko Bencana</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-cyan-500/70 border border-cyan-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">Banjir Luapan Sungai Mentaya</div>
                      <div className="text-[10px] text-slate-400">Koridor Baamang, Mentawa Baru, Kota Besi</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-orange-600/70 border border-orange-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">Karhutla Lahan Gambut</div>
                      <div className="text-[10px] text-slate-400">Kawasan rawan kebakaran lahan gambut</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Isochrone RS */}
            {layersConfig.isochroneHospital && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200">Jangkauan Pelayanan Rumah Sakit</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500/60 border border-emerald-400 shrink-0" />
                    <span className="text-slate-200">Radius 5.000 meter (Zona Layanan Utama)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-teal-500/60 border border-teal-400 shrink-0" />
                    <span className="text-slate-200">Radius 10.000 meter</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-blue-500/50 border border-blue-400 shrink-0" />
                    <span className="text-slate-200">Radius 25.000 - 50.000 meter</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Isochrone Pendidikan */}
            {layersConfig.isochroneEducation && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200">Jangkauan Fasilitas SMA/SMK</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500/60 border border-amber-400 shrink-0" />
                    <span className="text-slate-200">Radius 15.000 - 25.000 meter</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-purple-500/50 border border-purple-400 shrink-0" />
                    <span className="text-slate-200">Radius 30.000 - 50.000 meter</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Fasilitas Kesehatan */}
            {layersConfig.healthcareFacilities && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200">Fasilitas Kesehatan</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 border border-white shrink-0" />
                    <span className="text-slate-200">Rumah Sakit Umum & Pratama</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white shrink-0" />
                    <span className="text-slate-200">Puskesmas Induk & Pembantu</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Fasilitas Pendidikan */}
            {layersConfig.educationFacilities && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200">Fasilitas Pendidikan</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 border border-white shrink-0" />
                    <span className="text-slate-200">SMA / SMK / Perguruan Tinggi</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white shrink-0" />
                    <span className="text-slate-200">SMP / SD / TK</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Sungai Mentaya */}
            {layersConfig.rivers && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200">Badan Air & Sungai</div>
                <div className="flex items-center gap-2.5 text-[11px]">
                  <span className="w-3.5 h-3.5 rounded bg-sky-500/70 border border-sky-400 shrink-0" />
                  <span className="text-slate-200">Sungai Mentaya & Jalur Aliran Sungai</span>
                </div>
              </div>
            )}

            {/* 8. Jaringan Jalan */}
            {layersConfig.roads && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200">Jaringan Jalan</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-1 bg-orange-500 rounded-sm shrink-0" />
                    <span className="text-slate-200">Jalan Primer / Nasional</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-0.5 bg-yellow-400 rounded-sm shrink-0" />
                    <span className="text-slate-200">Jalan Sekunder / Lokal</span>
                  </div>
                </div>
              </div>
            )}

            {/* 9. Pariwisata */}
            {layersConfig.tourism && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200">Pariwisata & Budaya</div>
                <div className="flex items-center gap-2.5 text-[11px]">
                  <span className="w-3 h-3 rounded-full bg-amber-400 border border-white shrink-0" />
                  <span className="text-slate-200">Objek Wisata & Cagar Budaya</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ALAT ANALISIS (SWIPE + SIMULASI ANGIN DENGAN STATUS ILUSTRATIF + POSTGIS) */}
        {activeSidebarTab === 'tools' && (
          <div className="space-y-4">
            {/* Alat 1: Tirai Pembanding (Swipe Tool) */}
            <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Split className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">Tirai Pembanding (Swipe)</span>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={swipeEnabled}
                    onChange={(e) => setSwipeEnabled(e.target.checked)}
                    className="gis-switch cursor-pointer"
                  />
                </label>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Membandingkan secara visual Klaster Kemiskinan di sisi kiri dengan Risiko Bencana di sisi kanan peta.
              </p>

              {swipeEnabled && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Posisi Tirai:</span>
                    <span className="font-mono font-bold text-indigo-400">{Math.round(swipePosition)}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={swipePosition}
                    onChange={(e) => setSwipePosition(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Alat 2: Simulasi Aliran Angin (DENGAN STATUS "Simulasi ilustratif") */}
            <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Wind className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200">Simulasi Aliran Angin</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300">
                    Simulasi ilustratif
                  </span>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWindParticles}
                    onChange={(e) => setShowWindParticles(e.target.checked)}
                    className="gis-switch cursor-pointer"
                  />
                </label>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Visualisasi dinamika partikel 60 FPS transparan merepresentasikan pola mikro-iklim muson Kotawaringin Timur.
              </p>

              {showWindParticles && (
                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pola Aliran Muson:
                    </label>
                    <select
                      value={windPattern}
                      onChange={(e) => setWindPattern(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="muson_tenggara">Muson Tenggara (Musim Kemarau)</option>
                      <option value="muson_barat">Muson Barat Daya (Musim Hujan)</option>
                      <option value="sirkulasi_mentaya">Sirkulasi Lembah DAS Mentaya</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Kecepatan Partikel:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['slow', 'medium', 'fast'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setWindSpeedMode(mode)}
                          className={`py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            windSpeedMode === mode
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                              : 'bg-slate-900 text-slate-400 border border-white/5 hover:bg-slate-800'
                          }`}
                        >
                          {mode === 'slow' ? 'Lambat' : mode === 'fast' ? 'Cepat' : 'Sedang'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Alat 3: Analisis Spasial PostGIS Buffer */}
            <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">PostGIS ST_Buffer (Jangkauan)</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Target Wilayah:</label>
                  <select
                    value={selectedVillageId}
                    onChange={(e) => setSelectedVillageId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                  >
                    {allVillages.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.kecamatan})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Radius Penyangga:</span>
                    <span className="font-mono text-indigo-400 font-bold">{(bufferRadius / 1000).toFixed(1)} km</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={bufferRadius}
                    onChange={(e) => setBufferRadius(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <button
                  onClick={() => onRunBuffer(selectedVillageId, bufferRadius)}
                  disabled={analysisLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{analysisLoading ? 'Menghitung PostGIS...' : 'Jalankan Analisis Buffer'}</span>
                </button>

                {analysisResult && (
                  <button
                    onClick={onClearAnalysis}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/5"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus Hasil Analisis Peta</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WILAYAH (DAFTAR KECAMATAN / DESA DENGAN FILTER KLASTER) */}
        {activeSidebarTab === 'wilayah' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={villageSearch}
                onChange={(e) => setVillageSearch(e.target.value)}
                placeholder="Cari desa atau kecamatan..."
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Klaster Tesis */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'pedesaan', label: 'Pedesaan' },
                { id: 'terpencil', label: 'Terpencil' },
                { id: 'kumuh', label: 'Kumuh' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setClusterFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                    clusterFilter === tab.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-950/40 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-400">
              Menampilkan <span className="font-mono text-white font-bold">{filteredVillages.length}</span> wilayah
            </div>

            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {filteredVillages.map(v => (
                <div
                  key={v.id}
                  onClick={() => onSelectVillage(v.name, v.properties)}
                  className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-900/80 border border-white/5 hover:border-indigo-500/40 transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {v.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Kecamatan {v.kecamatan}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CUACA TERKINI OPEN-METEO */}
        {activeSidebarTab === 'cuaca' && (
          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Stasiun Cuaca Kotawaringin Timur</span>
                </div>
                <button
                  onClick={onRefreshWeather}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Segarkan Data Cuaca"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {weatherData?.temp ? `${weatherData.temp}°C` : '29.4°C'}
                  </div>
                  <div className="text-xs font-semibold text-amber-300 mt-0.5">
                    {weatherData?.condition || 'Cerah Berawan'}
                  </div>
                </div>
                <span className="text-4xl">
                  {weatherData?.icon || '🌤️'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                <div className="p-2 bg-slate-900/60 rounded-lg border border-white/5">
                  <div className="text-[10px] text-slate-400">Kecepatan Angin</div>
                  <div className="font-mono font-bold text-sky-300 mt-0.5">{weatherData?.windSpeed || '14 km/j'}</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-lg border border-white/5">
                  <div className="text-[10px] text-slate-400">Kelembaban Relatif</div>
                  <div className="font-mono font-bold text-emerald-300 mt-0.5">{weatherData?.humidity || 78}%</div>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 text-right">
                Pembaruan: {weatherData?.timestamp || 'Terkini'} · Open-Meteo API
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ATRIBUSI RESMI: KARYA PENELITI EVAN (2025) */}
      <div className="p-3 border-t border-white/10 bg-slate-950/60 shrink-0 space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Evan (2025) · MPWK UGM</span>
          </span>
          <span className="font-mono text-slate-400 text-[9px]">NIM 23/513022/PTK/15068</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-slate-400 pt-0.5">
          <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
          <a href="mailto:dermanevan@gmail.com" className="text-indigo-300 hover:underline font-mono">dermanevan@gmail.com</a>
          <span>•</span>
          <a href="mailto:evan1999@mail.ugm.ac.id" className="text-emerald-300 hover:underline font-mono">evan1999@mail.ugm.ac.id</a>
        </div>
      </div>
    </aside>
  );
}
