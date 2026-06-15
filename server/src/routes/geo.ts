/**
 * 距离计算API路由
 */
import { Router } from 'express';
import {
  calculateDistance,
  calculateTotalDistance,
  getBearing,
  getDirectionName,
  formatDistance,
  LatLng,
  DistanceUnit,
} from '../utils/geoUtils.js';

const router = Router();

/**
 * 验证经纬度格式
 */
function isValidLatLng(lat: any, lng: any): latLng is LatLng {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return (
    !isNaN(latNum) &&
    !isNaN(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180
  );
}

type latLng = LatLng;

/**
 * 两点间距离计算
 * GET /api/v1/geo/distance
 * 
 * Query参数:
 * - fromLat: 起点纬度
 * - fromLng: 起点经度
 * - toLat: 终点纬度
 * - toLng: 终点经度
 * - unit: 距离单位 (km/m/mile/nautical_mile)，默认km
 */
router.get('/distance', (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng, unit = 'km' } = req.query;

    // 验证必填参数
    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：fromLat, fromLng, toLat, toLng',
      });
    }

    // 验证经纬度格式
    if (!isValidLatLng(fromLat, fromLng)) {
      return res.status(400).json({
        code: 400,
        message: '起点经纬度格式错误或超出有效范围',
      });
    }

    if (!isValidLatLng(toLat, toLng)) {
      return res.status(400).json({
        code: 400,
        message: '终点经纬度格式错误或超出有效范围',
      });
    }

    // 验证单位
    const validUnits: DistanceUnit[] = ['km', 'm', 'mile', 'nautical_mile'];
    if (!validUnits.includes(unit as DistanceUnit)) {
      return res.status(400).json({
        code: 400,
        message: `无效的距离单位，可选值：${validUnits.join(', ')}`,
      });
    }

    const from: LatLng = {
      lat: parseFloat(fromLat as string),
      lng: parseFloat(fromLng as string),
    };
    const to: LatLng = {
      lat: parseFloat(toLat as string),
      lng: parseFloat(toLng as string),
    };

    const result = calculateDistance(from, to, unit as DistanceUnit);
    const bearing = getBearing(from, to);

    res.json({
      code: 200,
      message: 'success',
      data: {
        from: result.from,
        to: result.to,
        distance: result.distance,
        unit,
        humanReadable: formatDistance(result.distance, unit as DistanceUnit),
        details: {
          km: result.distanceKm,
          m: result.distanceM,
          mile: result.distanceMile,
        },
        bearing: {
          degrees: bearing,
          direction: getDirectionName(bearing),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '计算距离失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 批量距离计算
 * POST /api/v1/geo/distance/batch
 * 
 * Body参数:
 * - points: 点列表 [[lat, lng], [lat, lng], ...]
 * - unit: 距离单位 (km/m/mile/nautical_mile)，默认km
 */
router.post('/distance/batch', (req, res) => {
  try {
    const { points, unit = 'km' } = req.body;

    // 验证点列表
    if (!Array.isArray(points) || points.length < 2) {
      return res.status(400).json({
        code: 400,
        message: 'points必须是包含至少2个点的数组',
      });
    }

    // 验证单位
    const validUnits: DistanceUnit[] = ['km', 'm', 'mile', 'nautical_mile'];
    if (!validUnits.includes(unit)) {
      return res.status(400).json({
        code: 400,
        message: `无效的距离单位，可选值：${validUnits.join(', ')}`,
      });
    }

    // 解析点列表
    const latLngPoints: LatLng[] = [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (!Array.isArray(point) || point.length < 2) {
        return res.status(400).json({
          code: 400,
          message: `第${i + 1}个点格式错误，应为[lat, lng]`,
        });
      }
      if (!isValidLatLng(point[0], point[1])) {
        return res.status(400).json({
          code: 400,
          message: `第${i + 1}个点经纬度无效`,
        });
      }
      latLngPoints.push({
        lat: parseFloat(point[0]),
        lng: parseFloat(point[1]),
      });
    }

    // 计算每段距离
    const segments: Array<{
      from: LatLng;
      to: LatLng;
      distance: number;
      unit: DistanceUnit;
    }> = [];

    let totalDistance = 0;

    for (let i = 0; i < latLngPoints.length - 1; i++) {
      const result = calculateDistance(
        latLngPoints[i],
        latLngPoints[i + 1],
        unit as DistanceUnit
      );
      segments.push({
        from: result.from,
        to: result.to,
        distance: result.distance,
        unit: unit as DistanceUnit,
      });
      totalDistance += result.distance;
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        pointCount: latLngPoints.length,
        segmentCount: segments.length,
        totalDistance: Math.round(totalDistance * 1000) / 1000,
        unit,
        humanReadable: formatDistance(totalDistance, unit as DistanceUnit),
        segments,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '批量计算距离失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 方向/方位角计算
 * GET /api/v1/geo/bearing
 * 
 * Query参数:
 * - fromLat: 起点纬度
 * - fromLng: 起点经度
 * - toLat: 终点纬度
 * - toLng: 终点经度
 */
router.get('/bearing', (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    // 验证参数
    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：fromLat, fromLng, toLat, toLng',
      });
    }

    if (!isValidLatLng(fromLat, fromLng) || !isValidLatLng(toLat, toLng)) {
      return res.status(400).json({
        code: 400,
        message: '经纬度格式错误或超出有效范围',
      });
    }

    const from: LatLng = {
      lat: parseFloat(fromLat as string),
      lng: parseFloat(fromLng as string),
    };
    const to: LatLng = {
      lat: parseFloat(toLat as string),
      lng: parseFloat(toLng as string),
    };

    const bearing = getBearing(from, to);

    res.json({
      code: 200,
      message: 'success',
      data: {
        from,
        to,
        bearing: {
          degrees: bearing,
          direction: getDirectionName(bearing),
          description: `${getDirectionName(bearing)}方向 (${bearing}°)`,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '计算方位角失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 坐标格式转换
 * GET /api/v1/geo/convert
 * 
 * Query参数:
 * - lat: 纬度
 * - lng: 经度
 */
router.get('/convert', (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：lat, lng',
      });
    }

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);

    if (!isValidLatLng(lat, lng)) {
      return res.status(400).json({
        code: 400,
        message: '经纬度格式错误或超出有效范围',
      });
    }

    // 度分秒转换
    const latDMS = decimalToDMS(latNum, 'lat');
    const lngDMS = decimalToDMS(lngNum, 'lng');

    // GeoHash简化（取前6位）
    const geoHash = encodeGeoHash(latNum, lngNum);

    res.json({
      code: 200,
      message: 'success',
      data: {
        decimal: { lat: latNum, lng: lngNum },
        dms: {
          lat: latDMS,
          lng: lngDMS,
        },
        string: `${Math.abs(latNum)}°${latNum >= 0 ? 'N' : 'S'} ${Math.abs(lngNum)}°${lngNum >= 0 ? 'E' : 'W'}`,
        geohash: geoHash,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '坐标转换失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 十进制转度分秒
 */
function decimalToDMS(decimal: number, type: 'lat' | 'lng'): string {
  const direction = type === 'lat'
    ? (decimal >= 0 ? 'N' : 'S')
    : (decimal >= 0 ? 'E' : 'W');
  
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutesDecimal = (abs - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);
  
  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

/**
 * 简化的GeoHash编码（用于大致定位）
 */
function encodeGeoHash(lat: number, lng: number, precision = 6): string {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isLng = true;

  while (hash.length < precision) {
    if (isLng) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) {
        ch |= (1 << (4 - bit));
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    isLng = !isLng;
    bit++;

    if (bit === 5) {
      hash += base32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

export default router;
