import React from 'react';
import { X, MapPin, ShieldAlert, Navigation } from 'lucide-react';

interface FeatureInspectorProps {
  featureData: Record<string, any> | null;
  onClose: () => void;
  onRunBufferForFeature?: (lon: number, lat: number, name: string) => void;
}

export const FeatureInspector: React.FC<FeatureInspectorProps> = ({
  featureData,
  onClose,
  onRunBufferForFeature,
}) => {
  if (!featureData) return null;

  const isPovertyZone = !!featureData.wq_Pov || !!featureData.poverty_category;
  const povTitle = featureData.wq_Pov || featureData.poverty_category || '';
  const village = featureData.NAMOBJ || featureData.village_name || featureData.Nama || 'Fitur Terpilih';
  const district = featureData.WADMKC || featureData.district_name || '';
  const areaHa = featureData.Luas_Ha || featureData.area_ha;
  const facilityType = featureData.Jenis || featureData.JENIS;

  let badgeBg = 'bg-slate-800 text-slate-300';
  if (povTitle.includes('Urban Slum') || povTitle.includes('Kawasan Kumuh')) {
    badgeBg = 'bg-red-950/80 text-red-300 border-red-800/80';
  } else if (povTitle.includes('Rural Area') || povTitle.includes('Pedesaan')) {
    badgeBg = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
  } else if (povTitle.includes('Remote Area') || povTitle.includes('Terpencil')) {
    badgeBg = 'bg-purple-950/80 text-purple-300 border-purple-800/80';
  }

  return (
    <div className="absolute right-4 top-20 bottom-8 w-80 md:w-96 bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-2xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/50">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
            {facilityType ? `Fasilitas: ${facilityType}` : 'Informasi Spasial'}
          </span>
          <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">{village}</h3>
          {district && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>Kecamatan {district}, Kotim</span>
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar text-xs">
        {isPovertyZone && (
          <div className="p-3.5 rounded-xl border bg-slate-950/70 border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Klasifikasi Pola Kemiskinan</span>
            </div>
            <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${badgeBg}`}>
              {povTitle}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              {areaHa != null && (
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Luas Wilayah</span>
                  <span className="text-white font-mono font-bold text-xs">
                    {Number(areaHa).toLocaleString('id-ID')} Ha
                  </span>
                </div>
              )}
              {featureData['wq_Join De'] != null && (
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Join Dependency</span>
                  <span className="text-sky-300 font-mono font-semibold">
                    Rank {featureData['wq_Join De']}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Atribut Lengkap Geodata
          </span>
          <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/30">
            {Object.entries(featureData)
              .filter(([k]) => !['geometry', 'layer', 'style'].includes(k))
              .map(([key, value]) => (
                <div key={key} className="p-2 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400 font-mono">{key}:</span>
                  <span className="text-slate-200 text-right truncate max-w-[180px]">
                    {String(value ?? '-')}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {onRunBufferForFeature && featureData._coords && (
          <button
            onClick={() => onRunBufferForFeature(featureData._coords[0], featureData._coords[1], village)}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Navigation className="w-4 h-4" />
            <span>Jalankan Analisis Jangkauan Buffer PostGIS</span>
          </button>
        )}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-950/50 text-[10px] text-slate-500 text-center">
        Analisis Spasial Berbasis PostGIS & OpenLayers
      </div>
    </div>
  );
};
