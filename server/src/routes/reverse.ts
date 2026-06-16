/**
 * 反向地理编码API
 * 根据经纬度返回行政区划信息
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { provinceCoordinates, cityCoordinates } from '../data/coordinates';

// 读取JSON数据文件
import regionsData from '../data/regions.json';

const { provinces, cities } = regionsData as any;

const router = Router();

/**
 * 根据经纬度查找最近的省份
 */
function findNearestProvince(lat: number, lng: number) {
  let nearest = null;
  let minDistance = Infinity;
  
  for (const [code, coords] of Object.entries(provinceCoordinates)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { code, ...coords };
    }
  }
  
  return { province: nearest, distance: minDistance };
}

/**
 * 根据经纬度和省份代码查找最近的城市
 */
function findNearestCity(lat: number, lng: number, provinceCode: string) {
  let nearest = null;
  let minDistance = Infinity;
  
  // 只在该省份的城市中查找
  const provinceCities = cities[provinceCode] || [];
  
  for (const city of provinceCities) {
    const coords = cityCoordinates[city.code];
    if (coords) {
      const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...city, ...coords };
      }
    }
  }
  
  return { city: nearest, distance: minDistance };
}

/**
 * Haversine公式计算两点间距离（公里）
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/v1/geo/reverse
 * 根据经纬度获取行政区划信息
 */
router.get('/reverse', (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数：lat 和 lng'
      });
    }
    
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: '经纬度参数格式错误'
      });
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: '经纬度超出有效范围'
      });
    }
    
    // 查找最近的省份
    const { province, distance: provinceDistance } = findNearestProvince(latitude, longitude);
    
    if (!province) {
      return res.status(404).json({
        success: false,
        message: '未找到匹配的行政区划'
      });
    }
    
    // 获取省份信息
    const provinceInfo = provinces.find(p => p.code === province.code);
    
    // 查找最近的城市
    const { city, distance: cityDistance } = findNearestCity(latitude, longitude, province.code);
    
    const result: any = {
      success: true,
      data: {
        coordinate: { lat: latitude, lng: longitude },
        province: {
          code: province.code,
          name: provinceInfo?.name || province.center,
          center: { lat: province.lat, lng: province.lng },
          distance: Math.round(provinceDistance)
        },
        nearestCity: city ? {
          code: city.code,
          name: city.name,
          center: { lat: city.lat, lng: city.lng },
          distance: Math.round(cityDistance)
        } : null
      }
    };
    
    return res.json(result);
  } catch (error) {
    console.error('反向地理编码错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;

export { createReverseRouter };
export { createReverseRouter };
