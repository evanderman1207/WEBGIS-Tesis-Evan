import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, toLonLat } from 'ol/proj';
import { ScaleLine, Zoom } from 'ol/control';
import { Draw } from 'ol/interaction';
import { getArea, getLength } from 'ol/sphere';
import Feature from 'ol/Feature';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { fromCircle } from 'ol/geom/Polygon';
import { Circle as CircleGeom, Point } from 'ol/geom';
import { LayerConfig, BufferAnalysisResult } from '../types/spatial.ts';
import { 
  getPovertyPatternStyle, 
  getDistrictBoundaryStyle, 
  getHealthcareStyle, 
  getEducationStyle, 
  getRoadStyle, 
  getIsochroneStyle, 
  getTourismStyle,
  HIGHLIGHT_STYLE 
} from '../utils/mapStyles.ts';

interface MapContainerProps {
  layers: LayerConfig[];
  activeBasemap: string;
  onSelectFeature: (properties: Record<string, any> | null) => void;
  onPointerCoordChange: (coord: [number, number]) => void;
  isMeasuring: boolean;
  measureType: 'distance' | 'area';
  selectedDistrict: string;
  bufferResult: BufferAnalysisResult | null;
  onMapClickForBuffer?: (coord: [number, number]) => void;
  isPickingBufferPoint?: boolean;
}

const KOTIM_CENTER = [112.95, -2.53];
const DEFAULT_ZOOM = 9;

