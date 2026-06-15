/**
 * 地理计算工具
 * 提供距离计算、经纬度转换等功能
 */

/**
 * 地球平均半径（单位：米）
 */
const EARTH_RADIUS_M = 6371000;

/**
 * 距离单位枚举
 */
export type DistanceUnit = 'km' | 'm' | 'mile' | 'nautical_mile';

/**
 * 单位转换因子（转米）
 */
const UNIT_TO_METERS: Record<DistanceUnit, number> = {
  km: 1000,
  m: 1,
  mile: 1609.344,
  nautical_mile: 1852,
};

/**
 * 经纬度坐标接口
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * 距离结果接口
 */
export interface DistanceResult {
  from: LatLng;
  to: LatLng;
  distance: number;
  unit: DistanceUnit;
  distanceKm: number;     // 始终以公里为单位
  distanceM: number;     // 始终以米为单位
  distanceMile: number;  // 始终以英里为单位
}

/**
 * Haversine公式计算两点间的球面距离
 * @param from 起点坐标
 * @param to 终点坐标
 * @param unit 返回距离的单位，默认为km
 * @returns 距离值
 */
export function calculateDistance(
  from: LatLng,
  to: LatLng,
  unit: DistanceUnit = 'km'
): DistanceResult {
  // 将角度转换为弧度
  const lat1Rad = toRad(from.lat);
  const lat2Rad = toRad(to.lat);
  const deltaLat = toRad(to.lat - from.lat);
  const deltaLng = toRad(to.lng - from.lng);

  // Haversine公式
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // 计算距离（米）
  const distanceM = EARTH_RADIUS_M * c;

  // 转换为指定单位
  const factor = UNIT_TO_METERS[unit];
  const distance = distanceM / factor;

  return {
    from,
    to,
    distance: Math.round(distance * 1000) / 1000, // 保留3位小数
    unit,
    distanceKm: Math.round((distanceM / 1000) * 1000) / 1000,
    distanceM: Math.round(distanceM * 100) / 100,
    distanceMile: Math.round((distanceM / 1609.344) * 1000) / 1000,
  };
}

/**
 * 角度转弧度
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 弧度转角度
 */
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 计算多个点之间的总距离
 * @param points 点列表（按顺序连接）
 * @param unit 距离单位
 * @returns 总距离
 */
export function calculateTotalDistance(
  points: LatLng[],
  unit: DistanceUnit = 'km'
): number {
  if (points.length < 2) {
    return 0;
  }

  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const result = calculateDistance(points[i], points[i + 1], unit);
    total += result.distance;
  }

  return Math.round(total * 1000) / 1000;
}

/**
 * 计算点到线段的最短距离
 * @param point 点
 * @param lineStart 线段起点
 * @param lineEnd 线段终点
 * @param unit 距离单位
 */
export function pointToLineDistance(
  point: LatLng,
  lineStart: LatLng,
  lineEnd: LatLng,
  unit: DistanceUnit = 'km'
): number {
  // 将点投影到线段上
  const a = point.lat - lineStart.lat;
  const b = point.lng - lineStart.lng;
  const c = lineEnd.lat - lineStart.lat;
  const d = lineEnd.lng - lineStart.lng;

  const dot = a * c + b * d;
  const lenSq = c * c + d * d;
  
  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let nearestLat: number;
  let nearestLng: number;

  if (param < 0) {
    nearestLat = lineStart.lat;
    nearestLng = lineStart.lng;
  } else if (param > 1) {
    nearestLat = lineEnd.lat;
    nearestLng = lineEnd.lng;
  } else {
    nearestLat = lineStart.lat + param * c;
    nearestLng = lineStart.lng + param * d;
  }

  const distanceResult = calculateDistance(
    point,
    { lat: nearestLat, lng: nearestLng },
    unit
  );

  return distanceResult.distance;
}

/**
 * 判断点是否在多边形内（射线法）
 * @param point 待判断的点
 * @param polygon 多边形顶点列表
 * @returns true如果在多边形内
 */
export function isPointInPolygon(
  point: LatLng,
  polygon: LatLng[]
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    if (
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * 计算多边形面积（使用球面近似）
 * @param polygon 多边形顶点列表
 * @returns 面积（平方米）
 */
export function calculatePolygonArea(polygon: LatLng[]): number {
  if (polygon.length < 3) {
    return 0;
  }

  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = toRad(polygon[i].lng);
    const yi = toRad(polygon[i].lat);
    const xj = toRad(polygon[j].lng);
    const yj = toRad(polygon[j].lat);

    area += xi * yj - xj * yi;
  }

  area = Math.abs(area / 2) * EARTH_RADIUS_M * EARTH_RADIUS_M;
  return Math.round(area);
}

/**
 * 获取方向方位角
 * @param from 起点
 * @param to 终点
 * @returns 方位角（度，0-360，正北为0）
 */
export function getBearing(from: LatLng, to: LatLng): number {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const deltaLng = toRad(to.lng - from.lng);

  const x = Math.sin(deltaLng) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  let bearing = toDeg(Math.atan2(x, y));
  bearing = (bearing + 360) % 360;

  return Math.round(bearing * 10) / 10;
}

/**
 * 获取方向名称
 * @param bearing 方位角
 * @returns 方向名称
 */
export function getDirectionName(bearing: number): string {
  const directions = [
    { name: '北', min: 337.5, max: 360 },
    { name: '东北', min: 292.5, max: 337.5 },
    { name: '东', min: 247.5, max: 292.5 },
    { name: '东南', min: 202.5, max: 247.5 },
    { name: '南', min: 157.5, max: 202.5 },
    { name: '西南', min: 112.5, max: 157.5 },
    { name: '西', min: 67.5, max: 112.5 },
    { name: '西北', min: 0, max: 67.5 },
  ];

  for (const dir of directions) {
    if (bearing >= dir.min || bearing < dir.max) {
      return dir.name;
    }
  }

  return '北';
}

/**
 * 格式化距离为人类可读字符串
 */
export function formatDistance(distance: number, unit: DistanceUnit): string {
  switch (unit) {
    case 'km':
      if (distance < 1) {
        return `${Math.round(distance * 1000)}米`;
      }
      return `${distance.toFixed(2)}公里`;
    case 'm':
      return `${Math.round(distance)}米`;
    case 'mile':
      return `${distance.toFixed(2)}英里`;
    case 'nautical_mile':
      return `${distance.toFixed(2)}海里`;
    default:
      return `${distance} ${unit}`;
  }
}
