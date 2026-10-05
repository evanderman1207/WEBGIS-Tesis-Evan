import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import Feature from 'ol/Feature';

const styleCache: Record<string, Style> = {};

export const POVERTY_COLORS = {
  urbanSlum: 'rgba(239, 68, 68, 0.65)',
  urbanSlumStroke: 'rgba(220, 38, 38, 0.95)',
  ruralDep: 'rgba(234, 179, 8, 0.65)',
  ruralDepStroke: 'rgba(202, 138, 4, 0.95)',
  remoteAsset: 'rgba(168, 85, 247, 0.65)',
  remoteAssetStroke: 'rgba(147, 51, 234, 0.95)',
  default: 'rgba(100, 116, 139, 0.5)',
  defaultStroke: 'rgba(71, 85, 105, 0.8)',
};

export function getPovertyPatternStyle(feature: Feature, resolution: number): Style {
  const props = feature.getProperties();
  const pov = (props.wq_Pov || '').toLowerCase();
  let key = 'default';

  if (pov.includes('urban slum') || pov.includes('kawasan kumuh')) {
    key = 'urbanSlum';
  } else if (pov.includes('rural area') || pov.includes('ketergantungan tinggi')) {
    key = 'ruralDep';
  } else if (pov.includes('remote area') || pov.includes('terpencil') || pov.includes('aset')) {
    key = 'remoteAsset';
  }

  const cacheKey = `pov_${key}_${resolution < 50 ? 'labeled' : 'plain'}`;
  if (styleCache[cacheKey]) return styleCache[cacheKey];

  let fill = POVERTY_COLORS.default;
  let stroke = POVERTY_COLORS.defaultStroke;

  if (key === 'urbanSlum') {
    fill = POVERTY_COLORS.urbanSlum;
    stroke = POVERTY_COLORS.urbanSlumStroke;
  } else if (key === 'ruralDep') {
    fill = POVERTY_COLORS.ruralDep;
    stroke = POVERTY_COLORS.ruralDepStroke;
  } else if (key === 'remoteAsset') {
    fill = POVERTY_COLORS.remoteAsset;
    stroke = POVERTY_COLORS.remoteAssetStroke;
  }

  const style = new Style({
    fill: new Fill({ color: fill }),
    stroke: new Stroke({ color: stroke, width: 1.5 }),
    text: resolution < 60 ? new Text({
      text: props.NAMOBJ || '',
      font: '11px Inter, sans-serif',
      fill: new Fill({ color: '#ffffff' }),
      stroke: new Stroke({ color: '#0f172a', width: 3 }),
      overflow: true,
      placement: 'point',
    }) : undefined,
  });

  styleCache[cacheKey] = style;
  return style;
}

export function getDistrictBoundaryStyle(feature: Feature, resolution: number): Style {
  const name = feature.get('WADMKC') || '';
  const cacheKey = `district_${resolution < 120 ? name : 'simple'}`;
  if (styleCache[cacheKey]) return styleCache[cacheKey];

  const style = new Style({
    fill: new Fill({ color: 'rgba(56, 189, 248, 0.08)' }),
    stroke: new Stroke({
      color: '#38bdf8',
      width: 2.2,
      lineDash: [6, 4],
    }),
    text: resolution < 120 ? new Text({
      text: name.toUpperCase(),
      font: 'bold 12px Inter, sans-serif',
      fill: new Fill({ color: '#38bdf8' }),
      stroke: new Stroke({ color: '#090d16', width: 3 }),
      offsetY: -5,
    }) : undefined,
  });

  styleCache[cacheKey] = style;
  return style;
}

export function getHealthcareStyle(feature: Feature): Style {
  const jenis = (feature.get('Jenis') || '').toLowerCase();
  let color = '#3b82f6';
  let radius = 6;

  if (jenis.includes('rumah sakit')) {
    color = '#ef4444';
    radius = 8;
  } else if (jenis.includes('induk')) {
    color = '#06b6d4';
    radius = 6;
  } else {
    color = '#10b981';
    radius = 5;
  }

  return new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
  });
}

export function getEducationStyle(feature: Feature): Style {
  const jenis = (feature.get('JENIS') || feature.get('Jenis') || '').toLowerCase();
  let color = '#8b5cf6';
  let radius = 5;

  if (jenis.includes('tinggi')) {
    color = '#a855f7';
    radius = 8;
  } else if (jenis.includes('sma') || jenis.includes('smk')) {
    color = '#3b82f6';
    radius = 7;
  } else if (jenis.includes('smp')) {
    color = '#0284c7';
    radius = 5.5;
  } else {
    color = '#84cc16';
    radius = 4.5;
  }

  return new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 1.5 }),
    }),
  });
}

export function getRoadStyle(feature: Feature): Style {
  const fungsi = (feature.get('Fungsi') || feature.get('REMARK') || '').toLowerCase();
  let color = '#64748b';
  let width = 1;

  if (fungsi.includes('nasional') || fungsi.includes('primer')) {
    color = '#f59e0b';
    width = 2.5;
  } else if (fungsi.includes('provinsi')) {
    color = '#fbbf24';
    width = 2.0;
  } else if (fungsi.includes('kabupaten')) {
    color = '#94a3b8';
    width = 1.5;
  } else if (fungsi.includes('sungai') || fungsi.includes('river')) {
    color = '#38bdf8';
    width = 1.8;
  }

  return new Style({
    stroke: new Stroke({ color, width }),
  });
}

export function getIsochroneStyle(feature: Feature): Style {
  const dist = String(feature.get('Cost') || feature.get('AA_MINS') || feature.get('distance') || '');
  let color = 'rgba(59, 130, 246, 0.2)';
  let stroke = '#3b82f6';

  if (dist.includes('5000') || dist === '5') {
    color = 'rgba(16, 185, 129, 0.25)';
    stroke = '#10b981';
  } else if (dist.includes('10000') || dist.includes('15000')) {
    color = 'rgba(6, 182, 212, 0.25)';
    stroke = '#06b6d4';
  } else if (dist.includes('25000') || dist.includes('30000')) {
    color = 'rgba(245, 158, 11, 0.25)';
    stroke = '#f59e0b';
  } else if (dist.includes('50000')) {
    color = 'rgba(239, 68, 68, 0.2)';
    stroke = '#ef4444';
  }

  return new Style({
    fill: new Fill({ color }),
    stroke: new Stroke({ color: stroke, width: 1.5 }),
  });
}

export function getTourismStyle(): Style {
  return new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: '#f59e0b' }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
  });
}

export const HIGHLIGHT_STYLE = new Style({
  stroke: new Stroke({
    color: '#facc15',
    width: 3.5,
  }),
  fill: new Fill({
    color: 'rgba(250, 204, 21, 0.45)',
  }),
});
