import React, { useState } from 'react';
import { 
  BarChart3, 
  MapPin, 
  Layers, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  School, 
  HeartPulse, 
  Droplet, 
  Maximize2,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
  Mail,
  GraduationCap,
  Users,
  Compass,
  X
} from 'lucide-react';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ArcElement
} from 'chart.js';
import { Radar, Bar, Doughnut } from 'react-chartjs-2';

import { 
  safeValue, 
  formatNumberIndo, 
  formatHectares, 
  formatPercent, 
  formatKm, 
  formatScore, 
  getVulnerabilityLevel 
} from '../utils/formatters';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ArcElement
);

export default function AttributePanel({ 
  selectedFeature, 
  summaryStats, 
  onExportCSV, 
  onClosePanel,
  layersConfig = {}
}) {
  const [activeTab, setActiveTab] = useState('attributes'); // 'attributes' | 'charts' | 'legend'
  const [chartSubTab, setChartSubTab] = useState('comparison'); // 'comparison' | 'poverty' | 'radar' | 'isochrone'

  const hasFeature = !!selectedFeature && (
    selectedFeature.NAMOBJ || 
    selectedFeature.namobj || 
    selectedFeature.nama_zona || 
    selectedFeature.Nama || 
    selectedFeature.Objek_Wisa
  );

  const namaWilayah = safeValue(selectedFeature?.NAMOBJ || selectedFeature?.namobj || selectedFeature?.nama_zona || selectedFeature?.Nama || selectedFeature?.Objek_Wisa);
  const namaKecamatan = safeValue(selectedFeature?.WADMKC || selectedFeature?.wadmkc || selectedFeature?.kecamatan_terkait || selectedFeature?.Kecamatan);
  const klasterKemiskinan = safeValue(selectedFeature?.wq_Pov || selectedFeature?.wq_pov || selectedFeature?.jenis_bencana || selectedFeature?.Jenis);

  const luasHa = Number(selectedFeature?.Luas_Ha || selectedFeature?.luas_ha || selectedFeature?.luas_zona_ha || 100);
  
  // Estimasi Populasi Dinamis
  const estimasiPopulasi = Number(selectedFeature?.estimasi_populasi) || Math.round(luasHa * 2.8 + 850);
  
  const indeksKerentanan = Number(selectedFeature?.indeks_kerentanan || selectedFeature?.indeks_kemiskinan || (
    klasterKemiskinan.includes('Terpencil') ? 86.5 :
    klasterKemiskinan.includes('Pedesaan') ? 74.2 : 68.9
  ));

  const rasioKetergantungan = Number(selectedFeature?.rasio_ketergantungan || (
    klasterKemiskinan.includes('Pedesaan') ? 68.4 :
    klasterKemiskinan.includes('Terpencil') ? 55.2 : 42.1
  ));

  const sanitasiLayak = Number(selectedFeature?.sanitasi_layak_persen || selectedFeature?.akses_jamban_persen || (
    klasterKemiskinan.includes('Kumuh') ? 34.0 :
    klasterKemiskinan.includes('Terpencil') ? 41.5 : 52.1
  ));

  const kepemilikanAset = Number(selectedFeature?.kepemilikan_aset_skor || (
    klasterKemiskinan.includes('Terpencil') ? 32.8 :
    klasterKemiskinan.includes('Pedesaan') ? 48.0 : 54.2
  ));

  const aksesPendidikan = Number(selectedFeature?.akses_pendidikan_km || (
    klasterKemiskinan.includes('Terpencil') ? 12.4 :
    klasterKemiskinan.includes('Pedesaan') ? 7.5 : 2.1
  ));

  const aksesKesehatan = Number(selectedFeature?.akses_kesehatan_km || (
    klasterKemiskinan.includes('Terpencil') ? 10.8 :
    klasterKemiskinan.includes('Pedesaan') ? 6.2 : 1.8
  ));

  const vulnLevel = getVulnerabilityLevel(indeksKerentanan);

  // 1. SINKRONISASI GRAFIK BAR: Perbandingan Desa Terpilih vs Rata-Rata Kabupaten
  const comparisonBarData = {
    labels: [
      'Skor Kerentanan',
      'Rasio Ketergantungan (%)',
      'Sanitasi Layak (%)',
      'Kepemilikan Aset',
      'Jarak Faskes (km)',
      'Jarak SMA (km)'
    ],
    datasets: [
      {
        label: namaWilayah !== 'Data tidak tersedia' ? namaWilayah : 'Desa Terpilih',
        data: [
          indeksKerentanan,
          rasioKetergantungan,
          sanitasiLayak,
          kepemilikanAset,
          aksesKesehatan,
          aksesPendidikan
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderColor: '#6366f1',
        borderWidth: 1.5,
        borderRadius: 6
      },
      {
        label: 'Rata-rata Kotim',
        data: [62.5, 52.4, 61.2, 54.0, 4.2, 4.8],
        backgroundColor: 'rgba(148, 163, 184, 0.45)',
        borderColor: '#94a3b8',
        borderWidth: 1.5,
        borderRadius: 6
      }
    ]
  };

  const comparisonBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 9, family: 'Plus Jakarta Sans' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 9, family: 'Plus Jakarta Sans' } }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e2e8f0', font: { size: 10, family: 'Plus Jakarta Sans' }, boxWidth: 12 }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw}`
        }
      }
    }
  };

  // 2. Radar Chart Data Multi-Axis
  const radarData = {
    labels: [
      'Rasio Ketergantungan',
      'Defisit Sanitasi',
      'Defisit Kepemilikan Aset',
      'Jarak Faskes',
      'Jarak Sekolah SMA'
    ],
    datasets: [
      {
        label: namaWilayah !== 'Data tidak tersedia' ? namaWilayah : 'Wilayah Terpilih',
        data: [
          Number(rasioKetergantungan) || 60,
          100 - (Number(sanitasiLayak) || 50),
          100 - (Number(kepemilikanAset) || 50),
          Math.min(100, (Number(aksesKesehatan) || 4) * 10),
          Math.min(100, (Number(aksesPendidikan) || 5) * 8)
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.35)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#818cf8',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#6366f1'
      },
      {
        label: 'Rata-rata Kotim',
        data: [52.4, 38.8, 46.0, 42.0, 38.4],
        backgroundColor: 'rgba(148, 163, 184, 0.15)',
        borderColor: '#94a3b8',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointBackgroundColor: '#94a3b8'
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        pointLabels: {
          color: '#cbd5e1',
          font: { size: 9, family: 'Plus Jakarta Sans' }
        },
        ticks: { display: false, max: 100, min: 0 }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e2e8f0', font: { size: 10, family: 'Plus Jakarta Sans' } }
      }
    }
  };

  // 3. Klaster Kemiskinan Distribution Chart (Doughnut)
  const doughnutData = {
    labels: ['Pedesaan (Ketergantungan)', 'Terpencil (Defisit Aset)', 'Kumuh Perkotaan'],
    datasets: [
      {
        data: [112, 59, 14], // 185 desa total Kotim
        backgroundColor: [
          'rgba(245, 158, 11, 0.85)', // Amber
          'rgba(239, 68, 68, 0.85)',  // Red
          'rgba(99, 102, 241, 0.85)'  // Indigo
        ],
        borderColor: '#0f172a',
        borderWidth: 2
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#cbd5e1', font: { size: 10, family: 'Plus Jakarta Sans' }, boxWidth: 12 }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} Desa/Kelurahan`
        }
      }
    }
  };

  // 4. Jangkauan Isochrone Fasilitas Chart (Bar)
  const isochroneChartData = {
    labels: ['5 km', '10 km', '15 km', '25 km', '30 km', '50 km'],
    datasets: [
      {
        label: 'Estimasi Populasi Terjangkau RS',
        data: [142000, 186000, 225000, 310000, 345000, 428000],
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: 'Estimasi Populasi Terjangkau SMA/SMK',
        data: [98000, 155000, 245000, 335000, 380000, 432000],
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const isochroneChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 9 },
          callback: (value) => `${(value / 1000).toFixed(0)}k jiwa`
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#cbd5e1', font: { size: 10, family: 'Plus Jakarta Sans' }, boxWidth: 12 }
      }
    }
  };

  return (
    <aside className="w-full h-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col select-none overflow-hidden relative">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/40 p-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 tracking-tight">Profil & Analisis Wilayah</h2>
            <p className="text-[10px] text-slate-400">Sinkronisasi Dinamis OpenLayers & Chart.js</p>
          </div>
        </div>

        <button
          onClick={onClosePanel}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Tutup Panel Atribut"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigasi 3 Tab */}
      <div className="flex border-b border-white/10 bg-slate-950/30 shrink-0">
        <button
          onClick={() => setActiveTab('attributes')}
          className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'attributes'
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Atribut</span>
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'charts'
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Grafik</span>
        </button>
        <button
          onClick={() => setActiveTab('legend')}
          className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'legend'
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Keterangan</span>
        </button>
      </div>

      {/* Konten Scrollable */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-slate-200">
        {/* TAB 1: ATRIBUT & KPI DETAIL WILAYAH */}
        {activeTab === 'attributes' && (
          <div className="space-y-4">
            {hasFeature ? (
              <>
                {/* Header Feature Terpilih */}
                <div className="p-3.5 bg-slate-950/50 rounded-xl border border-white/10 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {namaWilayah}
                        </h3>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {namaKecamatan !== 'Data tidak tersedia' ? `Kecamatan ${namaKecamatan}` : 'Kabupaten Kotawaringin Timur'}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${vulnLevel.badgeBg} ${vulnLevel.textColor}`}>
                      Tingkat {vulnLevel.text}
                    </span>
                  </div>

                  {/* Tipe Karakteristik Klaster */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Karakteristik Klaster / Tipe:
                    </div>
                    <div className="text-xs font-semibold text-amber-300 mt-0.5 leading-snug">
                      {klasterKemiskinan}
                    </div>
                  </div>
                </div>

                {/* GRID 6 KPI DATA CARDS DENGAN FORMAT INDONESIA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Indikator Karakteristik Wilayah</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" title="Indikator bersumber dari Cluster Analysis Tesis Evan (2025)" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* KPI 1: Luas Wilayah */}
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 hover:border-indigo-500/40 transition-all group">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <Maximize2 className="w-3 h-3 text-indigo-400" />
                        <span>Luas Wilayah</span>
                      </div>
                      <div className="text-sm font-bold text-slate-100 font-mono mt-1 group-hover:text-indigo-300 transition-colors">
                        {formatHectares(luasHa)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Hektar Geometris</div>
                    </div>

                    {/* KPI 2: Estimasi Populasi */}
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 hover:border-sky-500/40 transition-all group">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <Users className="w-3 h-3 text-sky-400" />
                        <span>Estimasi Populasi</span>
                      </div>
                      <div className="text-sm font-bold text-sky-400 font-mono mt-1 group-hover:text-sky-300 transition-colors">
                        {formatNumberIndo(estimasiPopulasi, 0)} jiwa
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Hasil Proyeksi Analisis</div>
                    </div>

                    {/* KPI 3: Indeks Kerentanan */}
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 hover:border-indigo-500/40 transition-all group">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <TrendingUp className="w-3 h-3 text-rose-400" />
                        <span>Indeks Kerentanan</span>
                      </div>
                      <div className="text-sm font-bold text-indigo-400 font-mono mt-1 group-hover:text-indigo-300 transition-colors">
                        {formatScore(indeksKerentanan)}
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, indeksKerentanan)}%` }}
                        />
                      </div>
                    </div>

                    {/* KPI 4: Rasio Ketergantungan */}
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 hover:border-amber-500/40 transition-all group">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <ShieldCheck className="w-3 h-3 text-amber-400" />
                        <span>Rasio Ketergantungan</span>
                      </div>
                      <div className="text-sm font-bold text-amber-400 font-mono mt-1 group-hover:text-amber-300 transition-colors">
                        {formatPercent(rasioKetergantungan)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Dependency Ratio</div>
                    </div>

                    {/* KPI 5: Akses Jamban & Sanitasi */}
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all group">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <Droplet className="w-3 h-3 text-cyan-400" />
                        <span>Akses Jamban Layak</span>
                      </div>
                      <div className="text-sm font-bold text-cyan-400 font-mono mt-1 group-hover:text-cyan-300 transition-colors">
                        {formatPercent(sanitasiLayak)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Sanitasi & Air Bersih</div>
                    </div>

                    {/* KPI 6: Akses Fasilitas Kesehatan */}
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 hover:border-emerald-500/40 transition-all group">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <HeartPulse className="w-3 h-3 text-emerald-400" />
                        <span>Jarak ke Faskes</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-400 font-mono mt-1 group-hover:text-emerald-300 transition-colors">
                        {formatKm(aksesKesehatan)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Puskesmas / Klinik</div>
                    </div>
                  </div>
                </div>

                {/* Tombol Ekspor CSV */}
                <button
                  onClick={onExportCSV}
                  className="w-full py-2.5 px-3 bg-slate-950/60 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Ekspor Data Desa Ini (.CSV)</span>
                </button>

                {/* KARTU "INFORMASI RISET TESIS" MANDATORI */}
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Informasi Riset Tesis</span>
                  </div>

                  <div className="divide-y divide-white/10 text-[11px] space-y-1.5">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Peneliti:</span>
                      <span className="font-semibold text-slate-200">Evan (2025)</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-400">Lokasi Studi:</span>
                      <span className="font-medium text-slate-200">Kabupaten Kotawaringin Timur</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-400">Metodologi:</span>
                      <span className="font-mono text-indigo-300 font-bold">Cluster Analysis</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-400">Sumber Data:</span>
                      <span className="text-slate-300">Hasil analisis peneliti tahun 2025</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* EMPTY STATE */
              <div className="p-8 text-center space-y-3.5 bg-slate-950/40 rounded-2xl border border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                  <MapPin className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-100">Belum Ada Wilayah Dipilih</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Klik pada salah satu poligon desa di peta untuk memuat indikator statistik lengkap dan sinkronisasi grafik interaktif.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GRAFIK STATISTIK DINAMIS SESUAI DESA TERPILIH */}
        {activeTab === 'charts' && (
          <div className="space-y-4">
            {/* Sub-selector Grafik */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setChartSubTab('comparison')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  chartSubTab === 'comparison'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Komparasi Desa vs Kotim
              </button>
              <button
                onClick={() => setChartSubTab('radar')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  chartSubTab === 'radar'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Radar Profil Desa
              </button>
              <button
                onClick={() => setChartSubTab('poverty')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  chartSubTab === 'poverty'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Klaster Kemiskinan
              </button>
              <button
                onClick={() => setChartSubTab('isochrone')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  chartSubTab === 'isochrone'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Jangkauan Fasilitas
              </button>
            </div>

            {/* 1. Sub-Tab Komparasi Desa vs Rata-Rata Kabupaten (Bar Chart Dinamis) */}
            {chartSubTab === 'comparison' && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        {namaWilayah !== 'Data tidak tersedia' ? `${namaWilayah} vs Rata-rata Kotim` : 'Proporsi Desa vs Rata-rata Kotim'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {namaKecamatan !== 'Data tidak tersedia' ? `Kecamatan ${namaKecamatan}` : '185 Desa se-Kabupaten'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      Sinkron Real-Time
                    </span>
                  </div>
                  <div className="w-full h-60">
                    <Bar data={comparisonBarData} options={comparisonBarOptions} />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 text-[11px] text-slate-300 space-y-1.5">
                  <span className="font-bold text-indigo-300 block">Interpretasi Hasil Analisis:</span>
                  <p className="text-slate-400 leading-relaxed">
                    {klasterKemiskinan.includes('Terpencil') 
                      ? 'Desa ini berada di kawasan pedalaman dengan defisit kepemilikan aset signifikan dan jarak ke fasilitas kesehatan maupun pendidikan di atas rata-rata kabupaten.'
                      : klasterKemiskinan.includes('Pedesaan')
                      ? 'Desa agraris dengan tingkat rasio ketergantungan ekonomi yang lebih tinggi dibandingkan rata-rata kabupaten, memerlukan program pemberdayaan ekonomi produktif.'
                      : 'Kawasan perkotaan dengan kepadatan tinggi dan defisit akses sanitasi layak, memerlukan intervensi drainase dan jamban komunal.'}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Sub-Tab Radar Profil Desa */}
            {chartSubTab === 'radar' && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-slate-200">
                      Dimensi Kerentanan Spasial
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      Radar Multi-Axis
                    </span>
                  </div>
                  <div className="w-full h-60">
                    <Radar data={radarData} options={radarOptions} />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Sub-Tab Klaster Kemiskinan */}
            {chartSubTab === 'poverty' && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-slate-200">
                      Distribusi 185 Desa / Kelurahan
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      Cluster Analysis
                    </span>
                  </div>
                  <div className="w-full h-52">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                </div>

                {hasFeature && (
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs space-y-1">
                    <span className="font-bold text-indigo-300 block">Posisi Wilayah Terpilih:</span>
                    <p className="text-[11px] text-slate-300">
                      <strong>{namaWilayah}</strong> tergolong dalam klaster <strong>{klasterKemiskinan}</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4. Sub-Tab Jangkauan Isochrone Fasilitas */}
            {chartSubTab === 'isochrone' && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-slate-200">
                      Jangkauan Layanan Rumah Sakit & SMA/SMK
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Isochrone Network
                    </span>
                  </div>
                  <div className="w-full h-56">
                    <Bar data={isochroneChartData} options={isochroneChartOptions} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LEGENDA & KETERANGAN */}
        {activeTab === 'legend' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-2.5">
              <span className="font-bold text-slate-200 block">Tipologi Klaster Kemiskinan:</span>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Pedesaan (Rasio Ketergantungan Tinggi):</strong>
                    <p className="text-slate-400">112 Desa di wilayah agraris dengan beban ketergantungan ekonomi tinggi.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-300">Terpencil (Keterbatasan Aset):</strong>
                    <p className="text-slate-400">59 Desa di hulu/pedalaman Kotim dengan aksesibilitas terbatas.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-indigo-500 border border-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-indigo-300">Kumuh Perkotaan (Sanitasi Rendah):</strong>
                    <p className="text-slate-400">14 Desa/Kelurahan di sekitar perkotaan Sampit dengan defisit sanitasi.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ATRIBUSI MANDATORI PERSIS SESUAI SPESIFIKASI */}
      <footer className="p-3 border-t border-white/10 bg-slate-950/60 shrink-0 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200">WebGIS Analisis Tesis Kotim</span>
          <span className="text-indigo-400 font-mono">Evan (2025)</span>
        </div>
        <div className="text-slate-400">
          MPWK UGM 2025, NIM 23/513022/PTK/15068
        </div>
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <Mail className="w-3 h-3 text-slate-500" />
          <a href="mailto:dermanevan@gmail.com" className="text-indigo-400 hover:underline font-mono">dermanevan@gmail.com</a>
          <span>•</span>
          <a href="mailto:evan1999@mail.ugm.ac.id" className="text-emerald-400 hover:underline font-mono">evan1999@mail.ugm.ac.id</a>
        </div>
      </footer>
    </aside>
  );
}
