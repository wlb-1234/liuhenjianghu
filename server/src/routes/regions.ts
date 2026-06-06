import { Router, Request, Response } from 'express';
import { getPool } from '../config/database';

const router = Router();

// 行政区划数据（内置数据，支持离线使用）
const regionsData = {
  provinces: [
    { code: '11', name: '北京市' },
    { code: '12', name: '天津市' },
    { code: '13', name: '河北省' },
    { code: '14', name: '山西省' },
    { code: '15', name: '内蒙古自治区' },
    { code: '21', name: '辽宁省' },
    { code: '22', name: '吉林省' },
    { code: '23', name: '黑龙江省' },
    { code: '31', name: '上海市' },
    { code: '32', name: '江苏省' },
    { code: '33', name: '浙江省' },
    { code: '34', name: '安徽省' },
    { code: '35', name: '福建省' },
    { code: '36', name: '江西省' },
    { code: '37', name: '山东省' },
    { code: '41', name: '河南省' },
    { code: '42', name: '湖北省' },
    { code: '43', name: '湖南省' },
    { code: '44', name: '广东省' },
    { code: '45', name: '广西壮族自治区' },
    { code: '46', name: '海南省' },
    { code: '50', name: '重庆市' },
    { code: '51', name: '四川省' },
    { code: '52', name: '贵州省' },
    { code: '53', name: '云南省' },
    { code: '54', name: '西藏自治区' },
    { code: '61', name: '陕西省' },
    { code: '62', name: '甘肃省' },
    { code: '63', name: '青海省' },
    { code: '64', name: '宁夏回族自治区' },
    { code: '65', name: '新疆维吾尔自治区' },
  ],
  cities: [
    // 广东省
    { code: '4401', name: '广州市', parentCode: '44' },
    { code: '4402', name: '深圳市', parentCode: '44' },
    { code: '4403', name: '珠海市', parentCode: '44' },
    { code: '4404', name: '汕头市', parentCode: '44' },
    { code: '4405', name: '佛山市', parentCode: '44' },
    { code: '4406', name: '韶关市', parentCode: '44' },
    { code: '4407', name: '湛江市', parentCode: '44' },
    { code: '4408', name: '肇庆市', parentCode: '44' },
    { code: '4409', name: '江门市', parentCode: '44' },
    { code: '4412', name: '惠州市', parentCode: '44' },
    { code: '4413', name: '梅州市', parentCode: '44' },
    { code: '4414', name: '汕尾市', parentCode: '44' },
    { code: '4415', name: '河源市', parentCode: '44' },
    { code: '4416', name: '阳江市', parentCode: '44' },
    { code: '4417', name: '清远市', parentCode: '44' },
    { code: '4418', name: '东莞市', parentCode: '44' },
    { code: '4419', name: '中山市', parentCode: '44' },
    { code: '4420', name: '潮州市', parentCode: '44' },
    { code: '4421', name: '揭阳市', parentCode: '44' },
    { code: '4422', name: '云浮市', parentCode: '44' },
    // 浙江省
    { code: '3301', name: '杭州市', parentCode: '33' },
    { code: '3302', name: '宁波市', parentCode: '33' },
    { code: '3303', name: '温州市', parentCode: '33' },
    { code: '3304', name: '嘉兴市', parentCode: '33' },
    { code: '3305', name: '湖州市', parentCode: '33' },
    { code: '3306', name: '绍兴市', parentCode: '33' },
    { code: '3307', name: '金华市', parentCode: '33' },
    { code: '3308', name: '衢州市', parentCode: '33' },
    { code: '3309', name: '舟山市', parentCode: '33' },
    { code: '3310', name: '台州市', parentCode: '33' },
    { code: '3311', name: '丽水市', parentCode: '33' },
    // 江苏省
    { code: '3201', name: '南京市', parentCode: '32' },
    { code: '3202', name: '无锡市', parentCode: '32' },
    { code: '3203', name: '徐州市', parentCode: '32' },
    { code: '3204', name: '常州市', parentCode: '32' },
    { code: '3205', name: '苏州市', parentCode: '32' },
    { code: '3206', name: '南通市', parentCode: '32' },
    { code: '3207', name: '连云港市', parentCode: '32' },
    { code: '3208', name: '淮安市', parentCode: '32' },
    { code: '3209', name: '盐城市', parentCode: '32' },
    { code: '3210', name: '扬州市', parentCode: '32' },
    { code: '3211', name: '镇江市', parentCode: '32' },
    { code: '3212', name: '泰州市', parentCode: '32' },
    { code: '3213', name: '宿迁市', parentCode: '32' },
    // 上海市
    { code: '3101', name: '上海市辖区', parentCode: '31' },
    // 四川省
    { code: '5101', name: '成都市', parentCode: '51' },
    { code: '5103', name: '自贡市', parentCode: '51' },
    { code: '5104', name: '攀枝花市', parentCode: '51' },
    { code: '5105', name: '泸州市', parentCode: '51' },
    { code: '5106', name: '德阳市', parentCode: '51' },
    { code: '5107', name: '绵阳市', parentCode: '51' },
    { code: '5108', name: '广元市', parentCode: '51' },
    { code: '5109', name: '遂宁市', parentCode: '51' },
    { code: '5110', name: '内江市', parentCode: '51' },
    { code: '5111', name: '乐山市', parentCode: '51' },
    { code: '5113', name: '南充市', parentCode: '51' },
    { code: '5114', name: '眉山市', parentCode: '51' },
    { code: '5115', name: '宜宾市', parentCode: '51' },
    { code: '5116', name: '广安市', parentCode: '51' },
    { code: '5117', name: '达州市', parentCode: '51' },
    { code: '5118', name: '雅安市', parentCode: '51' },
    { code: '5119', name: '巴中市', parentCode: '51' },
    { code: '5120', name: '资阳市', parentCode: '51' },
  ],
  districts: [
    // 广州市
    { code: '440103', name: '荔湾区', parentCode: '4401' },
    { code: '440104', name: '越秀区', parentCode: '4401' },
    { code: '440105', name: '海珠区', parentCode: '4401' },
    { code: '440106', name: '天河区', parentCode: '4401' },
    { code: '440111', name: '白云区', parentCode: '4401' },
    { code: '440112', name: '黄埔区', parentCode: '4401' },
    { code: '440113', name: '番禺区', parentCode: '4401' },
    { code: '440114', name: '花都区', parentCode: '4401' },
    { code: '440115', name: '南沙区', parentCode: '4401' },
    { code: '440117', name: '从化区', parentCode: '4401' },
    { code: '440118', name: '增城区', parentCode: '4401' },
    // 深圳市
    { code: '440303', name: '罗湖区', parentCode: '4403' },
    { code: '440304', name: '福田区', parentCode: '4403' },
    { code: '440305', name: '南山区', parentCode: '4403' },
    { code: '440306', name: '宝安区', parentCode: '4403' },
    { code: '440307', name: '龙岗区', parentCode: '4403' },
    { code: '440308', name: '盐田区', parentCode: '4403' },
    { code: '440309', name: '龙华区', parentCode: '4403' },
    { code: '440310', name: '坪山区', parentCode: '4403' },
    // 杭州市
    { code: '330102', name: '上城区', parentCode: '3301' },
    { code: '330105', name: '拱墅区', parentCode: '3301' },
    { code: '330106', name: '西湖区', parentCode: '3301' },
    { code: '330108', name: '滨江区', parentCode: '3301' },
    { code: '330109', name: '萧山区', parentCode: '3301' },
    { code: '330110', name: '余杭区', parentCode: '3301' },
    { code: '330111', name: '富阳区', parentCode: '3301' },
    { code: '330112', name: '临安区', parentCode: '3301' },
    { code: '330113', name: '临平区', parentCode: '3301' },
    { code: '330114', name: '钱塘区', parentCode: '3301' },
    // 成都市
    { code: '510104', name: '锦江区', parentCode: '5101' },
    { code: '510105', name: '青羊区', parentCode: '5101' },
    { code: '510106', name: '金牛区', parentCode: '5101' },
    { code: '510107', name: '武侯区', parentCode: '5101' },
    { code: '510108', name: '成华区', parentCode: '5101' },
    { code: '510112', name: '龙泉驿区', parentCode: '5101' },
    { code: '510113', name: '青白江区', parentCode: '5101' },
    { code: '510114', name: '新都区', parentCode: '5101' },
    { code: '510115', name: '温江区', parentCode: '5101' },
    { code: '510116', name: '双流区', parentCode: '5101' },
    { code: '510117', name: '郫都区', parentCode: '5101' },
  ],
  towns: [
    // 天河区
    { code: '440106001', name: '沙河街道', parentCode: '440106' },
    { code: '440106002', name: '五山街道', parentCode: '440106' },
    { code: '440106003', name: '员村街道', parentCode: '440106' },
    { code: '440106004', name: '车陂街道', parentCode: '440106' },
    { code: '440106005', name: '石牌街道', parentCode: '440106' },
    { code: '440106006', name: '天河南街道', parentCode: '440106' },
    { code: '440106007', name: '林和街道', parentCode: '440106' },
    { code: '440106008', name: '沙东街道', parentCode: '440106' },
    { code: '440106009', name: '兴华街道', parentCode: '440106' },
    { code: '440106010', name: '棠下街道', parentCode: '440106' },
    // 萧山区
    { code: '330109001', name: '城厢街道', parentCode: '330109' },
    { code: '330109002', name: '北干街道', parentCode: '330109' },
    { code: '330109003', name: '蜀山街道', parentCode: '330109' },
    { code: '330109004', name: '新塘街道', parentCode: '330109' },
    { code: '330109005', name: '靖江街道', parentCode: '330109' },
    { code: '330109006', name: '南阳街道', parentCode: '330109' },
    { code: '330109007', name: '义蓬街道', parentCode: '330109' },
    { code: '330109008', name: '河庄街道', parentCode: '330109' },
    { code: '330109009', name: '下沙街道', parentCode: '330109' },
    { code: '330109010', name: '白杨街道', parentCode: '330109' },
    // 武侯区
    { code: '510107001', name: '玉林街道', parentCode: '510107' },
    { code: '510107002', name: '跳伞塔街道', parentCode: '510107' },
    { code: '510107003', name: '望江路街道', parentCode: '510107' },
    { code: '510107004', name: '火车南站街道', parentCode: '510107' },
    { code: '510107005', name: '双楠街道', parentCode: '510107' },
    { code: '510107006', name: '红牌楼街道', parentCode: '510107' },
    { code: '510107007', name: '簇锦街道', parentCode: '510107' },
    { code: '510107008', name: '华兴街道', parentCode: '510107' },
    { code: '510107009', name: '簇桥街道', parentCode: '510107' },
    { code: '510107010', name: '金花桥街道', parentCode: '510107' },
  ]
};

