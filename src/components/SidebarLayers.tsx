import React, { useState } from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Sliders, 
  Map as MapIcon, 
  ChevronDown, 
  ChevronUp, 
  X,
  Filter
} from 'lucide-react';
import { LayerConfig } from '../types/spatial.ts';

interface SidebarLayersProps {
  layers: LayerConfig[];
  onToggleLayer: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  activeBasemap: string;
  onChangeBasemap: (basemap: string) => void;
  isOpen: boolean;
  onClose: () => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  districtsList: string[];
}

export const SidebarLayers: React.FC<SidebarLayersProps> = ({
  layers,
  onToggleLayer,
  onChangeOpacity,
  activeBasemap,
  onChangeBasemap,
  isOpen,
  onClose,
  selectedDistrict,
  onSelectDistrict,
  districtsList,
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'basemap'>('layers');
  const [expandedLegends, setExpandedLegends] = useState<Record<string, boolean>>({
    'poverty-patterns': true,
    'healthcare': true,
  });

  const toggleLegend = (id: string) => {
    setExpandedLegends((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const basemaps = [
    { id: 'osm', name: 'OpenStreetMap Standard', desc: 'Peta jalan dan toponimi terbuka' },
    { id: 'esri-satellite', name: 'ESRI World Imagery', desc: 'Citra satelit resolusi tinggi' },
    { id: 'carto-dark', name: 'CartoDB Dark Matter', desc: 'Tema gelap kontras tinggi untuk visualisasi' },
    { id: 'opentopo', name: 'OpenTopo Topografi', desc: 'Kontur dan elevasi geografis' },
  ];

  if (!isOpen) return null;

  return (
    <aside className="absolute top-16 left-0 bottom-0 w-80 md:w-96 bg-slate-900/95 border-r border-slate-800 backdrop-blur-md z-20 flex flex-col shadow-2xl transition-all">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'layers'
                ? 'bg-sky-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lapisan & Legenda</span>
          </button>
          <button
            onClick={() => setActiveTab('basemap')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'basemap'
                ? 'bg-sky-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Peta Dasar</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Tutup Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {activeTab === 'layers' && (
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>Fokus Wilayah Kecamatan</span>
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => onSelectDistrict(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-sky-500 transition"
          >
            <option value="ALL">Semua Kecamatan Kotawaringin Timur (17)</option>
            {districtsList.map((d) => (
              <option key={d} value={d}>
                Kecamatan {d}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {activeTab === 'basemap' ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">
              Pilih penyedia peta dasar untuk latar belakang analisis:
            </p>
            {basemaps.map((b) => (
              <button
                key={b.id}
                onClick={() => onChangeBasemap(b.id)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  activeBasemap === b.id
                    ? 'bg-sky-950/50 border-sky-500/80 text-sky-200 ring-1 ring-sky-500/40'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{b.name}</span>
                  {activeBasemap === b.id && (
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{b.desc}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {layers.map((layer) => {
              const isExpanded = expandedLegends[layer.id];
              return (
                <div
                  key={layer.id}
                  className={`rounded-xl border transition-all ${
                    layer.visible
                      ? 'bg-slate-800/70 border-slate-700/80 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onToggleLayer(layer.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span
                        className={`p-1 rounded ${
                          layer.visible ? 'text-sky-400 bg-sky-950/80' : 'text-slate-500 bg-slate-800'
                        }`}
                      >
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-100">{layer.name}</h4>
                        {layer.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-1">{layer.description}</p>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => toggleLegend(layer.id)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/60 transition"
                      title="Lihat Legenda Simbologi"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {layer.visible && (
                    <div className="px-3 pb-2 pt-0.5 border-t border-slate-800/60 flex items-center gap-2">
                      <Sliders className="w-3 h-3 text-slate-500" />
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={layer.opacity}
                        onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                        title={`Transparansi: ${Math.round(layer.opacity * 100)}%`}
                      />
                      <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  )}

                  {isExpanded && layer.legendItems && (
                    <div className="px-3 py-2 bg-slate-950/50 rounded-b-xl border-t border-slate-800/70 text-[11px] space-y-1.5">
                      {layer.legendItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-600/50"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-300 text-[10.5px] leading-tight">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Sumber: BPS & Tesis Evan 2025</span>
        <span className="text-sky-400 font-mono">EPSG:4326 / 3857</span>
      </div>
    </aside>
  );
};