export const MapContainer: React.FC<MapContainerProps> = ({
  layers,
  activeBasemap,
  onSelectFeature,
  onPointerCoordChange,
  isMeasuring,
  measureType,
  selectedDistrict,
  bufferResult,
  onMapClickForBuffer,
  isPickingBufferPoint,
}) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const baseLayersRef = useRef<Record<string, TileLayer<any>>>({});
  const vectorLayersRef = useRef<Record<string, VectorLayer<any>>>({});
  const highlightLayerRef = useRef<VectorLayer<any> | null>(null);
  const bufferLayerRef = useRef<VectorLayer<any> | null>(null);
  const measureLayerRef = useRef<VectorLayer<any> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const [measurementText, setMeasurementText] = useState<string | null>(null);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: activeBasemap === 'osm',
    });

    const esriSatellite = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
      }),
      visible: activeBasemap === 'esri-satellite',
    });

    const cartoDark = new TileLayer({
      source: new XYZ({
        url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        maxZoom: 19,
      }),
      visible: activeBasemap === 'carto-dark',
    });

    const openTopo = new TileLayer({
      source: new XYZ({
        url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        maxZoom: 17,
      }),
      visible: activeBasemap === 'opentopo',
    });

    baseLayersRef.current = {
      osm: osmLayer,
      'esri-satellite': esriSatellite,
      'carto-dark': cartoDark,
      opentopo: openTopo,
    };

    const measureSource = new VectorSource();
    const measureLayer = new VectorLayer({
      source: measureSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(245, 158, 11, 0.25)' }),
        stroke: new Stroke({ color: '#f59e0b', width: 2.5 }),
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: '#f59e0b' }),
        }),
      }),
      zIndex: 100,
    });
    measureLayerRef.current = measureLayer;

    const bufferSource = new VectorSource();
    const bufferLayer = new VectorLayer({
      source: bufferSource,
      style: (feature) => {
        const isCenter = feature.get('isCenter');
        if (isCenter) {
          return new Style({
            image: new CircleStyle({
              radius: 8,
              fill: new Fill({ color: '#10b981' }),
              stroke: new Stroke({ color: '#ffffff', width: 2 }),
            }),
          });
        }
        return new Style({
          fill: new Fill({ color: 'rgba(16, 185, 129, 0.15)' }),
          stroke: new Stroke({ color: '#10b981', width: 2.5, lineDash: [8, 6] }),
        });
      },
      zIndex: 90,
    });
    bufferLayerRef.current = bufferLayer;

    const highlightSource = new VectorSource();
    const highlightLayer = new VectorLayer({
      source: highlightSource,
      style: HIGHLIGHT_STYLE,
      zIndex: 95,
    });
    highlightLayerRef.current = highlightLayer;

    const view = new View({
      center: fromLonLat(KOTIM_CENTER),
      zoom: DEFAULT_ZOOM,
      minZoom: 6,
      maxZoom: 19,
    });

    const map = new Map({
      target: mapElement.current,
      layers: [
        osmLayer,
        esriSatellite,
        cartoDark,
        openTopo,
        measureLayer,
        bufferLayer,
        highlightLayer,
      ],
      view,
      controls: [
        new Zoom(),
        new ScaleLine({ units: 'metric' }),
      ],
    });

    mapRef.current = map;

    map.on('pointermove', (evt) => {
      const coord = toLonLat(evt.coordinate);
      onPointerCoordChange([coord[0], coord[1]]);
    });

    map.on('singleclick', (evt) => {
      const lonLat = toLonLat(evt.coordinate);

      if (isPickingBufferPoint && onMapClickForBuffer) {
        onMapClickForBuffer([lonLat[0], lonLat[1]]);
        return;
      }

      let foundFeature: Feature | null = null;
      map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
        if (!foundFeature && layer !== measureLayer && layer !== bufferLayer) {
          foundFeature = feat as Feature;
        }
      });

      if (foundFeature) {
        const props = (foundFeature as Feature).getProperties();
        highlightSource.clear();
        highlightSource.addFeature(foundFeature);
        onSelectFeature({ ...props, _coords: lonLat });
      } else {
        highlightSource.clear();
        onSelectFeature(null);
      }
    });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    Object.entries(baseLayersRef.current).forEach(([id, layer]) => {
      layer.setVisible(id === activeBasemap);
    });
  }, [activeBasemap]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    layers.forEach((layerConf) => {
      let vLayer = vectorLayersRef.current[layerConf.id];

      if (!vLayer) {
        const source = new VectorSource({
          format: new GeoJSON(),
          url: `/api/spatial/layers/${layerConf.id}`,
        });

        let styleFn = (f: any, res: number) => new Style({ fill: new Fill({ color: layerConf.color }) });
        if (layerConf.id === 'poverty-patterns' || layerConf.id === 'poverty-clusters') {
          styleFn = getPovertyPatternStyle;
        } else if (layerConf.id === 'districts') {
          styleFn = getDistrictBoundaryStyle;
        } else if (layerConf.id === 'healthcare') {
          styleFn = getHealthcareStyle;
        } else if (layerConf.id === 'education') {
          styleFn = getEducationStyle;
        } else if (layerConf.id === 'roads' || layerConf.id === 'rivers') {
          styleFn = getRoadStyle;
        } else if (layerConf.id.includes('isochrone')) {
          styleFn = getIsochroneStyle;
        } else if (layerConf.id === 'tourism') {
          styleFn = getTourismStyle;
        }

        vLayer = new VectorLayer({
          source,
          style: styleFn,
          opacity: layerConf.opacity,
          visible: layerConf.visible,
          zIndex: layerConf.category === 'facility' || layerConf.category === 'tourism' ? 50 : 20,
        });

        vectorLayersRef.current[layerConf.id] = vLayer;
        map.addLayer(vLayer);
      } else {
        vLayer.setVisible(layerConf.visible);
        vLayer.setOpacity(layerConf.opacity);
      }
    });
  }, [layers]);

  useEffect(() => {
    if (!mapRef.current) return;
    const districtLayer = vectorLayersRef.current['districts'];
    if (!districtLayer) return;

    const source = districtLayer.getSource();
    if (!source) return;

    if (selectedDistrict === 'ALL') {
      districtLayer.setStyle(getDistrictBoundaryStyle);
      mapRef.current.getView().animate({
        center: fromLonLat(KOTIM_CENTER),
        zoom: DEFAULT_ZOOM,
        duration: 800,
      });
      return;
    }

    const features = source.getFeatures();
    const match = features.find((f: any) => f.get('WADMKC') === selectedDistrict);

    if (match) {
      const geom = match.getGeometry();
      if (geom) {
        mapRef.current.getView().fit(geom.getExtent(), {
          padding: [50, 50, 50, 50],
          duration: 900,
          maxZoom: 12,
        });
      }
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (!bufferLayerRef.current) return;
    const source = bufferLayerRef.current.getSource();
    if (!source) return;

    source.clear();
    if (!bufferResult) return;

    const { center, radiusKm } = bufferResult;
    const centerWebMercator = fromLonLat([center.lon, center.lat]);

    const circleGeom = new CircleGeom(centerWebMercator, radiusKm * 1000);
    const circlePolygon = fromCircle(circleGeom, 64);

    const bufferFeature = new Feature({
      geometry: circlePolygon,
    });

    const centerPoint = new Feature({
      geometry: new Point(centerWebMercator),
      isCenter: true,
    });

    source.addFeatures([bufferFeature, centerPoint]);

    if (mapRef.current) {
      mapRef.current.getView().fit(circlePolygon.getExtent(), {
        padding: [60, 60, 60, 60],
        duration: 800,
        maxZoom: 13,
      });
    }
  }, [bufferResult]);

  useEffect(() => {
    if (!mapRef.current || !measureLayerRef.current) return;
    const map = mapRef.current;
    const measureSource = measureLayerRef.current.getSource();

    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    if (!isMeasuring) {
      measureSource?.clear();
      setMeasurementText(null);
      return;
    }

    const drawType = measureType === 'area' ? 'Polygon' : 'LineString';
    const draw = new Draw({
      source: measureSource!,
      type: drawType,
      style: new Style({
        fill: new Fill({ color: 'rgba(245, 158, 11, 0.25)' }),
        stroke: new Stroke({ color: '#f59e0b', width: 2.5, lineDash: [6, 4] }),
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: '#f59e0b' }),
        }),
      }),
    });

    draw.on('drawstart', () => {
      measureSource?.clear();
      setMeasurementText('Mengukur... klik untuk titik berikutnya, klik dua kali untuk selesai');
    });

    draw.on('drawend', (evt) => {
      const geom = evt.feature.getGeometry();
      if (!geom) return;

      if (measureType === 'distance') {
        const length = getLength(geom);
        const formatted = length > 1000 
          ? `${(length / 1000).toFixed(2)} km` 
          : `${Math.round(length)} meter`;
        setMeasurementText(`Jarak Total: ${formatted}`);
      } else {
        const area = getArea(geom);
        const ha = area / 10000;
        const formatted = ha > 100 
          ? `${(ha / 100).toFixed(2)} km² (${ha.toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ha)` 
          : `${ha.toFixed(2)} Ha (${Math.round(area)} m²)`;
        setMeasurementText(`Luas Area: ${formatted}`);
      }
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;

    return () => {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
      }
    };
  }, [isMeasuring, measureType]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-950">
      <div ref={mapElement} className="w-full h-full" />

      {isMeasuring && measurementText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-amber-300 border border-amber-500/50 px-4 py-2 rounded-xl text-xs font-mono font-bold shadow-2xl backdrop-blur-md z-10 flex items-center gap-2">
          <span>{measurementText}</span>
        </div>
      )}

      <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => {
            mapRef.current?.getView().animate({
              center: fromLonLat(KOTIM_CENTER),
              zoom: DEFAULT_ZOOM,
              duration: 700,
            });
          }}
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl shadow-lg backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition"
          title="Reset Pandangan ke Kotawaringin Timur"
        >
          <span>Fokus Kotim</span>
        </button>
      </div>
    </div>
  );
};