// 获取省份列表
router.get('/provinces', async (req: Request, res: Response) => {
  try {
    res.json({ data: regionsData.provinces });
  } catch (error) {
    console.error('获取省份失败:', error);
    res.status(500).json({ error: '获取省份失败' });
  }
});

// 获取城市列表
router.get('/cities/:provinceCode', async (req: Request, res: Response) => {
  try {
    const { provinceCode } = req.params;
    const cities = regionsData.cities.filter(c => c.parentCode === provinceCode);
    res.json({ data: cities });
  } catch (error) {
    console.error('获取城市失败:', error);
    res.status(500).json({ error: '获取城市失败' });
  }
});

// 获取区县列表
router.get('/districts/:cityCode', async (req: Request, res: Response) => {
  try {
    const { cityCode } = req.params;
    const districts = regionsData.districts.filter(d => d.parentCode === cityCode);
    res.json({ data: districts });
  } catch (error) {
    console.error('获取区县失败:', error);
    res.status(500).json({ error: '获取区县失败' });
  }
});

// 获取乡镇列表
router.get('/towns/:districtCode', async (req: Request, res: Response) => {
  try {
    const { districtCode } = req.params;
    const towns = regionsData.towns.filter(t => t.parentCode === districtCode);
    res.json({ data: towns });
  } catch (error) {
    console.error('获取乡镇失败:', error);
    res.status(500).json({ error: '获取乡镇失败' });
  }
});

