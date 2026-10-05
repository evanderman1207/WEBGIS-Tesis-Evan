import React, { useState, useEffect, useRef } from 'react';
import Topbar from './Topbar';
import LayerManagerPanel from './LayerManagerPanel';
import MapComponent from './MapComponent';
import AttributePanel from './AttributePanel';
import { BookOpen, Database, GraduationCap, X, Layers, FileText } from 'lucide-react';

export default function DashboardLayout() {
  // Panel States
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('layers'); // 'layers' | 'basemap' | 'legend' | 'tools' | 'wilayah' | 'cuaca'
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // 10 Geospatial Layers Configuration
  const [layersConfig, setLayersConfig] = useState({
    districtBoundary: true,      // 1. Batas Kecamatan Kotawaringin Timur
    rivers: true,                // 2. Sungai Mentaya & Badan Air
    povertyClusters: true,       // 3. Klaster Kemiskinan Kotim (185 Desa)
    povertyPatterns: false,      // 4. Pola Spasial Kemiskinan
    disasterRisk: true,          // 5. Zona Risiko Bencana (Banjir DAS & Karhutla Gambut)
    isochroneHospital: false,    // 6. Isochrone RS
    isochroneEducation: false,   // 7. Isochrone SMA/SMK
    roads: false,                // 8. Jaringan Jalan Kotim
    healthcareFacilities: true,  // 9. Fasilitas Kesehatan
    educationFacilities: false,  // 10. Fasilitas Pendidikan
    tourism: false               // 11. Pariwisata & Cagar Budaya
  });

  // Layer Opacity Settings
  const [layerOpacity, setLayerOpacity] = useState({
    districtBoundary: 0.8,
    rivers: 0.75,
    povertyClusters: 0.65,
    povertyPatterns: 0.5,
    disasterRisk: 0.55,
    isochroneHospital: 0.45,
    isochroneEducation: 0.45,
    roads: 0.65,
    healthcareFacilities: 1.0,
    educationFacilities: 0.9,
    tourism: 1.0
  });

  // Basemap State: 'satellite' (Default HD) | 'osm' (OpenStreetMap)
  const [basemapType, setBasemapType] = useState('satellite');

  // Fitur Swipe Pembanding (Split-screen)
  const [swipeEnabled, setSwipeEnabled] = useState(false);
  const [swipePosition, setSwipePosition] = useState(50);
  const [swipeLeftLayer, setSwipeLeftLayer] = useState('povertyClusters');
  const [swipeRightLayer, setSwipeRightLayer] = useState('disasterRisk');

  // Engine Simulasi Aliran Angin Transparan
  const [showWindParticles, setShowWindParticles] = useState(false);
  const [windPattern, setWindPattern] = useState('muson_tenggara'); // 'muson_tenggara' | 'muson_barat' | 'sirkulasi_mentaya'
  const [windSpeedMode, setWindSpeedMode] = useState('medium');     // 'slow' | 'medium' | 'fast'
  const [windDensity, setWindDensity] = useState(1200);

  // Seleksi Fitur & Pencarian
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [zoomToTarget, setZoomToTarget] = useState(null);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Cuaca Real-Time Open-Meteo untuk Sampit / Kotawaringin Timur
  const [weatherData, setWeatherData] = useState(null);

  const [serverStatus, setServerStatus] = useState({
    status: 'online',
    postgis: { active: false, version: 'Checking...' }
  });
  const [summaryStats, setSummaryStats] = useState(null);

  const mapComponentRef = useRef(null);

  // Fetch Cuaca Real-Time Open-Meteo
  const fetchKotimWeather = async () => {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-2.53&longitude=112.95&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      const current = data.current;

      const code = current.weather_code;
      let condition = 'Cerah Berawan';
      let icon = '🌤️';

      if (code === 0) { condition = 'Cerah'; icon = '☀️'; }
      else if (code >= 1 && code <= 3) { condition = 'Cerah Berawan'; icon = '🌤️'; }
      else if (code >= 45 && code <= 48) { condition = 'Berkabut'; icon = '🌫️'; }
      else if (code >= 51 && code <= 65) { condition = 'Hujan Ringan/Sedang'; icon = '🌧️'; }
      else if (code >= 80 && code <= 82) { condition = 'Hujan Lebat'; icon = '⛈️'; }
      else if (code >= 95) { condition = 'Hujan Badai'; icon = '⚡'; }

      setWeatherData({
        temp: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: `${current.wind_speed_10m} km/j`,
        rain: current.precipitation,
        condition,
        icon,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      setWeatherData({
        temp: 29.4,
        humidity: 78,
        windSpeed: '14 km/j',
        rain: 0.0,
        condition: 'Cerah Berawan',
        icon: '🌤️',
        timestamp: 'Data Standar (Offline Fallback)'
      });
    }
  };

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setServerStatus(data))
      .catch(() => {
        setServerStatus({
          status: 'online',
          postgis: { active: false, version: 'PostGIS Engine' }
        });
      });

    fetch('/api/poverty-clusters/stats')
      .then(res => res.json())
      .then(data => setSummaryStats(data))
      .catch(() => {});

    fetchKotimWeather();
  }, []);

  const handleRunBuffer = async (featureId, radiusMeters) => {
    setAnalysisLoading(true);
    try {
      const res = await fetch('/api/spatial/buffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId, radius: radiusMeters })
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Buffer error:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleRunOverlay = async (kecamatan, jenisBencana) => {
    setAnalysisLoading(true);
    try {
      const res = await fetch('/api/spatial/overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kecamatan, jenisBencana })
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Overlay error:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleClearAnalysis = () => {
    setAnalysisResult(null);
  };

  const handleSearchSelect = (targetName) => {
    setZoomToTarget(targetName);
    if (!rightPanelOpen) setRightPanelOpen(true);
  };

  const handleSelectVillage = (villageName, properties) => {
    setZoomToTarget(villageName);
    setSelectedFeature(properties);
    if (!rightPanelOpen) setRightPanelOpen(true);
  };

  const handleResetView = () => {
    mapComponentRef.current?.fitStudyArea();
  };

  const handleExportMap = () => {
    mapComponentRef.current?.exportMapPNG();
  };

  // Ekspor CSV
  const handleExportCSV = () => {
    if (!selectedFeature) {
      alert('Pilih salah satu desa terlebih dahulu untuk mengekspor data.');
      return;
    }

    const headers = [
      'ID',
      'Nama Wilayah',
      'Kecamatan',
      'Kabupaten',
      'Luas (Ha)',
      'Estimasi Populasi',
      'Kategori Klaster',
      'Indeks Kerentanan',
      'Rasio Ketergantungan (%)',
      'Akses Jamban Layak (%)',
      'Skor Kepemilikan Aset (0-100)',
      'Jarak ke SMA/SMK (km)',
      'Jarak ke Faskes (km)'
    ];

    const row = [
      selectedFeature.id || '-',
      `"${selectedFeature.NAMOBJ || selectedFeature.namobj || '-'}"`,
      `"${selectedFeature.WADMKC || selectedFeature.wadmkc || '-'}"`,
      '"Kotawaringin Timur"',
      selectedFeature.Luas_Ha || selectedFeature.luas_ha || '-',
      selectedFeature.estimasi_populasi || '-',
      `"${selectedFeature.wq_Pov || selectedFeature.wq_pov || '-'}"`,
      selectedFeature.indeks_kerentanan || '-',
      selectedFeature.rasio_ketergantungan || '-',
      selectedFeature.sanitasi_layak_persen || selectedFeature.akses_jamban_persen || '-',
      selectedFeature.kepemilikan_aset_skor || '-',
      selectedFeature.akses_pendidikan_km || '-',
      selectedFeature.akses_kesehatan_km || '-'
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const villageName = (selectedFeature.NAMOBJ || selectedFeature.namobj || 'Desa').replace(/\s+/g, '_');
    link.setAttribute('download', `Data_Spasial_${villageName}_Kotim.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* HEADER NAVIGASI DENGAN Z-INDEX 50 */}
      <Topbar
        leftPanelOpen={leftPanelOpen}
        setLeftPanelOpen={setLeftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        onSearchSelect={handleSearchSelect}
        serverStatus={serverStatus}
        onResetView={handleResetView}
        onExportMap={handleExportMap}
        onExportCSV={handleExportCSV}
        selectedFeature={selectedFeature}
        onOpenAbout={() => setAboutModalOpen(true)}
        weatherData={weatherData}
        onOpenWeatherTab={() => {
          setActiveSidebarTab('cuaca');
          if (!leftPanelOpen) setLeftPanelOpen(true);
        }}
      />

      {/* VIEWPORT AREA PETA & FLOATING GLASSMORPHISM PANELS */}
      <div className="relative flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden">
        {/* Komponen Peta OpenLayers 10 Layer */}
        <div className="absolute inset-0 z-0">
          <MapComponent
            ref={mapComponentRef}
            layersConfig={layersConfig}
            layerOpacity={layerOpacity}
            selectedFeature={selectedFeature}
            onSelectFeature={(feat) => {
              setSelectedFeature(feat);
              if (!rightPanelOpen) setRightPanelOpen(true);
            }}
            analysisResult={analysisResult}
            zoomToTarget={zoomToTarget}
            swipeEnabled={swipeEnabled}
            setSwipeEnabled={setSwipeEnabled}
            swipePosition={swipePosition}
            setSwipePosition={setSwipePosition}
            swipeLeftLayer={swipeLeftLayer}
            setSwipeLeftLayer={setSwipeLeftLayer}
            swipeRightLayer={swipeRightLayer}
            setSwipeRightLayer={setSwipeRightLayer}
            showWindParticles={showWindParticles}
            setShowWindParticles={setShowWindParticles}
            windPattern={windPattern}
            windSpeedMode={windSpeedMode}
            windDensity={windDensity}
            basemapType={basemapType}
            setBasemapType={setBasemapType}
            leftPanelOpen={leftPanelOpen}
            rightPanelOpen={rightPanelOpen}
            weatherData={weatherData}
            onOpenWeatherTab={() => {
              setActiveSidebarTab('cuaca');
              if (!leftPanelOpen) setLeftPanelOpen(true);
            }}
          />
        </div>

        {/* FLOATING SIDEBAR KIRI (GLASSMORPHISM OVERLAY Z-40 DENGAN SPACING ATAS) */}
        <div
          className={`absolute top-4 bottom-4 left-4 z-40 transition-all duration-300 pointer-events-none ${
            leftPanelOpen 
              ? 'w-80 sm:w-88 md:w-[350px] lg:w-[370px] translate-x-0 opacity-100' 
              : 'w-0 -translate-x-[110%] opacity-0'
          }`}
        >
          <div className="w-full h-full pointer-events-auto">
            <LayerManagerPanel
              activeSidebarTab={activeSidebarTab}
              setActiveSidebarTab={setActiveSidebarTab}
              layersConfig={layersConfig}
              setLayersConfig={setLayersConfig}
              layerOpacity={layerOpacity}
              setLayerOpacity={setLayerOpacity}
              swipeEnabled={swipeEnabled}
              setSwipeEnabled={setSwipeEnabled}
              swipePosition={swipePosition}
              setSwipePosition={setSwipePosition}
              showWindParticles={showWindParticles}
              setShowWindParticles={setShowWindParticles}
              windPattern={windPattern}
              setWindPattern={setWindPattern}
              windSpeedMode={windSpeedMode}
              setWindSpeedMode={setWindSpeedMode}
              windDensity={windDensity}
              setWindDensity={setWindDensity}
              basemapType={basemapType}
              setBasemapType={setBasemapType}
              onRunBuffer={handleRunBuffer}
              onRunOverlay={handleRunOverlay}
              onClearAnalysis={handleClearAnalysis}
              analysisLoading={analysisLoading}
              analysisResult={analysisResult}
              selectedFeature={selectedFeature}
              onSelectVillage={handleSelectVillage}
              weatherData={weatherData}
              onRefreshWeather={fetchKotimWeather}
              onStartMeasure={(type) => mapComponentRef.current?.startMeasure(type)}
              onClosePanel={() => setLeftPanelOpen(false)}
            />
          </div>
        </div>

        {/* Tombol Pintas Buka Sidebar Kiri Saat Diciutkan */}
        {!leftPanelOpen && (
          <button
            onClick={() => setLeftPanelOpen(true)}
            className="absolute top-4 left-4 z-40 p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-indigo-400 hover:text-white border border-slate-700/50 shadow-2xl backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 group"
            title="Buka Layer Manager & Alat Analisis"
          >
            <Layers className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline text-slate-200 group-hover:text-white">Panel Analisis</span>
          </button>
        )}

        {/* FLOATING SIDEBAR KANAN (GLASSMORPHISM OVERLAY Z-40 DENGAN SPACING ATAS) */}
        <div
          className={`absolute top-4 bottom-4 right-4 z-40 transition-all duration-300 pointer-events-none ${
            rightPanelOpen 
              ? 'w-80 sm:w-88 md:w-[350px] lg:w-[370px] translate-x-0 opacity-100' 
              : 'w-0 translate-x-[110%] opacity-0'
          }`}
        >
          <div className="w-full h-full pointer-events-auto">
            <AttributePanel
              selectedFeature={selectedFeature}
              summaryStats={summaryStats}
              onExportCSV={handleExportCSV}
              onClosePanel={() => setRightPanelOpen(false)}
              layersConfig={layersConfig}
            />
          </div>
        </div>

        {/* Tombol Pintas Buka Sidebar Kanan Saat Diciutkan */}
        {!rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="absolute top-4 right-4 z-40 p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-indigo-400 hover:text-white border border-slate-700/50 shadow-2xl backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 group"
            title="Buka Panel Atribut & Statistik"
          >
            <span className="text-xs font-bold hidden sm:inline text-slate-200 group-hover:text-white">Atribut & Profil</span>
            <FileText className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* MODAL KOMPREHENSIF "INFORMASI & METODOLOGI" DENGAN ATRIBUSI LENGKAP */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-slate-700/50 max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Informasi & Metodologi Penelitian</h3>
                  <p className="text-xs text-slate-400">WebGIS Analisis Tesis Evan – Kotawaringin Timur 2025</p>
                </div>
              </div>
              <button 
                onClick={() => setAboutModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3.5 leading-relaxed">
              {/* KARTU INFORMASI RISET */}
              <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-500/40 space-y-2">
                <div className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider">
                  Informasi Riset Tesis:
                </div>
                <div className="divide-y divide-white/10 text-xs space-y-1.5 pt-1">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">Peneliti:</span>
                    <span className="font-bold text-white">Evan (2025)</span>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span className="text-slate-400">Lokasi Studi:</span>
                    <span className="font-semibold text-slate-200">Kabupaten Kotawaringin Timur</span>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span className="text-slate-400">Metodologi:</span>
                    <span className="font-mono text-indigo-300 font-bold">Cluster Analysis</span>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span className="text-slate-400">Sumber Data:</span>
                    <span className="text-slate-200 font-medium">Hasil analisis peneliti tahun 2025</span>
                  </div>
                </div>
              </div>

              {/* Atribusi & Kontak Pengembang Mandatori */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200 text-xs">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>Atribusi Akademik & Kontak Pengembang</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>Afiliasi: <span className="font-semibold text-indigo-300">MPWK UGM 2025, NIM 23/513022/PTK/15068</span></div>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-slate-400">Email:</span>
                    <a href="mailto:dermanevan@gmail.com" className="text-indigo-400 hover:underline font-mono">dermanevan@gmail.com</a>
                    <span className="text-slate-600">•</span>
                    <a href="mailto:evan1999@mail.ugm.ac.id" className="text-emerald-400 hover:underline font-mono">evan1999@mail.ugm.ac.id</a>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Cakupan & Tipologi Klaster Kemiskinan:</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Penelitian ini memetakan 185 desa dan kelurahan di 17 kecamatan Kabupaten Kotawaringin Timur ke dalam 3 tipologi karakteristik kemiskinan:
                </p>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-300 text-xs">
                  <li><strong>Kawasan Kumuh (Urban Slum):</strong> Terkonsentrasi di wilayah pusat perkotaan dengan keterbatasan fasilitas dasar, sanitasi, dan kepadatan tinggi.</li>
                  <li><strong>Pedesaan (High Dependency Ratio):</strong> Wilayah agraris dengan tingkat rasio ketergantungan ekonomi tinggi terhadap kepala keluarga.</li>
                  <li><strong>Wilayah Terpencil (Limited Asset Ownership):</strong> Kawasan hulu dan pedalaman dengan keterbatasan kepemilikan aset produktif dan jarak tempuh ke fasilitas publik.</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setAboutModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
              >
                Tutup Informasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
