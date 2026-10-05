export interface LayerConfig {
  id: string;
  name: string;
  category: 'analysis' | 'boundary' | 'facility' | 'infrastructure' | 'tourism';
  visible: boolean;
  opacity: number;
  color: string;
  legendType: 'choropleth' | 'single' | 'points' | 'lines';
  description?: string;
  legendItems?: { label: string; color: string; icon?: string }[];
}

export interface SpatialPovertyFeature {
  id?: string | number;
  NAMOBJ: string;
  WADMKC: string;
  WADMKK: string;
  Luas_Ha: number;
  wq_Join_De?: string;
  wq_Join_Ne?: string;
  wq_Pov: string;
  Source?: string;
  [key: string]: any;
}

export interface PostGisStats {
  summary: {
    totalVillages: number;
    totalAreaHa: number;
    districtsCount: number;
  };
  categoryStats: {
    poverty_category: string;
    count: number;
    total_area_ha: number;
    avg_area_ha: number;
  }[];
  districtStats: {
    district_name: string;
    village_count: number;
    total_area_ha: number;
    avg_area_ha: number;
    urban_slum_count: number;
    rural_dep_count: number;
    remote_asset_count: number;
  }[];
}

export interface BufferAnalysisResult {
  center: { lon: number; lat: number };
  radiusKm: number;
  totalIntersectingZones: number;
  totalAreaHa: number;
  breakdown: Record<string, number>;
  zones: {
    id: number;
    village_name: string;
    district_name: string;
    area_ha: number;
    poverty_category: string;
    distance_meters: number;
    geometry: any;
  }[];
}

export interface SpatialBookmark {
  id: number;
  userId?: string;
  title: string;
  notes?: string;
  centerLon: number;
  centerLat: number;
  zoom: number;
  activeLayers?: string[];
  districtFilter?: string;
  povertyCategory?: string;
  createdAt: string;
}
