/**
 * GeoJSON 边界数据路由
 */
import { Router } from 'express';
import { 
  getProvinceBoundary, 
  getAllProvinceBoundaries, 
  toGeoJSON,
  getGeoJSONFilePath,
  provinceBoundaries
} from '../data/geojson';

const router = Router();

// 获取所有省级边界数据
router.get('/provinces', (_req, res) => {
  const data = getAllProvinceBoundaries();
  res.json({
    success: true,
    data: {
      count: data.length,
      items: data,
    },
  });
});

// 获取指定省的边界数据
router.get('/provinces/:code', (req, res) => {
  const { code } = req.params;
  const boundary = getProvinceBoundary(code);
  
  if (!boundary) {
    return res.status(404).json({
      success: false,
      message: '未找到该省级行政区边界数据',
    });
  }
  
  res.json({
    success: true,
    data: boundary,
  });
});

// 获取GeoJSON格式数据
router.get('/geojson/provinces', (_req, res) => {
  const data = getAllProvinceBoundaries();
  const geojson = toGeoJSON(data);
  
  res.json({
    success: true,
    data: geojson,
  });
});

// 获取指定省的GeoJSON
router.get('/geojson/provinces/:code', (req, res) => {
  const { code } = req.params;
  const boundary = getProvinceBoundary(code);
  
  if (!boundary) {
    return res.status(404).json({
      success: false,
      message: '未找到该省级行政区边界数据',
    });
  }
  
  const geojson = toGeoJSON([boundary]);
  res.json({
    success: true,
    data: geojson,
  });
});

// 获取大规模GeoJSON文件路径（用于CDN加速的大文件）
router.get('/files/provinces/:code', (req, res) => {
  const { code } = req.params;
  
  if (!provinceBoundaries[code]) {
    return res.status(404).json({
      success: false,
      message: '未找到该省级行政区',
    });
  }
  
  res.json({
    success: true,
    data: {
      path: getGeoJSONFilePath(code, 'province'),
      note: '大规模GeoJSON文件需配合对象存储和CDN使用',
    },
  });
});

export default router;
