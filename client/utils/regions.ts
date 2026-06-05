// 中国行政区划数据
// 数据来源：国家统计局行政区划代码

export interface Region {
  code: string;      // 行政区划代码
  name: string;      // 名称
  level: number;     // 级别: 1=省, 2=市, 3=区/县, 4=镇/街道
  parentCode?: string; // 父级代码
}

// 省份数据（示例数据，可根据需要扩展完整数据）
export const provinces: Region[] = [
  { code: '11', name: '北京市', level: 1 },
  { code: '12', name: '天津市', level: 1 },
  { code: '13', name: '河北省', level: 1 },
  { code: '14', name: '山西省', level: 1 },
  { code: '15', name: '内蒙古自治区', level: 1 },
  { code: '21', name: '辽宁省', level: 1 },
  { code: '22', name: '吉林省', level: 1 },
  { code: '23', name: '黑龙江省', level: 1 },
  { code: '31', name: '上海市', level: 1 },
  { code: '32', name: '江苏省', level: 1 },
  { code: '33', name: '浙江省', level: 1 },
  { code: '34', name: '安徽省', level: 1 },
  { code: '35', name: '福建省', level: 1 },
  { code: '36', name: '江西省', level: 1 },
  { code: '37', name: '山东省', level: 1 },
  { code: '41', name: '河南省', level: 1 },
  { code: '42', name: '湖北省', level: 1 },
  { code: '43', name: '湖南省', level: 1 },
  { code: '44', name: '广东省', level: 1 },
  { code: '45', name: '广西壮族自治区', level: 1 },
  { code: '46', name: '海南省', level: 1 },
  { code: '50', name: '重庆市', level: 1 },
  { code: '51', name: '四川省', level: 1 },
  { code: '52', name: '贵州省', level: 1 },
  { code: '53', name: '云南省', level: 1 },
  { code: '54', name: '西藏自治区', level: 1 },
  { code: '61', name: '陕西省', level: 1 },
  { code: '62', name: '甘肃省', level: 1 },
  { code: '63', name: '青海省', level: 1 },
  { code: '64', name: '宁夏回族自治区', level: 1 },
  { code: '65', name: '新疆维吾尔自治区', level: 1 },
  { code: '71', name: '台湾省', level: 1 },
  { code: '81', name: '香港特别行政区', level: 1 },
  { code: '82', name: '澳门特别行政区', level: 1 },
];

// 市级数据示例（需要时可扩展）
export const cities: Region[] = [
  // 北京市
  { code: '1101', name: '市辖区', level: 2, parentCode: '11' },
  // 广东省
  { code: '4401', name: '广州市', level: 2, parentCode: '44' },
  { code: '4402', name: '深圳市', level: 2, parentCode: '44' },
  { code: '4403', name: '珠海市', level: 2, parentCode: '44' },
  { code: '4404', name: '汕头市', level: 2, parentCode: '44' },
  { code: '4405', name: '佛山市', level: 2, parentCode: '44' },
  { code: '4406', name: '韶关市', level: 2, parentCode: '44' },
  { code: '4407', name: '湛江市', level: 2, parentCode: '44' },
  { code: '4408', name: '肇庆市', level: 2, parentCode: '44' },
  { code: '4409', name: '江门市', level: 2, parentCode: '44' },
  { code: '4412', name: '惠州市', level: 2, parentCode: '44' },
  { code: '4413', name: '梅州市', level: 2, parentCode: '44' },
  { code: '4414', name: '汕尾市', level: 2, parentCode: '44' },
  { code: '4415', name: '河源市', level: 2, parentCode: '44' },
  { code: '4416', name: '阳江市', level: 2, parentCode: '44' },
  { code: '4417', name: '清远市', level: 2, parentCode: '44' },
  { code: '4418', name: '东莞市', level: 2, parentCode: '44' },
  { code: '4419', name: '中山市', level: 2, parentCode: '44' },
  { code: '4420', name: '潮州市', level: 2, parentCode: '44' },
  { code: '4421', name: '揭阳市', level: 2, parentCode: '44' },
  { code: '4422', name: '云浮市', level: 2, parentCode: '44' },
  // 浙江省
  { code: '3301', name: '杭州市', level: 2, parentCode: '33' },
  { code: '3302', name: '宁波市', level: 2, parentCode: '33' },
  { code: '3303', name: '温州市', level: 2, parentCode: '33' },
  { code: '3304', name: '嘉兴市', level: 2, parentCode: '33' },
  { code: '3305', name: '湖州市', level: 2, parentCode: '33' },
  { code: '3306', name: '绍兴市', level: 2, parentCode: '33' },
  { code: '3307', name: '金华市', level: 2, parentCode: '33' },
  { code: '3308', name: '衢州市', level: 2, parentCode: '33' },
  { code: '3309', name: '舟山市', level: 2, parentCode: '33' },
  { code: '3310', name: '台州市', level: 2, parentCode: '33' },
  { code: '3311', name: '丽水市', level: 2, parentCode: '33' },
  // 江苏省
  { code: '3201', name: '南京市', level: 2, parentCode: '32' },
  { code: '3202', name: '无锡市', level: 2, parentCode: '32' },
  { code: '3203', name: '徐州市', level: 2, parentCode: '32' },
  { code: '3204', name: '常州市', level: 2, parentCode: '32' },
  { code: '3205', name: '苏州市', level: 2, parentCode: '32' },
  { code: '3206', name: '南通市', level: 2, parentCode: '32' },
  { code: '3207', name: '连云港市', level: 2, parentCode: '32' },
  { code: '3208', name: '淮安市', level: 2, parentCode: '32' },
  { code: '3209', name: '盐城市', level: 2, parentCode: '32' },
  { code: '3210', name: '扬州市', level: 2, parentCode: '32' },
  { code: '3211', name: '镇江市', level: 2, parentCode: '32' },
  { code: '3212', name: '泰州市', level: 2, parentCode: '32' },
  { code: '3213', name: '宿迁市', level: 2, parentCode: '32' },
  // 上海市
  { code: '3101', name: '市辖区', level: 2, parentCode: '31' },
  // 四川省
  { code: '5101', name: '成都市', level: 2, parentCode: '51' },
  { code: '5103', name: '自贡市', level: 2, parentCode: '51' },
  { code: '5104', name: '攀枝花市', level: 2, parentCode: '51' },
  { code: '5105', name: '泸州市', level: 2, parentCode: '51' },
  { code: '5106', name: '德阳市', level: 2, parentCode: '51' },
  { code: '5107', name: '绵阳市', level: 2, parentCode: '51' },
  { code: '5108', name: '广元市', level: 2, parentCode: '51' },
  { code: '5109', name: '遂宁市', level: 2, parentCode: '51' },
  { code: '5110', name: '内江市', level: 2, parentCode: '51' },
  { code: '5111', name: '乐山市', level: 2, parentCode: '51' },
  { code: '5113', name: '南充市', level: 2, parentCode: '51' },
  { code: '5114', name: '眉山市', level: 2, parentCode: '51' },
  { code: '5115', name: '宜宾市', level: 2, parentCode: '51' },
  { code: '5116', name: '广安市', level: 2, parentCode: '51' },
  { code: '5117', name: '达州市', level: 2, parentCode: '51' },
  { code: '5118', name: '雅安市', level: 2, parentCode: '51' },
  { code: '5119', name: '巴中市', level: 2, parentCode: '51' },
  { code: '5120', name: '资阳市', level: 2, parentCode: '51' },
];

