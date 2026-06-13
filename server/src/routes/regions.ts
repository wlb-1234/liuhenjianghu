import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// 加载JSON数据 - 使用相对于项目根目录的路径
const dataPath = path.join(process.cwd(), 'src', 'data', 'regions.json');
let regionData: any = { provinces: [], cities: {}, districts: {}, streets: {} };

try {
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  regionData = JSON.parse(rawData);
  console.log('[Regions] Loaded region data from:', dataPath);
  console.log('[Regions] Cities count:', Object.keys(regionData.cities).length);
} catch (err) {
  console.error('[Regions] Failed to load region data:', err);
}

// 获取省份列表
router.get('/provinces', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: regionData.provinces
  });
});

// 获取城市列表
router.get('/cities/:provinceCode', (req, res) => {
  const { provinceCode } = req.params;
  const cities = regionData.cities[provinceCode] || [];
  res.json({
    code: 0,
    message: 'success',
    data: cities
  });
});

// 获取区县列表
router.get('/districts/:cityCode', (req, res) => {
  const { cityCode } = req.params;
  const districts = regionData.districts[cityCode] || [];
  res.json({
    code: 0,
    message: 'success',
    data: districts
  });
});

// 获取街道列表
router.get('/streets/:districtCode', (req, res) => {
  const { districtCode } = req.params;
  const streets = regionData.streets[districtCode] || [];
  res.json({
    code: 0,
    message: 'success',
    data: streets
  });
});

export default router;
