import React, { useState } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { MapContainer } from './components/MapContainer.tsx';
import { SidebarLayers } from './components/SidebarLayers.tsx';
import { FeatureInspector } from './components/FeatureInspector.tsx';
import { PostGisBufferModal } from './components/PostGisBufferModal.tsx';
import { AnalyticsDashboardModal } from './components/AnalyticsDashboardModal.tsx';
import { BookmarksModal } from './components/BookmarksModal.tsx';
import { InfoModal } from './components/InfoModal.tsx';
import { LayerConfig, BufferAnalysisResult } from './types/spatial.ts';
import { POVERTY_COLORS } from './utils/mapStyles.ts';

const DISTRICTS_KOTIM = [
  'Antang Kalang',
  'Baamang',
  'Bukit Santuai',
  'Cempaga',
  'Cempaga Hulu',
  'Kota Besi',
  'Mentawa Baru Ketapang',
  'Mentaya Hilir Selatan',
  'Mentaya Hilir Utara',
  'Mentaya Hulu',
  'Parenggean',
  'Pulau Hanaut',
  'Seranau',
  'Telaga Antang',
  'Telawang',
  'Teluk Sampit',
  'Tualan Hulu',
];

const INITIAL_LAYERS: LayerConfig[] = [
  {
    id: 'poverty-patterns',
    name: 'Pola Spasial Kemiskinan',
    category: 'analysis',
    visible: true,
    opacity: 0.85,
    color: '#ef4444',
    legendType: 'choropleth',
    description: '3 tipologi spasial pembentuk karakteristik kemiskinan (Tesis Evan 2025)',
    legendItems: [
      { label: 'Kawasan Kumuh Perkotaan (Urban Slum)', color: POVERTY_COLORS.urbanSlum },
      { label: 'Rasio Ketergantungan Tinggi (Wilayah Pedesaan)', color: POVERTY_COLORS.ruralDep },
      { label: 'Keterbatasan Kepemilikan Aset (Wilayah Terpencil)', color: POVERTY_COLORS.remoteAsset },
    ],
  },
  {
    id: 'districts',
    name: 'Batas Kecamatan Kotawaringin Timur',
    category: 'boundary',
    visible: true,
    opacity: 0.9,
    color: '#38bdf8',
    legendType: 'single',
    description: '17 Wilayah Administrasi Kecamatan di Kotim',
    legendItems: [
      { label: 'Batas Wilayah Kecamatan', color: '#38bdf8' },
    ],
  },
  {
    id: 'healthcare',
    name: 'Fasilitas Kesehatan',
    category: 'facility',
    visible: true,
    opacity: 1,
    color: '#3b82f6',
    legendType: 'points',
    description: 'Rumah Sakit, Puskesmas Induk, dan Puskesmas Pembantu (Pustu)',
    legendItems: [
      { label: 'Rumah Sakit (RSUD dr. Murjani & Pratama)', color: '#ef4444' },
      { label: 'Puskesmas Induk Kecamatan', color: '#06b6d4' },
      { label: 'Puskesmas Pembantu (Pustu)', color: '#10b981' },
    ],
  },
  {
    id: 'education',
    name: 'Fasilitas Pendidikan',
    category: 'facility',
    visible: false,
    opacity: 0.9,
    color: '#8b5cf6',
    legendType: 'points',
    description: 'Perguruan Tinggi, SMA, SMK, SMP, dan SD se-Kotawaringin Timur',
    legendItems: [
      { label: 'Perguruan Tinggi / Akademi', color: '#a855f7' },
      { label: 'SMA & SMK', color: '#3b82f6' },
      { label: 'SMP / Sederajat', color: '#0284c7' },
      { label: 'SD / Sederajat', color: '#84cc16' },
    ],
  },
  {
    id: 'hospital-isochrone',
    name: 'Isochrone Jangkauan Rumah Sakit',
    category: 'analysis',
    visible: false,
    opacity: 0.6,
    color: '#3b82f6',
    legendType: 'choropleth',
    description: 'Zona jangkauan jarak pelayanan fasilitas rumah sakit (5km - 50km)',
    legendItems: [
      { label: '5.000 meter (Sangat Dekat)', color: '#10b981' },
      { label: '10.000 meter (Dekat)', color: '#06b6d4' },
      { label: '25.000 meter (Menengah)', color: '#f59e0b' },
      { label: '50.000 meter (Batas Pelayanan Jauh)', color: '#ef4444' },
    ],
  },
  {
    id: 'education-isochrone',
    name: 'Isochrone Jangkauan SMA / SMK',
    category: 'analysis',
    visible: false,
    opacity: 0.6,
    color: '#8b5cf6',
    legendType: 'choropleth',
    description: 'Zona jangkauan aksesibilitas pendidikan menengah atas (5km - 50km)',
    legendItems: [
      { label: '5.000 meter (Akses Prima)', color: '#10b981' },
      { label: '15.000 meter (Akses Standar)', color: '#06b6d4' },
      { label: '30.000 meter (Akses Terbatas)', color: '#f59e0b' },
      { label: '50.000 meter (Sangat Jauh)', color: '#ef4444' },
    ],
  },
  {
    id: 'roads',
    name: 'Jaringan Jalan',
    category: 'infrastructure',
    visible: true,
    opacity: 0.85,
    color: '#f59e0b',
    legendType: 'lines',
    description: 'Jalan Nasional Primer, Provinsi, Kabupaten, Permukiman, & Perkebunan',
    legendItems: [
      { label: 'Jalan Nasional Primer', color: '#f59e0b' },
      { label: 'Jalan Provinsi', color: '#fbbf24' },
      { label: 'Jalan Kabupaten / Kolektor', color: '#94a3b8' },
    ],
  },
  {
    id: 'rivers',
    name: 'Jaringan Sungai Mentaya & Aliran Air',
    category: 'infrastructure',
    visible: true,
    opacity: 0.8,
    color: '#38bdf8',
    legendType: 'lines',
    description: 'Aliran Sungai Mentaya sebagai urat nadi transportasi masyarakat',
    legendItems: [
      { label: 'Sungai Utama & Saluran Air', color: '#38bdf8' },
    ],
  },
  {
    id: 'tourism',
    name: 'Pariwisata & Cagar Budaya',
    category: 'tourism',
    visible: false,
    opacity: 1,
    color: '#f59e0b',
    legendType: 'points',
    description: 'Objek wisata alam, situs sejarah, dan cagar budaya Dayak',
    legendItems: [
      { label: 'Objek Wisata & Sandung/Sapundu Budaya', color: '#f59e0b' },
    ],
  },
];