// 区县级数据示例
export const districts: Region[] = [
  // 广州市
  { code: '440103', name: '荔湾区', level: 3, parentCode: '4401' },
  { code: '440104', name: '越秀区', level: 3, parentCode: '4401' },
  { code: '440105', name: '海珠区', level: 3, parentCode: '4401' },
  { code: '440106', name: '天河区', level: 3, parentCode: '4401' },
  { code: '440111', name: '白云区', level: 3, parentCode: '4401' },
  { code: '440112', name: '黄埔区', level: 3, parentCode: '4401' },
  { code: '440113', name: '番禺区', level: 3, parentCode: '4401' },
  { code: '440114', name: '花都区', level: 3, parentCode: '4401' },
  { code: '440115', name: '南沙区', level: 3, parentCode: '4401' },
  { code: '440117', name: '从化区', level: 3, parentCode: '4401' },
  { code: '440118', name: '增城区', level: 3, parentCode: '4401' },
  // 深圳市
  { code: '440303', name: '罗湖区', level: 3, parentCode: '4403' },
  { code: '440304', name: '福田区', level: 3, parentCode: '4403' },
  { code: '440305', name: '南山区', level: 3, parentCode: '4403' },
  { code: '440306', name: '宝安区', level: 3, parentCode: '4403' },
  { code: '440307', name: '龙岗区', level: 3, parentCode: '4403' },
  { code: '440308', name: '盐田区', level: 3, parentCode: '4403' },
  { code: '440309', name: '龙华区', level: 3, parentCode: '4403' },
  { code: '440310', name: '坪山区', level: 3, parentCode: '4403' },
  // 杭州市
  { code: '330102', name: '上城区', level: 3, parentCode: '3301' },
  { code: '330105', name: '拱墅区', level: 3, parentCode: '3301' },
  { code: '330106', name: '西湖区', level: 3, parentCode: '3301' },
  { code: '330108', name: '滨江区', level: 3, parentCode: '3301' },
  { code: '330109', name: '萧山区', level: 3, parentCode: '3301' },
  { code: '330110', name: '余杭区', level: 3, parentCode: '3301' },
  { code: '330111', name: '富阳区', level: 3, parentCode: '3301' },
  { code: '330112', name: '临安区', level: 3, parentCode: '3301' },
  { code: '330113', name: '临平区', level: 3, parentCode: '3301' },
  { code: '330114', name: '钱塘区', level: 3, parentCode: '3301' },
  // 成都市
  { code: '510104', name: '锦江区', level: 3, parentCode: '5101' },
  { code: '510105', name: '青羊区', level: 3, parentCode: '5101' },
  { code: '510106', name: '金牛区', level: 3, parentCode: '5101' },
  { code: '510107', name: '武侯区', level: 3, parentCode: '5101' },
  { code: '510108', name: '成华区', level: 3, parentCode: '5101' },
  { code: '510112', name: '龙泉驿区', level: 3, parentCode: '5101' },
  { code: '510113', name: '青白江区', level: 3, parentCode: '5101' },
  { code: '510114', name: '新都区', level: 3, parentCode: '5101' },
  { code: '510115', name: '温江区', level: 3, parentCode: '5101' },
  { code: '510116', name: '双流区', level: 3, parentCode: '5101' },
  { code: '510117', name: '郫都区', level: 3, parentCode: '5101' },
];

