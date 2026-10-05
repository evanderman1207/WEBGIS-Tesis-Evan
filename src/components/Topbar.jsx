import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Database, 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen, 
  RotateCcw,
  Layers,
  Info,
  Download,
  FileSpreadsheet,
  X
} from 'lucide-react';

export default function Topbar({
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen,
  onSearchSelect,
  serverStatus,
  onResetView,
  onExportMap,
  onExportCSV,
  selectedFeature,
  onOpenAbout,
  weatherData,
  onOpenWeatherTab
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allVillages, setAllVillages] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/poverty-clusters')
      .then(r => r.json())
      .then(data => {
        if (data && data.features) {
          const list = data.features.map(f => ({
            id: f.id,
            name: f.properties.NAMOBJ || f.properties.namobj || 'Desa Tanpa Nama',
            kecamatan: f.properties.WADMKC || f.properties.wadmkc || '-',
            type: f.properties.wq_Pov || f.properties.wq_pov || '-'
          }));
          setAllVillages(list);
        }
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcut Ctrl+K atau /
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }
    const q = searchTerm.toLowerCase();
    const matched = allVillages
      .filter(v => v.name.toLowerCase().includes(q) || v.kecamatan.toLowerCase().includes(q))
      .slice(0, 8);
    setSuggestions(matched);
  }, [searchTerm, allVillages]);

  const handleSelect = (item) => {
    setSearchTerm(item.name);
    setShowSuggestions(false);
    onSearchSelect(item.name);
  };

  return (
    <header className="h-16 px-4 py-2 flex items-center justify-between z-50 select-none relative pointer-events-auto bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 shadow-lg shrink-0">
      {/* Sisi Kiri: Branding Tesis & Toggle Panel Kiri */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
            leftPanelOpen 
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm' 
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10'
          }`}
          title={leftPanelOpen ? "Tutup Layer Manager" : "Buka Layer Manager"}
          aria-label={leftPanelOpen ? "Tutup Panel Kiri" : "Buka Panel Kiri"}
        >
          {leftPanelOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/70 backdrop-blur-md border border-white/10 shadow-md">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight">
                WebGIS Tesis Evan
              </h1>
              <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 border border-indigo-500/40 px-1.5 py-0.5 rounded-md hidden md:inline">
                Kotim 2025
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none truncate max-w-[240px] lg:max-w-xs mt-0.5">
              Analisis Spasial Klaster Kemiskinan & Risiko Bencana
            </p>
          </div>
        </div>
      </div>

      {/* Bagian Tengah: Floating Search Bar Modern */}
      <div className="relative w-64 md:w-80 lg:w-[380px] mx-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Cari desa, kelurahan, atau kecamatan..."
            className="w-full pl-9 pr-16 py-2 bg-slate-900/80 hover:bg-slate-900/95 focus:bg-slate-950 backdrop-blur-md border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-full text-xs text-slate-100 placeholder-slate-400 transition-all outline-none shadow-lg"
          />
          
          <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
            {searchTerm ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                  setShowSuggestions(false);
                }}
                className="pointer-events-auto p-0.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-white/10 rounded shadow-xs">
                Ctrl K
              </kbd>
            )}
          </div>
        </div>

        {/* Dropdown Autocomplete */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl py-1.5 z-50 overflow-hidden max-h-72 overflow-y-auto">
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/10">
              Hasil Pencarian Wilayah
            </div>
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item)}
                className="w-full px-3.5 py-2 text-left hover:bg-indigo-600/20 flex items-center justify-between text-xs transition-colors border-b border-white/5 last:border-0 group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      Kec. {item.kecamatan}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-white/10 shrink-0 font-medium">
                  {item.type.includes('Rural') || item.type.includes('Pedesaan') ? 'Pedesaan' : 
                   item.type.includes('Remote') || item.type.includes('Terpencil') ? 'Terpencil' : 'Kumuh Perkotaan'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sisi Kanan: Widget Cuaca, PostGIS Engine, Tombol Aksi, & Toggle Panel Kanan Terpisah Horizontal */}
      <div className="flex items-center gap-2.5">
        {/* Widget Cuaca Real-Time Sampit (Terpisah Horizontal) */}
        <div 
          onClick={onOpenWeatherTab}
          className="hidden xl:flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-md border border-slate-700/50 hover:border-amber-400/50 rounded-xl px-2.5 py-1.5 text-xs cursor-pointer transition shadow-md group"
          title="Klik untuk membuka tab cuaca lengkap"
        >
          <span className="text-base leading-none">
            {weatherData ? weatherData.icon : '🌤️'}
          </span>
          <div className="leading-tight">
            <div className="text-[11px] font-bold text-white flex items-center gap-1 whitespace-nowrap">
              <span>Sampit:</span>
              <span className="text-amber-400 font-mono font-bold">
                {weatherData?.temp ? `${weatherData.temp}°C` : '29,4°C'}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 block whitespace-nowrap group-hover:text-slate-300">
              {weatherData?.condition || 'Cerah Berawan'}
            </span>
          </div>
        </div>

        {/* Status PostGIS Engine */}
        <div 
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl text-xs shadow-md"
          title={`Status Server: ${serverStatus?.status || 'Online'} | Engine: ${serverStatus?.postgis?.version || 'PostGIS Engine'}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-200 text-[11px] font-semibold tracking-tight hidden 2xl:inline">
            PostGIS
          </span>
          <Database className="w-3.5 h-3.5 text-indigo-400" />
        </div>

        {/* Ekspor Peta PNG */}
        <button
          onClick={onExportMap}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          title="Ekspor Peta ke Gambar PNG"
          aria-label="Ekspor Peta PNG"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span className="text-[11px] font-medium hidden 2xl:inline">Ekspor Peta</span>
        </button>

        {/* Ekspor CSV */}
        <button
          onClick={onExportCSV}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          title="Ekspor Data Atribut Wilayah ke CSV"
          aria-label="Ekspor Data CSV"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-medium hidden 2xl:inline">Ekspor CSV</span>
        </button>

        {/* Reset View */}
        <button
          onClick={onResetView}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 shadow-md transition-all cursor-pointer"
          title="Fokus ke Wilayah Studi (Kotawaringin Timur)"
          aria-label="Reset Tampilan Peta"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Informasi Riset Tesis (Terpisah Horizontal) */}
        <button
          onClick={onOpenAbout}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 shadow-md transition-all cursor-pointer"
          title="Tentang Penelitian Tesis & Metodologi"
          aria-label="Informasi Riset"
        >
          <Info className="w-4 h-4 text-indigo-400" />
        </button>

        {/* Toggle Panel Kanan (Atribut) */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
            rightPanelOpen 
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm' 
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
          }`}
          title={rightPanelOpen ? "Tutup Panel Atribut" : "Buka Panel Atribut"}
          aria-label={rightPanelOpen ? "Tutup Panel Kanan" : "Buka Panel Kanan"}
        >
          {rightPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
