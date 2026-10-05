import React, { useState } from 'react';
import { X, Navigation, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { BufferAnalysisResult } from '../types/spatial.ts';

interface PostGisBufferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunAnalysis: (lon: number, lat: number, radiusKm: number) => Promise<BufferAnalysisResult | null>;
  onHighlightResultOnMap: (result: BufferAnalysisResult) => void;
  initialCoord?: [number, number] | null;
  initialName?: string;
}

export const PostGisBufferModal: React.FC<PostGisBufferModalProps> = ({
  isOpen,
  onClose,
  onRunAnalysis,
  onHighlightResultOnMap,
  initialCoord,
  initialName,
}) => {
  const [lon, setLon] = useState<string>(initialCoord ? initialCoord[0].toString() : '112.95');
  const [lat, setLat] = useState<string>(initialCoord ? initialCoord[1].toString() : '-2.53');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BufferAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = async () => {
    const numLon = parseFloat(lon);
    const numLat = parseFloat(lat);
    if (isNaN(numLon) || isNaN(numLat)) {
      setError('Masukkan koordinat bujur dan lintang yang valid');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await onRunAnalysis(numLon, numLat, radiusKm);
      if (res) {
        setResult(res);
        onHighlightResultOnMap(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menjalankan analisis PostGIS');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Analisis Jangkauan Buffer PostGIS</h3>
              <p className="text-xs text-slate-400">
                Kueri spasial real-time ST_DWithin & ST_Intersects terhadap klaster kemiskinan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {initialName && (
            <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-sky-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Titik Acuan Terpilih: <strong>{initialName}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Bujur / Longitude (°E)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Lintang / Latitude (°S)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Radius Jangkauan (Buffer)
              </label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value={5}>5 Kilometer (Akses Lokal)</option>
                <option value={10}>10 Kilometer (Standar Faskes)</option>
                <option value={15}>15 Kilometer (Jangkauan SMA/SMK)</option>
                <option value={25}>25 Kilometer (Regional Kecamatan)</option>
                <option value={50}>50 Kilometer (Regional Kabupaten)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExecute}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menjalankan Kueri PostGIS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Eksekusi Kueri Spasial PostGIS</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="border border-slate-800 rounded-xl bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Hasil Analisis PostGIS</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Radius {result.radiusKm} km | {result.totalIntersectingZones} Klaster Terpotong
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Luas Terdampak</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {result.totalAreaHa.toLocaleString('id-ID')} Ha
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Jumlah Desa Terjangkau</span>
                  <span className="text-base font-bold text-sky-400 font-mono">
                    {result.totalIntersectingZones} Desa
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Komposisi Pola Kemiskinan di Dalam Radius:
                </span>
                <div className="space-y-1">
                  {Object.entries(result.breakdown).map(([category, count]) => (
                    <div
                      key={category}
                      className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-300 truncate max-w-[360px]">{category}</span>
                      <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                        {count} Desa
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-800/80 rounded-lg p-2 bg-slate-950/40">
                {result.zones.map((z) => (
                  <div
                    key={z.id}
                    className="flex items-center justify-between text-[11px] p-1.5 hover:bg-slate-800/50 rounded"
                  >
                    <div>
                      <span className="font-semibold text-white">{z.village_name}</span>
                      <span className="text-slate-500 text-[10px] ml-1.5">({z.district_name})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-mono font-semibold">
                        {(z.distance_meters / 1000).toFixed(2)} km
                      </span>
                      <span className="text-slate-500 text-[10px] ml-1.5">
                        {z.area_ha ? `${Math.round(z.area_ha)} Ha` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
