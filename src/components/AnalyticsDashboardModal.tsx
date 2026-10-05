import React, { useEffect, useState } from 'react';
import { X, BarChart3, PieChart, TrendingUp, FileText } from 'lucide-react';
import { PostGisStats } from '../types/spatial.ts';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface AnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsDashboardModal: React.FC<AnalyticsDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [stats, setStats] = useState<PostGisStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/spatial/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error('Failed to load spatial stats:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const pieData = stats?.categoryStats ? {
    labels: stats.categoryStats.map((c) => {
      if (c.poverty_category.includes('Urban Slum')) return 'Kawasan Kumuh Perkotaan';
      if (c.poverty_category.includes('Rural Area')) return 'Rasio Ketergantungan Tinggi (Pedesaan)';
      if (c.poverty_category.includes('Remote Area')) return 'Keterbatasan Kepemilikan Aset (Terpencil)';
      return c.poverty_category;
    }),
    datasets: [
      {
        data: stats.categoryStats.map((c) => c.total_area_ha),
        backgroundColor: [
          'rgba(239, 68, 68, 0.85)',
          'rgba(234, 179, 8, 0.85)',
          'rgba(168, 85, 247, 0.85)',
        ],
        borderColor: '#0f172a',
        borderWidth: 2,
      },
    ],
  } : null;

  const barData = stats?.districtStats ? {
    labels: stats.districtStats.slice(0, 10).map((d) => d.district_name),
    datasets: [
      {
        label: 'Total Luas Area Kemiskinan (Ha)',
        data: stats.districtStats.slice(0, 10).map((d) => d.total_area_ha),
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        borderRadius: 6,
      },
    ],
  } : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/80">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Dashboard Statistik & Analisis Spasial PostGIS
              </h3>
              <p className="text-xs text-slate-400">
                Data agregat hasil pemodelan spasial tesis Kabupaten Kotawaringin Timur
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

        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs custom-scrollbar">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              Memuat data statistik dari PostgreSQL/PostGIS...
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 text-xs block mb-1">Total Wilayah Dianalisis</span>
                  <span className="text-2xl font-bold font-mono text-sky-400">
                    {stats.summary.totalVillages} Desa/Kelurahan
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cakupan 17 Kecamatan Kotawaringin Timur
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 text-xs block mb-1">Total Luas Zona Terklasifikasi</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {stats.summary.totalAreaHa.toLocaleString('id-ID')} Ha
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Akumulasi polygon spasial penelitian
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 text-xs block mb-1">Pola Dominan Terluas</span>
                  <span className="text-lg font-bold text-amber-400">
                    Wilayah Pedesaan
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Karakteristik rasio ketergantungan tinggi
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center">
                  <h4 className="text-xs font-bold text-slate-200 mb-3 text-left w-full flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-amber-400" />
                    <span>Distribusi Luas Berdasarkan Pola Kemiskinan</span>
                  </h4>
                  <div className="w-64 h-64 flex items-center justify-center">
                    {pieData && (
                      <Pie
                        data={pieData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: { color: '#94a3b8', font: { size: 10 } },
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    <span>10 Kecamatan dengan Luas Klaster Terbesar (Ha)</span>
                  </h4>
                  <div className="h-64">
                    {barData && (
                      <Bar
                        data={barData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            x: {
                              ticks: { color: '#94a3b8', font: { size: 9 }, maxRotation: 45 },
                              grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            },
                            y: {
                              ticks: { color: '#94a3b8', font: { size: 9 } },
                              grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200 text-xs">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Kesimpulan Tipologi Spasial (Tesis Evan 2025)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/60">
                    <span className="font-bold text-red-400 block mb-1">1. Kawasan Kumuh Perkotaan</span>
                    Keterbatasan fasilitas dasar, kepadatan bangunan tinggi, dan sanitasi minim di perkotaan Sampit (Baamang & MB Ketapang).
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/60">
                    <span className="font-bold text-amber-400 block mb-1">2. Wilayah Pedesaan</span>
                    Rasio beban ketergantungan usia non-produktif tinggi, sektor dominan pertanian subsisten dan perkebunan sawit rakyat.
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-900/60">
                    <span className="font-bold text-purple-400 block mb-1">3. Wilayah Terpencil</span>
                    Keterbatasan kepemilikan aset, aksesibilitas transportasi minim (terisolasi dari jaringan jalan utama dan faskes rujukan).
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-red-400">
              Gagal memuat data statistik.
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