// 镇/街道数据示例
export const towns: Region[] = [
  // 天河区
  { code: '440106001', name: '沙河街道', level: 4, parentCode: '440106' },
  { code: '440106002', name: '五山街道', level: 4, parentCode: '440106' },
  { code: '440106003', name: '员村街道', level: 4, parentCode: '440106' },
  { code: '440106004', name: '车陂街道', level: 4, parentCode: '440106' },
  { code: '440106005', name: '石牌街道', level: 4, parentCode: '440106' },
  { code: '440106006', name: '天河南街道', level: 4, parentCode: '440106' },
  { code: '440106007', name: '林和街道', level: 4, parentCode: '440106' },
  { code: '440106008', name: '沙东街道', level: 4, parentCode: '440106' },
  { code: '440106009', name: '兴华街道', level: 4, parentCode: '440106' },
  { code: '440106010', name: '棠下街道', level: 4, parentCode: '440106' },
  // 萧山区
  { code: '330109001', name: '城厢街道', level: 4, parentCode: '330109' },
  { code: '330109002', name: '北干街道', level: 4, parentCode: '330109' },
  { code: '330109003', name: '蜀山街道', level: 4, parentCode: '330109' },
  { code: '330109004', name: '新塘街道', level: 4, parentCode: '330109' },
  { code: '330109005', name: '靖江街道', level: 4, parentCode: '330109' },
  { code: '330109006', name: '南阳街道', level: 4, parentCode: '330109' },
  { code: '330109007', name: '义蓬街道', level: 4, parentCode: '330109' },
  { code: '330109008', name: '河庄街道', level: 4, parentCode: '330109' },
  { code: '330109009', name: '下沙街道', level: 4, parentCode: '330109' },
  { code: '330109010', name: '白杨街道', level: 4, parentCode: '330109' },
  // 武侯区
  { code: '510107001', name: '玉林街道', level: 4, parentCode: '510107' },
  { code: '510107002', name: '跳伞塔街道', level: 4, parentCode: '510107' },
  { code: '510107003', name: '望江路街道', level: 4, parentCode: '510107' },
  { code: '510107004', name: '火车南站街道', level: 4, parentCode: '510107' },
  { code: '510107005', name: '双楠街道', level: 4, parentCode: '510107' },
  { code: '510107006', name: '红牌楼街道', level: 4, parentCode: '510107' },
  { code: '510107007', name: '簇锦街道', level: 4, parentCode: '510107' },
  { code: '510107008', name: '华兴街道', level: 4, parentCode: '510107' },
  { code: '510107009', name: '簇桥街道', level: 4, parentCode: '510107' },
  { code: '510107010', name: '金花桥街道', level: 4, parentCode: '510107' },
];

// 合并所有区域数据
export const allRegions = [...provinces, ...cities, ...districts, ...towns];

// 根据代码获取区域名称
export function getRegionName(code: string): string {
  const region = allRegions.find(r => r.code === code);
  return region?.name || code;
}

// 根据代码获取区域层级
export function getRegionLevel(code: string): number {
  const region = allRegions.find(r => r.code === code);
  return region?.level || 1;
}

// 获取子级区域
export function getChildRegions(parentCode: string): Region[] {
  return allRegions.filter(r => r.parentCode === parentCode);
}

// 根据code获取完整区域路径
export function getRegionPath(code: string): string {
  const path: string[] = [];
  let current = allRegions.find(r => r.code === code);
  
  while (current) {
    path.unshift(current.name);
    if (current.parentCode) {
      current = allRegions.find(r => r.code === current!.parentCode);
    } else {
      break;
    }
  }
  
  return path.join(' / ');
}

// 会员等级可访问的区域层级
export const memberLevelRegions = [
  { level: 0, name: '江湖散人', maxLevel: 1, description: '镇级区域' },
  { level: 1, name: '县帮帮主', maxLevel: 2, description: '镇 + 县' },
  { level: 2, name: '市盟盟主', maxLevel: 3, description: '镇 + 县 + 市' },
  { level: 3, name: '省派掌门', maxLevel: 4, description: '镇 + 县 + 市 + 省' },
  { level: 4, name: '天下会主', maxLevel: 99, description: '全部区域' },
];
