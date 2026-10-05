import React, { useEffect, useState } from 'react';
import { 
  Database, 
  BarChart3, 
  Ruler, 
  Bookmark, 
  Layers, 
  Info, 
  MapPin, 
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenAnalytics: () => void;
  onOpenBufferTool: () => void;
  onOpenBookmarks: () => void;
  onOpenInfo: () => void;
  isMeasuring: boolean;
  onToggleMeasure: () => void;
  measureType: 'distance' | 'area';
  onChangeMeasureType: (type: 'distance' | 'area') => void;
  currentCoord: [number, number] | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onOpenAnalytics,
  onOpenBufferTool,
  onOpenBookmarks,
  onOpenInfo,
  isMeasuring,
  onToggleMeasure,
  measureType,
  onChangeMeasureType,
  currentCoord,
}) => {
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; version?: string }>({
    connected: false,
  });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setDbStatus({ connected: true, version: data.postgis });
        }
      })
      .catch(() => {
        setDbStatus({ connected: false });
      });
  }, []);

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none shadow-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          title="Toggle Panel Lapisan"
          className={`p-2 rounded-lg border transition-all ${
            isSidebarOpen 
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' 
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Layers className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>WEBGIS ANALISIS SPASIAL KEMISKINAN</span>
            </h1>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/80">
              Kotawaringin Timur
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Tesis Evan 2025: Variasi Spasial Karakteristik Kemiskinan
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onOpenBufferTool}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Analisis Buffer PostGIS</span>
          <span className="md:hidden">Buffer</span>
        </button>

        <button
          onClick={onOpenAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Statistik & Grafik</span>
          <span className="md:hidden">Statistik</span>
        </button>

        <div className="flex items-center bg-slate-800/90 rounded-lg border border-slate-700 p-0.5 shadow-sm">
          <button
            onClick={onToggleMeasure}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              isMeasuring
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Alat Ukur Jarak / Luas"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ukur</span>
          </button>

          {isMeasuring && (
            <div className="flex items-center pl-1 border-l border-slate-700 ml-1">
              <button
                onClick={() => onChangeMeasureType('distance')}
                className={`px-1.5 py-0.5 text-[11px] rounded ${
                  measureType === 'distance' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Jarak
              </button>
              <button
                onClick={() => onChangeMeasureType('area')}
                className={`px-1.5 py-0.5 text-[11px] rounded ${
                  measureType === 'area' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Luas
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onOpenBookmarks}
          title="Tersimpan & Titik Tinjau"
          className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shadow-sm"
        >
          <Bookmark className="w-4 h-4 text-indigo-400" />
        </button>

        <button
          onClick={onOpenInfo}
          title="Tentang Penelitian & Metodologi"
          className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shadow-sm"
        >
          <Info className="w-4 h-4 text-sky-400" />
        </button>
      </div>

      <div className="hidden lg:flex items-center gap-3">
        {currentCoord && (
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
            <span>{currentCoord[0].toFixed(4)}°E, {currentCoord[1].toFixed(4)}°S</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 border border-slate-700">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          {dbStatus.connected ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>PostGIS 3.6 Aktif</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span>Menghubungkan...</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