// 获取区域信息
router.get('/info/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    let region = null;
    let level = 0;
    
    // 查找区域
    if (regionsData.provinces.find(p => p.code === code)) {
      region = regionsData.provinces.find(p => p.code === code);
      level = 1;
    } else if (regionsData.cities.find(c => c.code === code)) {
      region = regionsData.cities.find(c => c.code === code);
      level = 2;
    } else if (regionsData.districts.find(d => d.code === code)) {
      region = regionsData.districts.find(d => d.code === code);
      level = 3;
    } else if (regionsData.towns.find(t => t.code === code)) {
      region = regionsData.towns.find(t => t.code === code);
      level = 4;
    }
    
    if (!region) {
      return res.status(404).json({ error: '区域不存在' });
    }
    
    // 构建路径
    const path: any[] = [region];
    let parentCode = (region as any).parentCode;
    
    while (parentCode) {
      let parent = null;
      if (regionsData.cities.find(c => c.code === parentCode)) {
        parent = regionsData.cities.find(c => c.code === parentCode);
      } else if (regionsData.districts.find(d => d.code === parentCode)) {
        parent = regionsData.districts.find(d => d.code === parentCode);
      } else if (regionsData.provinces.find(p => p.code === parentCode)) {
        parent = regionsData.provinces.find(p => p.code === parentCode);
      }
      
      if (parent) {
        path.unshift(parent);
        parentCode = (parent as any).parentCode;
      } else {
        break;
      }
    }
    
    res.json({ data: { region, level, path } });
  } catch (error) {
    console.error('获取区域信息失败:', error);
    res.status(500).json({ error: '获取区域信息失败' });
  }
});

// 兼容旧接口
router.get('/', async (req: Request, res: Response) => {
  res.json({ regions: regionsData.provinces });
});

router.get('/:parentId/children', async (req: Request, res: Response) => {
  const { parentId } = req.params;
  const children = [
    ...regionsData.cities.filter(c => c.parentCode === parentId),
    ...regionsData.districts.filter(d => d.parentCode === parentId),
    ...regionsData.towns.filter(t => t.parentCode === parentId),
  ];
  res.json({ regions: children });
});

export default router;
