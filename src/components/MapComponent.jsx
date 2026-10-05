import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import { ScaleLine, Zoom, Attribution } from 'ol/control';
import Draw from 'ol/interaction/Draw';
import { getLength, getArea } from 'ol/sphere';
import { WindParticleEngine } from './WebGLWindLayer';
import { 
  Sliders, 
  AlertCircle, 
  Loader2, 
  Focus, 
  Layers as LayersIcon, 
  ChevronDown, 
  ChevronUp, 
  Navigation, 
  Ruler, 
  X, 
  ArrowRightLeft,
  Wind
} from 'lucide-react';

const MapComponent = forwardRef(function MapComponent({
  layersConfig,
  layerOpacity,
  selectedFeature,
  onSelectFeature,
  analysisResult,
  zoomToTarget,
  swipeEnabled,
  setSwipeEnabled,
  swipePosition,
  setSwipePosition,
  swipeLeftLayer,
  setSwipeLeftLayer,
  swipeRightLayer,
  setSwipeRightLayer,
  showWindParticles,
  setShowWindParticles,
  windPattern,
  windSpeedMode,
  windDensity,
  basemapType,
  setBasemapType,
  leftPanelOpen,
  rightPanelOpen,
  weatherData,
  onOpenWeatherTab
}, ref) {
  const mapElementRef = useRef(null);
  const windCanvasRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const windEngineRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Measure interaction ref
  const drawInteractionRef = useRef(null);
  const measureSourceRef = useRef(new VectorSource());

  // 10 Geospatial Vector Layer References + Analysis & Helpers
  const esriSatelliteLayerRef = useRef(null);
  const osmLayerRef = useRef(null);

  const povertyLayerRef = useRef(null);            // 1. Klaster Kemiskinan
  const spatialPatternLayerRef = useRef(null);      // 2. Pola Spasial Kemiskinan
  const districtLayerRef = useRef(null);            // 3. Batas Kecamatan
  const disasterLayerRef = useRef(null);            // 4. Risiko Bencana
  const isochroneHospitalLayerRef = useRef(null);   // 5. Isochrone RS
  const isochroneEducationLayerRef = useRef(null);  // 6. Isochrone SMA/SMK
  const healthcareLayerRef = useRef(null);          // 7. Fasilitas Kesehatan
  const educationLayerRef = useRef(null);           // 8. Fasilitas Pendidikan
  const riversLayerRef = useRef(null);              // 9. Sungai Mentaya
  const roadsLayerRef = useRef(null);               // 10. Jaringan Jalan
  const tourismLayerRef = useRef(null);             // 11. Pariwisata & Cagar Budaya

  const analysisLayerRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const measureLayerRef = useRef(null);

  // Vector Sources
  const povertySourceRef = useRef(new VectorSource());
  const spatialPatternSourceRef = useRef(new VectorSource());
  const districtSourceRef = useRef(new VectorSource());
  const disasterSourceRef = useRef(new VectorSource());
  const isochroneHospitalSourceRef = useRef(new VectorSource());
  const isochroneEducationSourceRef = useRef(new VectorSource());
  const healthcareSourceRef = useRef(new VectorSource());
  const educationSourceRef = useRef(new VectorSource());
  const riversSourceRef = useRef(new VectorSource());
  const roadsSourceRef = useRef(new VectorSource());
  const tourismSourceRef = useRef(new VectorSource());

  const analysisSourceRef = useRef(new VectorSource());
  const highlightSourceRef = useRef(new VectorSource());

  const [isDraggingSwipe, setIsDraggingSwipe] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [legendExpanded, setLegendExpanded] = useState(true);

  // Geodesic Measurement State
  const [activeMeasureType, setActiveMeasureType] = useState(null);
  const [measureResultText, setMeasureResultText] = useState(null);

  // Expose export and control functions to parent
  useImperativeHandle(ref, () => ({
    exportMapPNG() {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.once('rendercomplete', () => {
        const mapCanvas = document.createElement('canvas');
        const size = map.getSize();
        mapCanvas.width = size[0];
        mapCanvas.height = size[1];
        const mapContext = mapCanvas.getContext('2d');

        Array.prototype.forEach.call(
          map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
          (canvas) => {
            if (canvas.width > 0) {
              const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
              mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
              let transform = canvas.style.transform;
              let matrix;
              if (transform) {
                const parts = transform.match(/^matrix\(([^\(]*)\)$/);
                if (parts) {
                  matrix = parts[1].split(',').map(Number);
                }
              }
              if (matrix) {
                mapContext.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
              } else {
                mapContext.setTransform(1, 0, 0, 1, 0, 0);
              }
              mapContext.drawImage(canvas, 0, 0);
            }
          }
        );

        mapContext.setTransform(1, 0, 0, 1, 0, 0);
        mapContext.globalAlpha = 1;

        // Title watermark
        mapContext.fillStyle = 'rgba(15, 23, 42, 0.85)';
        mapContext.fillRect(20, 20, 390, 70);
        mapContext.strokeStyle = '#6366f1';
        mapContext.lineWidth = 1.5;
        mapContext.strokeRect(20, 20, 390, 70);

        mapContext.fillStyle = '#ffffff';
        mapContext.font = 'bold 13px Plus Jakarta Sans, sans-serif';
        mapContext.fillText('WebGIS Kemiskinan & Bencana Kotawaringin Timur', 35, 45);
        mapContext.fillStyle = '#94a3b8';
        mapContext.font = '11px Plus Jakarta Sans, sans-serif';
        mapContext.fillText('Peneliti: Evan (2025) • MPWK UGM 2025', 35, 68);

        const link = document.createElement('a');
        link.download = `Peta_Kotawaringin_Timur_${Date.now()}.png`;
        link.href = mapCanvas.toDataURL();
        link.click();
      });
      map.renderSync();
    },

    fitStudyArea() {
      if (povertySourceRef.current && mapInstanceRef.current) {
        const extent = povertySourceRef.current.getExtent();
        if (extent && isFinite(extent[0])) {
          mapInstanceRef.current.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 800
          });
        }
      }
    },

    startMeasure(type) {
      startGeodesicMeasure(type);
    },

    stopMeasure() {
      stopGeodesicMeasure();
    }
  }));

  // Helper pemuatan data GeoJSON
  const loadGeoJSONSource = async (url, sourceRef) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const format = new GeoJSON({
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        });
        const features = format.readFeatures(data);
        sourceRef.current.clear();
        sourceRef.current.addFeatures(features);
        return features;
      }
    } catch (err) {
      console.warn(`Gagal memuat ${url}:`, err);
    }
    return [];
  };

  // Muat 10 Dataset Geospasial Secara Asinkron
  useEffect(() => {
    let isMounted = true;
    setLoadingData(true);

    async function loadAllDatasets() {
      try {
        await Promise.all([
          loadGeoJSONSource('/api/spatial/districts', districtSourceRef),
          loadGeoJSONSource('/api/poverty-clusters', povertySourceRef),
          loadGeoJSONSource('/api/spatial/poverty-patterns', spatialPatternSourceRef),
          loadGeoJSONSource('/api/disaster-risk', disasterSourceRef),
          loadGeoJSONSource('/api/spatial/rivers', riversSourceRef),
          loadGeoJSONSource('/api/spatial/isochrone/hospital', isochroneHospitalSourceRef),
          loadGeoJSONSource('/api/spatial/isochrone/education', isochroneEducationSourceRef),
          loadGeoJSONSource('/api/spatial/facilities/healthcare', healthcareSourceRef),
          loadGeoJSONSource('/api/spatial/facilities/education', educationSourceRef),
          loadGeoJSONSource('/api/spatial/tourism', tourismSourceRef)
        ]);

        if (isMounted) {
          setLoadingData(false);
          if (povertySourceRef.current.getFeatures().length > 0 && mapInstanceRef.current) {
            const extent = povertySourceRef.current.getExtent();
            mapInstanceRef.current.getView().fit(extent, {
              padding: [50, 50, 50, 50],
              duration: 800
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setLoadError('Sebagian layer geospasial gagal dimuat dari server.');
          setLoadingData(false);
        }
      }
    }

    loadAllDatasets();

    return () => {
      isMounted = false;
    };
  }, []);

  // Inisialisasi Peta OpenLayers dengan 10 Layer Geospasial
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    // 1. BASEMAPS: Satelit HD & OSM Standar
    const osmStandard = new TileLayer({
      source: new OSM({
        crossOrigin: 'anonymous',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      }),
      visible: basemapType === 'osm',
      zIndex: 1
    });
    osmLayerRef.current = osmStandard;

    const esriSatellite = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        crossOrigin: 'anonymous',
        maxZoom: 19
      }),
      visible: basemapType === 'satellite' || basemapType === 'carto_dark',
      zIndex: 2
    });
    esriSatelliteLayerRef.current = esriSatellite;

    // 2. LAYER TEMATIK LENGKAP (10 DATASET KOTIM)

    // Layer 1: Batas Administrasi Kecamatan
    const districtLayer = new VectorLayer({
      source: districtSourceRef.current,
      visible: layersConfig.districtBoundary ?? true,
      opacity: layerOpacity?.districtBoundary ?? 0.8,
      zIndex: 10,
      style: (feature) => new Style({
        fill: new Fill({ color: 'rgba(30, 41, 59, 0.05)' }),
        stroke: new Stroke({ color: '#cbd5e1', width: 1.2, lineDash: [6, 4] }),
        text: new Text({
          text: feature.get('NAMOBJ') || feature.get('KEC') || '',
          font: '10px Plus Jakarta Sans, sans-serif',
          fill: new Fill({ color: '#f8fafc' }),
          stroke: new Stroke({ color: '#0f172a', width: 2.2 }),
          overflow: true
        })
      })
    });
    districtLayerRef.current = districtLayer;

    // Layer 2: Sungai Mentaya & Badan Air
    const riversLayer = new VectorLayer({
      source: riversSourceRef.current,
      visible: layersConfig.rivers ?? true,
      opacity: layerOpacity?.rivers ?? 0.75,
      zIndex: 11,
      style: new Style({
        fill: new Fill({ color: 'rgba(14, 165, 233, 0.55)' }),
        stroke: new Stroke({ color: '#0284c7', width: 1.2 })
      })
    });
    riversLayerRef.current = riversLayer;

    // Layer 3: Pola Spasial Kemiskinan
    const spatialPatternLayer = new VectorLayer({
      source: spatialPatternSourceRef.current,
      visible: layersConfig.povertyPatterns ?? false,
      opacity: layerOpacity?.povertyPatterns ?? 0.5,
      zIndex: 13,
      style: (feature) => {
        const pov = feature.get('wq_Pov') || '';
        let fillColor = 'rgba(168, 85, 247, 0.5)';
        if (pov.includes('High dependency')) fillColor = 'rgba(245, 158, 11, 0.5)';
        else if (pov.includes('Limited asset')) fillColor = 'rgba(239, 68, 68, 0.5)';
        return new Style({
          fill: new Fill({ color: fillColor }),
          stroke: new Stroke({ color: '#7e22ce', width: 1.0 })
        });
      }
    });
    spatialPatternLayerRef.current = spatialPatternLayer;

    // Layer 4: Klaster Kemiskinan Kotim (Poverty Clusters 2025)
    const povertyLayer = new VectorLayer({
      source: povertySourceRef.current,
      visible: layersConfig.povertyClusters ?? true,
      opacity: layerOpacity?.povertyClusters ?? 0.55,
      zIndex: 15,
      style: (feature) => {
        const pov = feature.get('wq_Pov') || feature.get('wq_pov') || '';
        let fillColor = 'rgba(99, 102, 241, 0.7)'; // Kumuh Perkotaan (Indigo)
        let strokeColor = '#4338ca';

        if (pov.includes('High dependency') || pov.includes('Pedesaan')) {
          fillColor = 'rgba(245, 158, 11, 0.7)'; // Pedesaan (Amber)
          strokeColor = '#b45309';
        } else if (pov.includes('Limited asset') || pov.includes('Terpencil')) {
          fillColor = 'rgba(239, 68, 68, 0.7)'; // Terpencil (Red)
          strokeColor = '#b91c1c';
        }

        return new Style({
          fill: new Fill({ color: fillColor }),
          stroke: new Stroke({ color: strokeColor, width: 1.0 })
        });
      }
    });
    povertyLayerRef.current = povertyLayer;

    // Layer 5: Zona Risiko Bencana (Banjir DAS Mentaya & Karhutla)
    const disasterLayer = new VectorLayer({
      source: disasterSourceRef.current,
      visible: layersConfig.disasterRisk ?? true,
      opacity: layerOpacity?.disasterRisk ?? 0.5,
      zIndex: 17,
      style: (feature) => {
        const jenis = feature.get('jenis_bencana') || '';
        const risiko = feature.get('tingkat_risiko') || '';
        let fillColor = 'rgba(6, 182, 212, 0.65)'; // Banjir (Cyan)
        let strokeColor = '#0e7490';

        if (jenis.includes('Karhutla')) {
          fillColor = risiko === 'Tinggi' ? 'rgba(234, 88, 12, 0.75)' : 'rgba(249, 115, 22, 0.65)';
          strokeColor = '#9a3412';
        }

        return new Style({
          fill: new Fill({ color: fillColor }),
          stroke: new Stroke({ color: strokeColor, width: 1.2, lineDash: [5, 4] })
        });
      }
    });
    disasterLayerRef.current = disasterLayer;

    // Layer 6: Isochrone Pelayanan Rumah Sakit
    const isochroneHospitalLayer = new VectorLayer({
      source: isochroneHospitalSourceRef.current,
      visible: layersConfig.isochroneHospital ?? false,
      opacity: layerOpacity?.isochroneHospital ?? 0.45,
      zIndex: 18,
      style: (feature) => {
        const dist = Number(feature.get('AA_METERS')) || 50000;
        let color = 'rgba(99, 102, 241, 0.3)';
        let stroke = '#6366f1';
        if (dist <= 5000) { color = 'rgba(16, 185, 129, 0.45)'; stroke = '#059669'; }
        else if (dist <= 10000) { color = 'rgba(20, 184, 166, 0.4)'; stroke = '#0d9488'; }
        else if (dist <= 25000) { color = 'rgba(59, 130, 246, 0.35)'; stroke = '#2563eb'; }

        return new Style({
          fill: new Fill({ color }),
          stroke: new Stroke({ color: stroke, width: 1.2 })
        });
      }
    });
    isochroneHospitalLayerRef.current = isochroneHospitalLayer;

    // Layer 7: Isochrone Jangkauan Pendidikan SMA/SMK
    const isochroneEducationLayer = new VectorLayer({
      source: isochroneEducationSourceRef.current,
      visible: layersConfig.isochroneEducation ?? false,
      opacity: layerOpacity?.isochroneEducation ?? 0.45,
      zIndex: 19,
      style: (feature) => {
        const dist = Number(feature.get('AA_METERS')) || 50000;
        let color = 'rgba(168, 85, 247, 0.3)';
        let stroke = '#9333ea';
        if (dist <= 15000) { color = 'rgba(234, 179, 8, 0.4)'; stroke = '#ca8a04'; }
        else if (dist <= 25000) { color = 'rgba(249, 115, 22, 0.35)'; stroke = '#ea580c'; }
        else if (dist <= 30000) { color = 'rgba(239, 68, 68, 0.3)'; stroke = '#dc2626'; }

        return new Style({
          fill: new Fill({ color }),
          stroke: new Stroke({ color: stroke, width: 1.2 })
        });
      }
    });
    isochroneEducationLayerRef.current = isochroneEducationLayer;

    // Layer 8: Jaringan Jalan Kotim
    const roadsLayer = new VectorLayer({
      source: roadsSourceRef.current,
      visible: layersConfig.roads ?? false,
      opacity: layerOpacity?.roads ?? 0.65,
      zIndex: 22,
      style: (feature) => {
        const hw = feature.get('highway') || '';
        let color = '#94a3b8';
        let width = 1.0;
        if (hw === 'primary' || hw === 'trunk') {
          color = '#f97316';
          width = 2.0;
        } else if (hw === 'secondary') {
          color = '#eab308';
          width = 1.6;
        }
        return new Style({
          stroke: new Stroke({ color, width })
        });
      }
    });
    roadsLayerRef.current = roadsLayer;

    // Layer 9: Fasilitas Kesehatan (Titik)
    const healthcareLayer = new VectorLayer({
      source: healthcareSourceRef.current,
      visible: layersConfig.healthcareFacilities ?? true,
      opacity: layerOpacity?.healthcareFacilities ?? 1.0,
      zIndex: 26,
      style: (feature) => {
        const jenis = feature.get('Jenis') || '';
        let color = '#10b981';
        let radius = 4.5;
        if (jenis.includes('Rumah Sakit')) {
          color = '#ef4444';
          radius = 6.5;
        } else if (jenis.includes('Induk')) {
          color = '#06b6d4';
          radius = 5.0;
        }
        return new Style({
          image: new CircleStyle({
            radius,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#ffffff', width: 1.5 })
          })
        });
      }
    });
    healthcareLayerRef.current = healthcareLayer;

    // Layer 10: Fasilitas Pendidikan (Titik)
    const educationLayer = new VectorLayer({
      source: educationSourceRef.current,
      visible: layersConfig.educationFacilities ?? false,
      opacity: layerOpacity?.educationFacilities ?? 0.9,
      zIndex: 27,
      style: (feature) => {
        const jenis = feature.get('Jenis') || '';
        let color = '#38bdf8';
        let radius = 4.0;
        if (jenis.includes('SMA') || jenis.includes('SMK')) {
          color = '#6366f1';
          radius = 5.0;
        } else if (jenis.includes('PERGURUAN')) {
          color = '#a855f7';
          radius = 6.0;
        }
        return new Style({
          image: new CircleStyle({
            radius,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#ffffff', width: 1.2 })
          })
        });
      }
    });
    educationLayerRef.current = educationLayer;

    // Layer 11: Pariwisata & Cagar Budaya (Titik)
    const tourismLayer = new VectorLayer({
      source: tourismSourceRef.current,
      visible: layersConfig.tourism ?? false,
      opacity: layerOpacity?.tourism ?? 1.0,
      zIndex: 28,
      style: new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: '#f59e0b' }),
          stroke: new Stroke({ color: '#ffffff', width: 1.5 })
        })
      })
    });
    tourismLayerRef.current = tourismLayer;

    // Layer Analisis Penyangga (Buffer / Overlay)
    const analysisLayer = new VectorLayer({
      source: analysisSourceRef.current,
      zIndex: 32,
      style: new Style({
        fill: new Fill({ color: 'rgba(236, 72, 153, 0.35)' }),
        stroke: new Stroke({ color: '#ec4899', width: 2.2, lineDash: [4, 4] })
      })
    });
    analysisLayerRef.current = analysisLayer;

    // Highlight Feature Terpilih (HANYA MUNCUL KETIKA DIKLIK)
    const highlightLayer = new VectorLayer({
      source: highlightSourceRef.current,
      zIndex: 35,
      style: new Style({
        fill: new Fill({ color: 'rgba(56, 189, 248, 0.3)' }),
        stroke: new Stroke({ color: '#38bdf8', width: 3.5 })
      })
    });
    highlightLayerRef.current = highlightLayer;

    // Layer Alat Ukur Geodesik
    const measureLayer = new VectorLayer({
      source: measureSourceRef.current,
      zIndex: 40,
      style: new Style({
        fill: new Fill({ color: 'rgba(99, 102, 241, 0.25)' }),
        stroke: new Stroke({ color: '#6366f1', width: 2.5, lineDash: [6, 6] }),
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: '#ffffff' }),
          stroke: new Stroke({ color: '#6366f1', width: 2 })
        })
      })
    });
    measureLayerRef.current = measureLayer;

    // Center Kotawaringin Timur
    const centerKotim = fromLonLat([112.75, -2.15]);

    const map = new Map({
      target: mapElementRef.current,
      layers: [
        osmStandard,
        esriSatellite,
        districtLayer,
        riversLayer,
        spatialPatternLayer,
        povertyLayer,
        disasterLayer,
        isochroneHospitalLayer,
        isochroneEducationLayer,
        roadsLayer,
        healthcareLayer,
        educationLayer,
        tourismLayer,
        analysisLayer,
        highlightLayer,
        measureLayer
      ],
      view: new View({
        center: centerKotim,
        zoom: 8.5,
        minZoom: 6,
        maxZoom: 19
      }),
      controls: [
        new Zoom(),
        new ScaleLine({ units: 'metric' }),
        new Attribution({ collapsible: true })
      ]
    });

    mapInstanceRef.current = map;

    // Lifecycle sizing
    map.updateSize();
    const t1 = setTimeout(() => map.updateSize(), 200);
    const t2 = setTimeout(() => map.updateSize(), 600);

    if (window.ResizeObserver && mapElementRef.current) {
      const ro = new ResizeObserver(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.updateSize();
      });
      ro.observe(mapElementRef.current);
      resizeObserverRef.current = ro;
    }

    // -------------------------------------------------------------
    // ATURAN KURSOR & HOVER STRICT:
    // HOVER: HANYA MENGUBAH KURSOR JADI POINTER (TANPA HIGHLIGHT, TANPA POPOVER)
    // -------------------------------------------------------------
    map.on('pointermove', (evt) => {
      if (evt.dragging || activeMeasureType) return;
      const pixel = map.getEventPixel(evt.originalEvent);
      const hit = map.forEachFeatureAtPixel(pixel, (f, layer) => {
        if (
          layer === povertyLayer || 
          layer === spatialPatternLayer || 
          layer === districtLayer ||
          layer === disasterLayer || 
          layer === healthcareLayer ||
          layer === educationLayer ||
          layer === tourismLayer ||
          layer === isochroneHospitalLayer ||
          layer === isochroneEducationLayer ||
          layer === riversLayer
        ) return true;
        return false;
      });

      // HANYA ubah bentuk kursor pointer tanpa efek visual lain
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    // -------------------------------------------------------------
    // CLICK EVENT: MEMICU HIGHLIGHT & MEMBUKA DETAIL SERTA SINKRONISASI GRAFIK
    // -------------------------------------------------------------
    map.on('singleclick', (evt) => {
      if (activeMeasureType) return;

      const feature = map.forEachFeatureAtPixel(evt.pixel, (f, layer) => {
        if (
          layer === povertyLayer || 
          layer === spatialPatternLayer || 
          layer === districtLayer ||
          layer === disasterLayer || 
          layer === analysisLayer ||
          layer === healthcareLayer ||
          layer === educationLayer ||
          layer === tourismLayer
        ) {
          return f;
        }
        return null;
      });

      if (feature) {
        // Tampilkan Highlight pada poligon yang diklik
        if (highlightSourceRef.current) {
          highlightSourceRef.current.clear();
          highlightSourceRef.current.addFeature(feature.clone());
        }
        // Buka panel dan sinkronkan statistik/grafik
        onSelectFeature(feature.getProperties());
      }
    });

    // Inisialisasi Engine Simulasi Angin Transparan
    if (windCanvasRef.current) {
      windEngineRef.current = new WindParticleEngine(map, windCanvasRef.current, {
        pattern: windPattern || 'muson_tenggara',
        speedMode: windSpeedMode || 'medium',
        numParticles: windDensity || 1200
      });

      if (showWindParticles) {
        windEngineRef.current.start();
      }
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (windEngineRef.current) {
        windEngineRef.current.stop();
        windEngineRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      map.setTarget(null);
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap
  useEffect(() => {
    esriSatelliteLayerRef.current?.setVisible(basemapType === 'satellite' || basemapType === 'carto_dark');
    osmLayerRef.current?.setVisible(basemapType === 'osm');
    if (mapInstanceRef.current) mapInstanceRef.current.render();
  }, [basemapType]);

  // Update Opasitas & Visibilitas 10 Layer
  useEffect(() => {
    if (districtLayerRef.current) {
      districtLayerRef.current.setVisible(!!layersConfig.districtBoundary);
      if (layerOpacity?.districtBoundary !== undefined) {
        districtLayerRef.current.setOpacity(layerOpacity.districtBoundary);
      }
    }
    if (povertyLayerRef.current) {
      povertyLayerRef.current.setVisible(!!layersConfig.povertyClusters);
      if (layerOpacity?.povertyClusters !== undefined) {
        povertyLayerRef.current.setOpacity(layerOpacity.povertyClusters);
      }
    }
    if (spatialPatternLayerRef.current) {
      spatialPatternLayerRef.current.setVisible(!!layersConfig.povertyPatterns);
      if (layerOpacity?.povertyPatterns !== undefined) {
        spatialPatternLayerRef.current.setOpacity(layerOpacity.povertyPatterns);
      }
    }
    if (disasterLayerRef.current) {
      disasterLayerRef.current.setVisible(!!layersConfig.disasterRisk);
      if (layerOpacity?.disasterRisk !== undefined) {
        disasterLayerRef.current.setOpacity(layerOpacity.disasterRisk);
      }
    }
    if (riversLayerRef.current) {
      riversLayerRef.current.setVisible(!!layersConfig.rivers);
      if (layerOpacity?.rivers !== undefined) {
        riversLayerRef.current.setOpacity(layerOpacity.rivers);
      }
    }
    if (isochroneHospitalLayerRef.current) {
      isochroneHospitalLayerRef.current.setVisible(!!layersConfig.isochroneHospital);
      if (layerOpacity?.isochroneHospital !== undefined) {
        isochroneHospitalLayerRef.current.setOpacity(layerOpacity.isochroneHospital);
      }
    }
    if (isochroneEducationLayerRef.current) {
      isochroneEducationLayerRef.current.setVisible(!!layersConfig.isochroneEducation);
      if (layerOpacity?.isochroneEducation !== undefined) {
        isochroneEducationLayerRef.current.setOpacity(layerOpacity.isochroneEducation);
      }
    }
    if (roadsLayerRef.current) {
      roadsLayerRef.current.setVisible(!!layersConfig.roads);
      if (layerOpacity?.roads !== undefined) {
        roadsLayerRef.current.setOpacity(layerOpacity.roads);
      }
      if (layersConfig.roads && roadsSourceRef.current.getFeatures().length === 0) {
        fetch('/api/spatial/roads')
          .then(r => r.json())
          .then(data => {
            if (data && data.features) {
              const format = new GeoJSON({ dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
              roadsSourceRef.current.addFeatures(format.readFeatures(data));
            }
          })
          .catch(() => {});
      }
    }
    if (healthcareLayerRef.current) {
      healthcareLayerRef.current.setVisible(!!layersConfig.healthcareFacilities);
      if (layerOpacity?.healthcareFacilities !== undefined) {
        healthcareLayerRef.current.setOpacity(layerOpacity.healthcareFacilities);
      }
    }
    if (educationLayerRef.current) {
      educationLayerRef.current.setVisible(!!layersConfig.educationFacilities);
      if (layerOpacity?.educationFacilities !== undefined) {
        educationLayerRef.current.setOpacity(layerOpacity.educationFacilities);
      }
    }
    if (tourismLayerRef.current) {
      tourismLayerRef.current.setVisible(!!layersConfig.tourism);
      if (layerOpacity?.tourism !== undefined) {
        tourismLayerRef.current.setOpacity(layerOpacity.tourism);
      }
    }

    if (mapInstanceRef.current) mapInstanceRef.current.render();
  }, [layersConfig, layerOpacity]);

  // Update Parameter Engine Angin (Pola, Kecepatan, Kerapatan)
  useEffect(() => {
    const engine = windEngineRef.current;
    if (!engine) return;

    if (windPattern) engine.setPattern(windPattern);
    if (windSpeedMode) engine.setSpeedMode(windSpeedMode);
    if (windDensity) engine.setDensity(windDensity);

    if (showWindParticles) {
      engine.start();
    } else {
      engine.stop();
    }
  }, [showWindParticles, windPattern, windSpeedMode, windDensity]);

  // Update Hasil Analisis Spasial
  useEffect(() => {
    if (!analysisSourceRef.current) return;
    analysisSourceRef.current.clear();

    if (analysisResult && analysisResult.features && analysisResult.features.length > 0) {
      const format = new GeoJSON({
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      const olFeatures = format.readFeatures(analysisResult);
      analysisSourceRef.current.addFeatures(olFeatures);

      if (olFeatures.length > 0 && mapInstanceRef.current) {
        const extent = analysisSourceRef.current.getExtent();
        mapInstanceRef.current.getView().fit(extent, {
          padding: [60, 60, 60, 60],
          duration: 700,
          maxZoom: 13
        });
      }
    }
  }, [analysisResult]);

  // Update Highlight Feature Terpilih Ketika Diklik dari Sidebar
  useEffect(() => {
    if (!highlightSourceRef.current) return;
    highlightSourceRef.current.clear();

    if (selectedFeature && (selectedFeature.NAMOBJ || selectedFeature.namobj || selectedFeature.id)) {
      const allFeatures = [
        ...povertySourceRef.current.getFeatures(),
        ...spatialPatternSourceRef.current.getFeatures(),
        ...districtSourceRef.current.getFeatures()
      ];
      const match = allFeatures.find(f => 
        f.get('NAMOBJ') === selectedFeature.NAMOBJ || 
        f.get('namobj') === selectedFeature.namobj ||
        String(f.get('id')) === String(selectedFeature.id)
      );

      if (match) {
        highlightSourceRef.current.addFeature(match.clone());
      }
    }
  }, [selectedFeature]);

  // Zoom to Target
  useEffect(() => {
    if (!zoomToTarget || !mapInstanceRef.current) return;
    const allFeatures = povertySourceRef.current.getFeatures();
    const match = allFeatures.find(f => 
      (f.get('NAMOBJ') || f.get('namobj'))?.toLowerCase() === zoomToTarget.toLowerCase() ||
      (f.get('WADMKC') || f.get('wadmkc'))?.toLowerCase() === zoomToTarget.toLowerCase()
    );

    if (match) {
      const geom = match.getGeometry();
      mapInstanceRef.current.getView().fit(geom.getExtent(), {
        padding: [80, 80, 80, 80],
        duration: 800,
        maxZoom: 12
      });
      onSelectFeature(match.getProperties());
    }
  }, [zoomToTarget]);

  // -------------------------------------------------------------
  // FITUR SWIPE PEMBANDING (SPLIT-SCREEN CURTAIN DENGAN DUKUNGAN MOUSE & TOUCH)
  // -------------------------------------------------------------
  useEffect(() => {
    const povertyLayer = povertyLayerRef.current;
    const disasterLayer = disasterLayerRef.current;
    const map = mapInstanceRef.current;

    if (!povertyLayer || !disasterLayer || !map) return;

    function handlePovertyPrerender(event) {
      const ctx = event.context;
      if (!ctx || !ctx.canvas) return;
      const width = ctx.canvas.width * (swipePosition / 100);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, ctx.canvas.height);
      ctx.clip();
    }

    function handleDisasterPrerender(event) {
      const ctx = event.context;
      if (!ctx || !ctx.canvas) return;
      const left = ctx.canvas.width * (swipePosition / 100);
      const width = ctx.canvas.width - left;
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, 0, width, ctx.canvas.height);
      ctx.clip();
    }

    function handlePostrender(event) {
      const ctx = event.context;
      if (ctx) {
        try { ctx.restore(); } catch (e) {}
      }
    }

    povertyLayer.un('prerender', handlePovertyPrerender);
    povertyLayer.un('postrender', handlePostrender);
    disasterLayer.un('prerender', handleDisasterPrerender);
    disasterLayer.un('postrender', handlePostrender);

    if (swipeEnabled) {
      povertyLayer.setVisible(true);
      disasterLayer.setVisible(true);

      povertyLayer.on('prerender', handlePovertyPrerender);
      povertyLayer.on('postrender', handlePostrender);
      disasterLayer.on('prerender', handleDisasterPrerender);
      disasterLayer.on('postrender', handlePostrender);
    } else {
      povertyLayer.setVisible(!!layersConfig.povertyClusters);
      disasterLayer.setVisible(!!layersConfig.disasterRisk);
    }

    map.render();

    return () => {
      povertyLayer.un('prerender', handlePovertyPrerender);
      povertyLayer.un('postrender', handlePostrender);
      disasterLayer.un('prerender', handleDisasterPrerender);
      disasterLayer.un('postrender', handlePostrender);
    };
  }, [swipeEnabled, swipePosition, layersConfig]);

  // Handler Swipe Mouse & Touch
  const handleDragStart = () => setIsDraggingSwipe(true);
  const handleDragEnd = () => setIsDraggingSwipe(false);

  const updateSwipeByClientX = (clientX) => {
    if (!mapElementRef.current) return;
    const rect = mapElementRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSwipePosition(pct);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingSwipe) return;
    updateSwipeByClientX(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDraggingSwipe || !e.touches || !e.touches[0]) return;
    updateSwipeByClientX(e.touches[0].clientX);
  };

  const handleSwapSides = () => {
    const temp = swipeLeftLayer;
    setSwipeLeftLayer(swipeRightLayer);
    setSwipeRightLayer(temp);
  };

  const jumpToKecamatan = (kecName) => {
    if (!mapInstanceRef.current) return;
    if (kecName === 'all') {
      const extent = povertySourceRef.current.getExtent();
      if (extent && isFinite(extent[0])) {
        mapInstanceRef.current.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 800 });
      }
      return;
    }

    const matches = povertySourceRef.current.getFeatures().filter(f => 
      (f.get('WADMKC') || f.get('wadmkc'))?.toLowerCase().includes(kecName.toLowerCase())
    );

    if (matches.length > 0) {
      const source = new VectorSource({ features: matches });
      const extent = source.getExtent();
      mapInstanceRef.current.getView().fit(extent, {
        padding: [60, 60, 60, 60],
        duration: 800,
        maxZoom: 12
      });
    }
  };

  // Pengukuran Geodesik
  const startGeodesicMeasure = (type) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    stopGeodesicMeasure();

    setActiveMeasureType(type);
    setMeasureResultText('Klik pada peta untuk mulai mengukur...');

    const draw = new Draw({
      source: measureSourceRef.current,
      type: type,
      style: new Style({
        fill: new Fill({ color: 'rgba(99, 102, 241, 0.2)' }),
        stroke: new Stroke({ color: '#6366f1', width: 2.5 }),
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: '#ffffff' }),
          stroke: new Stroke({ color: '#6366f1', width: 2 })
        })
      })
    });

    draw.on('drawstart', (evt) => {
      measureSourceRef.current.clear();
      const geom = evt.feature.getGeometry();
      geom.on('change', () => {
        if (type === 'LineString') {
          const length = getLength(geom);
          const output = length > 1000 
            ? `${(length / 1000).toFixed(2).replace('.', ',')} km`
            : `${length.toFixed(1).replace('.', ',')} m`;
          setMeasureResultText(output);
        } else if (type === 'Polygon') {
          const area = getArea(geom);
          const output = area > 10000 
            ? `${(area / 10000).toFixed(2).replace('.', ',')} ha (${(area / 1000000).toFixed(2).replace('.', ',')} km²)`
            : `${area.toFixed(1).replace('.', ',')} m²`;
          setMeasureResultText(output);
        }
      });
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;
  };

  const stopGeodesicMeasure = () => {
    const map = mapInstanceRef.current;
    if (map && drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
    measureSourceRef.current.clear();
    setActiveMeasureType(null);
    setMeasureResultText(null);
  };

  return (
    <div 
      className="relative w-full h-full min-h-[500px] select-none overflow-hidden bg-slate-950"
      style={{ width: '100%', height: '100%', minHeight: '500px', position: 'relative' }}
      onMouseMove={isDraggingSwipe ? handleMouseMove : undefined}
      onMouseUp={isDraggingSwipe ? handleDragEnd : undefined}
      onTouchMove={isDraggingSwipe ? handleTouchMove : undefined}
      onTouchEnd={isDraggingSwipe ? handleDragEnd : undefined}
    >
      {/* Kanvas Utama OpenLayers */}
      <div 
        ref={mapElementRef} 
        className="w-full h-full min-h-[500px]" 
        style={{ width: '100%', height: '100%', minHeight: '500px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Kanvas Overlay Simulasi Angin Transparan 60 FPS */}
      <canvas 
        ref={windCanvasRef}
        className="absolute inset-0 pointer-events-none hidden w-full h-full"
        style={{ zIndex: 12, opacity: 0.9 }}
      />

      {/* Loading Overlay */}
      {loadingData && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 bg-slate-900/90 border border-indigo-500/50 rounded-full text-xs font-semibold text-indigo-300 flex items-center gap-2 shadow-2xl backdrop-blur-md pointer-events-none">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Memuat 10 Dataset Spasial Kotawaringin Timur...</span>
        </div>
      )}

      {/* Error Alert */}
      {loadError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 bg-rose-950/90 border border-rose-500/60 rounded-full text-xs font-semibold text-rose-200 flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{loadError}</span>
        </div>
      )}

      {/* HEADER NAVIGASI / QUICK JUMP KECAMATAN TERATUR (Z-INDEX 50 SESUAI SPESIFIKASI) */}
      {!swipeEnabled && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 max-w-[94vw] pointer-events-auto">
          {/* Quick Jump Bar */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-1 shadow-2xl">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1 whitespace-nowrap">
              <Navigation className="w-3 h-3 text-indigo-400" /> Lompat:
            </span>
            <button onClick={() => jumpToKecamatan('all')} className="px-2 py-1 text-xs font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition whitespace-nowrap cursor-pointer">Seluruh Kotim</button>
            <button onClick={() => jumpToKecamatan('Baamang')} className="px-2 py-1 text-xs font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition whitespace-nowrap cursor-pointer">Baamang</button>
            <button onClick={() => jumpToKecamatan('Ketapang')} className="px-2 py-1 text-xs font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition whitespace-nowrap cursor-pointer">Ketapang</button>
            <button onClick={() => jumpToKecamatan('Kota Besi')} className="px-2 py-1 text-xs font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition whitespace-nowrap cursor-pointer">Kota Besi</button>
            <button onClick={() => jumpToKecamatan('Parenggean')} className="px-2 py-1 text-xs font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition whitespace-nowrap cursor-pointer">Parenggean</button>
            <button onClick={() => jumpToKecamatan('Cempaga')} className="px-2 py-1 text-xs font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition whitespace-nowrap cursor-pointer">Cempaga</button>
          </div>
        </div>
      )}

      {/* FLOATING MEASUREMENT ACTIVE BANNER */}
      {activeMeasureType && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-indigo-500 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-md flex items-center gap-4 z-40">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Pengukuran Geodesik ({activeMeasureType === 'LineString' ? 'Jarak Garis' : 'Luas Area'})
              </div>
              <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                {measureResultText || 'Klik peta untuk mengukur'}
              </div>
            </div>
          </div>
          <button 
            onClick={stopGeodesicMeasure}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </button>
        </div>
      )}

      {/* FLOATING TOP SWIPE CONTROLLER (Saat Mode Tirai Komparasi Aktif) */}
      {swipeEnabled && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-indigo-500/80 shadow-2xl max-w-[95vw]">
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider hidden md:inline">Tirai Komparasi</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase">Kiri:</span>
            <span className="text-xs font-semibold text-slate-200">Klaster Kemiskinan</span>
          </div>

          <button 
            onClick={handleSwapSides} 
            className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 flex items-center justify-center transition cursor-pointer"
            title="Tukar Posisi Layer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase">Kanan:</span>
            <span className="text-xs font-semibold text-slate-200">Risiko Bencana</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-2">
            <span className="text-xs font-mono font-bold text-indigo-400 w-8 text-center">{Math.round(swipePosition)}%</span>
            <input 
              type="range" 
              min="5" 
              max="95" 
              value={swipePosition} 
              onChange={(e) => setSwipePosition(Number(e.target.value))}
              className="w-20 lg:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <button 
            onClick={() => setSwipeEnabled(false)}
            className="h-7 px-2.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors ml-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tutup</span>
          </button>
        </div>
      )}

      {/* Garis Pembatas Vertikal Swipe & Handle Geser (Dukungan Mouse & Touch) */}
      {swipeEnabled && (
        <div
          className="absolute top-0 bottom-0 z-40 pointer-events-auto select-none"
          style={{ left: `${swipePosition}%`, width: '2px' }}
        >
          <div className="absolute inset-0 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-slate-950 border-2 border-indigo-400 text-indigo-300 shadow-2xl flex items-center justify-center cursor-ew-resize hover:scale-110 active:scale-95 transition-transform touch-none"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            title="Geser tirai pembanding"
          >
            <Sliders className="w-3.5 h-3.5 rotate-90" />
            <span className="absolute -top-6 px-1.5 py-0.5 rounded bg-slate-950/95 border border-indigo-500/80 text-[9px] font-mono font-bold text-indigo-300 whitespace-nowrap shadow-lg">
              {Math.round(swipePosition)}%
            </span>
          </div>
        </div>
      )}

      {/* Floating Tool Peta Cepat (Samping Kiri) */}
      <div className={`absolute top-20 z-20 flex flex-col gap-1.5 pointer-events-auto transition-all ${leftPanelOpen ? 'left-[360px] sm:left-[390px]' : 'left-4'}`}>
        <button
          onClick={() => {
            if (povertySourceRef.current && mapInstanceRef.current) {
              const extent = povertySourceRef.current.getExtent();
              if (extent && isFinite(extent[0])) {
                mapInstanceRef.current.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 800 });
              }
            }
          }}
          className="w-8 h-8 rounded-xl bg-slate-900/75 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700/50 hover:border-indigo-400 shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
          title="Fokus ke Seluruh Wilayah Kotawaringin Timur (Fit Bounds)"
        >
          <Focus className="w-4 h-4" />
        </button>

        <button
          onClick={() => startGeodesicMeasure('LineString')}
          className={`w-8 h-8 rounded-xl border shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
            activeMeasureType === 'LineString' 
              ? 'bg-indigo-600 border-indigo-400 text-white' 
              : 'bg-slate-900/75 hover:bg-slate-800 text-slate-200 border-slate-700/50'
          }`}
          title="Alat Ukur Jarak Geodesik (Garis)"
        >
          <Ruler className="w-4 h-4" />
        </button>
      </div>

      {/* FLOATING WIND HUD LIVE BADGE DENGAN STATUS MANDATORI "Simulasi ilustratif" DI POJOK KANAN BAWAH */}
      {showWindParticles && (
        <div className={`absolute bottom-4 z-30 bg-slate-900/80 border border-slate-700/50 rounded-2xl px-3 py-2 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs text-slate-200 pointer-events-auto transition-all ${rightPanelOpen ? 'right-[360px] sm:right-[390px]' : 'right-4'}`}>
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white text-[11px]">
                {windPattern === 'muson_barat' ? 'Muson Barat Daya' : 
                 windPattern === 'sirkulasi_mentaya' ? 'Sirkulasi DAS Mentaya' : 'Muson Tenggara'}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300">
                Simulasi ilustratif
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Aliran: <span className="text-sky-300 font-semibold">{windSpeedMode === 'fast' ? '32 knot (~59 km/j)' : windSpeedMode === 'slow' ? '12 knot (~22 km/j)' : '22 knot (~41 km/j)'}</span>
            </div>
          </div>
          <button 
            onClick={() => setShowWindParticles(false)}
            className="w-5 h-5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer ml-1"
            title="Matikan Simulasi Angin"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* LEGENDA DINAMIS MELAYANG (HANYA Menampilkan Simbol Layer yang Sedang Aktif di Pojok Kiri Bawah) */}
      <div 
        className={`absolute bottom-4 z-30 transition-all duration-300 ${
          leftPanelOpen ? 'left-[360px] sm:left-[390px]' : 'left-4'
        }`}
      >
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-2.5 max-w-xs transition-all pointer-events-auto">
          <div 
            onClick={() => setLegendExpanded(!legendExpanded)}
            className="flex items-center justify-between gap-2 px-1 cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <LayersIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Legenda Dinamis</span>
            </div>
            <button className="text-slate-400 hover:text-white p-0.5">
              {legendExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {legendExpanded && (
            <div className="pt-2 border-t border-white/10 mt-1.5 space-y-2 text-[11px] max-h-56 overflow-y-auto pr-1">
              {/* 1. Klaster Kemiskinan */}
              {layersConfig.povertyClusters && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Klaster Kemiskinan:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-indigo-500/80 border border-indigo-400" />
                    <span className="text-slate-300">Kumuh Perkotaan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-amber-500/80 border border-amber-400" />
                    <span className="text-slate-300">Pedesaan (Rasio Ketergantungan)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-red-500/80 border border-red-400" />
                    <span className="text-slate-300">Terpencil (Keterbatasan Aset)</span>
                  </div>
                </div>
              )}

              {/* 2. Pola Spasial Kemiskinan */}
              {layersConfig.povertyPatterns && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pola Spasial Kemiskinan:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-purple-500/60 border border-purple-400" />
                    <span className="text-slate-300">Distribusi Spasial Desa</span>
                  </div>
                </div>
              )}

              {/* 3. Batas Kecamatan */}
              {layersConfig.districtBoundary && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batas Administrasi:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-300" />
                    <span className="text-slate-300">Batas 17 Kecamatan</span>
                  </div>
                </div>
              )}

              {/* 4. Risiko Bencana */}
              {layersConfig.disasterRisk && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risiko Bencana:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-cyan-500/70 border border-cyan-400" />
                    <span className="text-slate-300">Banjir DAS Mentaya</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-orange-600/70 border border-orange-500" />
                    <span className="text-slate-300">Karhutla Gambut</span>
                  </div>
                </div>
              )}

              {/* 5. Sungai Mentaya */}
              {layersConfig.rivers && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Badan Air & Sungai:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-sky-500/70 border border-sky-400" />
                    <span className="text-slate-300">Sungai Mentaya & Anak Sungai</span>
                  </div>
                </div>
              )}

              {/* 6. Isochrone RS */}
              {layersConfig.isochroneHospital && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jangkauan Rumah Sakit:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500/60 border border-emerald-400" />
                    <span className="text-slate-300">Zona 5 km - 10 km (Prima)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-blue-500/50 border border-blue-400" />
                    <span className="text-slate-300">Zona 25 km - 50 km</span>
                  </div>
                </div>
              )}

              {/* 7. Isochrone SMA/SMK */}
              {layersConfig.isochroneEducation && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jangkauan SMA/SMK:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-amber-500/60 border border-amber-400" />
                    <span className="text-slate-300">Zona 15 km - 25 km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-purple-500/50 border border-purple-400" />
                    <span className="text-slate-300">Zona 30 km - 50 km</span>
                  </div>
                </div>
              )}

              {/* 8. Fasilitas Kesehatan */}
              {layersConfig.healthcareFacilities && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fasilitas Kesehatan:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
                    <span className="text-slate-300">Rumah Sakit Umum/Pratama</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white" />
                    <span className="text-slate-300">Puskesmas Induk / Pustu</span>
                  </div>
                </div>
              )}

              {/* 9. Fasilitas Pendidikan */}
              {layersConfig.educationFacilities && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fasilitas Pendidikan:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white" />
                    <span className="text-slate-300">SMA / SMK / Perguruan Tinggi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white" />
                    <span className="text-slate-300">SMP / SD / TK</span>
                  </div>
                </div>
              )}

              {/* 10. Jaringan Jalan */}
              {layersConfig.roads && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jaringan Jalan:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-orange-500 rounded-sm" />
                    <span className="text-slate-300">Jalan Primer / Nasional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-yellow-400 rounded-sm" />
                    <span className="text-slate-300">Jalan Sekunder / Kolektor</span>
                  </div>
                </div>
              )}

              {/* 11. Pariwisata */}
              {layersConfig.tourism && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pariwisata & Budaya:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                    <span className="text-slate-300">Objek Wisata / Cagar Budaya</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default MapComponent;