export const App: React.FC = () => {
  const [layers, setLayers] = useState<LayerConfig[]>(INITIAL_LAYERS);
  const [activeBasemap, setActiveBasemap] = useState<string>('esri-satellite');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [selectedFeature, setSelectedFeature] = useState<Record<string, any> | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measureType, setMeasureType] = useState<'distance' | 'area'>('distance');
  const [currentCoord, setCurrentCoord] = useState<[number, number] | null>(null);

  const [isBufferModalOpen, setIsBufferModalOpen] = useState<boolean>(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  const [bufferResult, setBufferResult] = useState<BufferAnalysisResult | null>(null);
  const [initialBufferTarget, setInitialBufferTarget] = useState<{ coord: [number, number]; name: string } | null>(null);

  const toggleLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const changeOpacity = (id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const handleRunBufferAnalysis = async (lon: number, lat: number, radiusKm: number): Promise<BufferAnalysisResult | null> => {
    const res = await fetch(`/api/spatial/buffer-analysis?lon=${lon}&lat=${lat}&radiusKm=${radiusKm}`);
    if (!res.ok) {
      throw new Error('Gagal menjalankan kueri spasial buffer PostGIS');
    }
    const data = await res.json();
    setBufferResult(data);
    return data;
  };

  const handleOpenBufferForFeature = (lon: number, lat: number, name: string) => {
    setInitialBufferTarget({ coord: [lon, lat], name });
    setIsBufferModalOpen(true);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 overflow-hidden font-sans">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenBufferTool={() => {
          setInitialBufferTarget(null);
          setIsBufferModalOpen(true);
        }}
        onOpenBookmarks={() => setIsBookmarksModalOpen(true)}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        isMeasuring={isMeasuring}
        onToggleMeasure={() => setIsMeasuring((prev) => !prev)}
        measureType={measureType}
        onChangeMeasureType={(type) => setMeasureType(type)}
        currentCoord={currentCoord}
      />

      <main className="relative flex-1 w-full h-[calc(100vh-4rem)]">
        <MapContainer
          layers={layers}
          activeBasemap={activeBasemap}
          onSelectFeature={(feat) => setSelectedFeature(feat)}
          onPointerCoordChange={(coord) => setCurrentCoord(coord)}
          isMeasuring={isMeasuring}
          measureType={measureType}
          selectedDistrict={selectedDistrict}
          bufferResult={bufferResult}
        />

        <SidebarLayers
          layers={layers}
          onToggleLayer={toggleLayer}
          onChangeOpacity={changeOpacity}
          activeBasemap={activeBasemap}
          onChangeBasemap={(b) => setActiveBasemap(b)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(d) => setSelectedDistrict(d)}
          districtsList={DISTRICTS_KOTIM}
        />

        <FeatureInspector
          featureData={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          onRunBufferForFeature={handleOpenBufferForFeature}
        />
      </main>

      <PostGisBufferModal
        isOpen={isBufferModalOpen}
        onClose={() => setIsBufferModalOpen(false)}
        onRunAnalysis={handleRunBufferAnalysis}
        onHighlightResultOnMap={(res) => setBufferResult(res)}
        initialCoord={initialBufferTarget?.coord}
        initialName={initialBufferTarget?.name}
      />

      <AnalyticsDashboardModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      <BookmarksModal
        isOpen={isBookmarksModalOpen}
        onClose={() => setIsBookmarksModalOpen(false)}
        currentView={{
          center: currentCoord || [112.95, -2.53],
          zoom: 9,
          activeLayers: layers.filter((l) => l.visible).map((l) => l.id),
        }}
        onJumpToView={() => {
          setSelectedDistrict('ALL');
        }}
      />

      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
};
