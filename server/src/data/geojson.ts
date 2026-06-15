/**
 * GeoJSON 边界数据模块
 * 提供行政区划边界多边形数据
 * 
 * 说明：完整的全国GeoJSON数据量较大（>100MB），
 * 此处提供省级示例数据，生产环境建议：
 * 1. 使用对象存储存储完整GeoJSON文件
 * 2. 使用CDN加速访问
 * 3. 按需加载区县级别数据
 */

// 简化的省级边界数据（实际生产应使用完整数据）
interface RegionBoundary {
  code: string;
  name: string;
  type: 'province' | 'city' | 'district';
  // 简化的边界点（实际应为完整Polygon坐标）
  center: [number, number]; // [lng, lat]
  boundingBox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

// 省级中心点数据（简化版，用于快速展示）
export const provinceBoundaries: Record<string, RegionBoundary> = {
  '11': { code: '11', name: '北京市', type: 'province', center: [116.4074, 39.9042] },
  '12': { code: '12', name: '天津市', type: 'province', center: [117.3616, 39.3434] },
  '13': { code: '13', name: '河北省', type: 'province', center: [114.5149, 38.0428] },
  '14': { code: '14', name: '山西省', type: 'province', center: [112.5490, 37.8570] },
  '15': { code: '15', name: '内蒙古自治区', type: 'province', center: [111.6708, 40.8183] },
  '21': { code: '21', name: '辽宁省', type: 'province', center: [123.4315, 41.8357] },
  '22': { code: '22', name: '吉林省', type: 'province', center: [125.3245, 43.8868] },
  '23': { code: '23', name: '黑龙江省', type: 'province', center: [126.6421, 45.7569] },
  '31': { code: '31', name: '上海市', type: 'province', center: [121.4737, 31.2304] },
  '32': { code: '32', name: '江苏省', type: 'province', center: [118.7969, 32.0603] },
  '33': { code: '33', name: '浙江省', type: 'province', center: [120.1536, 30.2875] },
  '34': { code: '34', name: '安徽省', type: 'province', center: [117.2849, 31.8612] },
  '35': { code: '35', name: '福建省', type: 'province', center: [119.2965, 26.0745] },
  '36': { code: '36', name: '江西省', type: 'province', center: [115.8581, 28.6820] },
  '37': { code: '37', name: '山东省', type: 'province', center: [118.0007, 36.6681] },
  '41': { code: '41', name: '河南省', type: 'province', center: [113.2744, 34.0451] },
  '42': { code: '42', name: '湖北省', type: 'province', center: [114.3419, 30.5465] },
  '43': { code: '43', name: '湖南省', type: 'province', center: [112.9830, 28.1127] },
  '44': { code: '44', name: '广东省', type: 'province', center: [113.2806, 23.1252] },
  '45': { code: '45', name: '广西壮族自治区', type: 'province', center: [108.3275, 22.8152] },
  '46': { code: '46', name: '海南省', type: 'province', center: [110.1999, 20.0442] },
  '50': { code: '50', name: '重庆市', type: 'province', center: [106.5516, 29.5630] },
  '51': { code: '51', name: '四川省', type: 'province', center: [104.0665, 30.6598] },
  '52': { code: '52', name: '贵州省', type: 'province', center: [106.7074, 26.5982] },
  '53': { code: '53', name: '云南省', type: 'province', center: [102.7100, 25.0453] },
  '54': { code: '54', name: '西藏自治区', type: 'province', center: [91.1171, 29.6473] },
  '61': { code: '61', name: '陕西省', type: 'province', center: [108.9542, 34.2658] },
  '62': { code: '62', name: '甘肃省', type: 'province', center: [103.8263, 36.0597] },
  '63': { code: '63', name: '青海省', type: 'province', center: [101.7781, 36.6171] },
  '64': { code: '64', name: '宁夏回族自治区', type: 'province', center: [106.2586, 38.4872] },
  '65': { code: '65', name: '新疆维吾尔自治区', type: 'province', center: [87.6168, 43.8266] },
  '71': { code: '71', name: '台湾省', type: 'province', center: [121.5200, 25.0290] },
  '81': { code: '81', name: '香港特别行政区', type: 'province', center: [114.1694, 22.3193] },
  '82': { code: '82', name: '澳门特别行政区', type: 'province', center: [113.5491, 22.1987] },
  '91': { code: '91', name: '钓鱼岛', type: 'province', center: [124.4600, 25.7450] },
  '99': { code: '99', name: '南沙诸岛', type: 'province', center: [116.7000, 9.5500] },
};

// 获取省级边界数据
export function getProvinceBoundary(code: string): RegionBoundary | null {
  return provinceBoundaries[code] || null;
}

// 获取所有省级边界数据
export function getAllProvinceBoundaries(): RegionBoundary[] {
  return Object.values(provinceBoundaries);
}

// GeoJSON Feature 格式
export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    code: string;
    name: string;
    type: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

// GeoJSON FeatureCollection 格式
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// 转换为GeoJSON格式
export function toGeoJSON(data: RegionBoundary[]): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: data.map(item => ({
      type: 'Feature',
      properties: {
        code: item.code,
        name: item.name,
        type: item.type,
      },
      geometry: {
        type: 'Point',
        coordinates: item.center,
      },
    })),
  };
}

// 导出为GeoJSON文件路径（用于CDN加速的大文件）
export function getGeoJSONFilePath(code: string, level: 'province' | 'city' | 'district'): string {
  return `/geojson/${level}/${code}.json`;
}
