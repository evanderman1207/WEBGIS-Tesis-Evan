import React from 'react';
import { X, BookOpen, Compass, Database, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800/80">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tentang Platform WebGIS & Penelitian</h3>
              <p className="text-xs text-slate-400">
                Dokumentasi Tesis & Arsitektur Sistem Analisis Spasial
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

        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed custom-scrollbar">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="font-bold text-white text-sm block">
              Judul Penelitian Tesis (Evan, 2025):
            </span>
            <p className="text-sky-300 italic text-xs font-serif">
              "Variasi Spasial Pembentuk Karakteristik Kemiskinan Di Kabupaten Kotawaringin Timur"
            </p>
            <p className="text-slate-400 text-[11px] pt-1">
              WebGIS ini dikembangkan sebagai media informasi dan instrumen analisis spasial interaktif untuk mendukung pembelajaran, riset, serta perumusan kebijakan berbasis data spasial di bidang Perencanaan Wilayah dan Kota (PWK).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>3 Tipologi Pola Spasial Kemiskinan yang Ditemukan:</span>
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50">
                <span className="font-bold text-red-300 block mb-0.5">
                  1. Kawasan Kumuh Perkotaan (Urban Slum)
                </span>
                <p className="text-[11px] text-slate-300">
                  Terkonsentrasi di distrik perkotaan Sampit (Kecamatan Baamang dan Mentawa Baru Ketapang). Karakteristik utama berupa keterbatasan sanitasi lingkungan, drainase buruk, kepadatan tinggi, dan permukiman bantaran Sungai Mentaya.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/50">
                <span className="font-bold text-amber-300 block mb-0.5">
                  2. Wilayah Pedesaan (Rural Area - High Dependency Ratio)
                </span>
                <p className="text-[11px] text-slate-300">
                  Mendominasi kawasan tengah dan perkebunan. Dicirikan oleh tingginya rasio beban ketergantungan generasi non-produktif terhadap pencari nafkah, ketergantungan pada upah buruh sawit atau tani musiman.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/50">
                <span className="font-bold text-purple-300 block mb-0.5">
                  3. Wilayah Terpencil (Remote Area - Limited Assets)
                </span>
                <p className="text-[11px] text-slate-300">
                  Tersebar di wilayah pedalaman hulu sungai dan pesisir selatan (Pulau Hanaut, Teluk Sampit, Bukit Santuai). Ketiadaan akses jaringan jalan memadai, keterbatasan kepemilikan aset rumah tangga, serta jarak tempuh jauh ke fasilitas kesehatan rujukan.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Database className="w-4 h-4 text-sky-400" />
              <span>Arsitektur Sistem Modern:</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span><strong className="text-white">Frontend:</strong> React 19 + OpenLayers v10 + Tailwind CSS</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span><strong className="text-white">Spatial Database:</strong> PostgreSQL 16 + PostGIS 3.6 (geodesic buffer kueri ST_DWithin & ST_Intersects)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span><strong className="text-white">Backend & ORM:</strong> Node.js Express + Drizzle ORM + Connection Pooling</span>
              </li>
            </ul>
          </div>
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
