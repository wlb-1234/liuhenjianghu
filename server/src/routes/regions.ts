import { Router } from 'express';
import { query } from '../storage/database';

const router = Router();

// 内置完整行政区划数据（作为备用）
const PROVINCES = [
  { code: '11', name: '北京市' }, { code: '12', name: '天津市' }, { code: '13', name: '河北省' },
  { code: '14', name: '山西省' }, { code: '15', name: '内蒙古自治区' }, { code: '21', name: '辽宁省' },
  { code: '22', name: '吉林省' }, { code: '23', name: '黑龙江省' }, { code: '31', name: '上海市' },
  { code: '32', name: '江苏省' }, { code: '33', name: '浙江省' }, { code: '34', name: '安徽省' },
  { code: '35', name: '福建省' }, { code: '36', name: '江西省' }, { code: '37', name: '山东省' },
  { code: '41', name: '河南省' }, { code: '42', name: '湖北省' }, { code: '43', name: '湖南省' },
  { code: '44', name: '广东省' }, { code: '45', name: '广西壮族自治区' }, { code: '46', name: '海南省' },
  { code: '50', name: '重庆市' }, { code: '51', name: '四川省' }, { code: '52', name: '贵州省' },
  { code: '53', name: '云南省' }, { code: '54', name: '西藏自治区' }, { code: '61', name: '陕西省' },
  { code: '62', name: '甘肃省' }, { code: '63', name: '青海省' }, { code: '64', name: '宁夏回族自治区' },
  { code: '65', name: '新疆维吾尔自治区' }, { code: '71', name: '台湾省' }, { code: '81', name: '香港特别行政区' },
  { code: '82', name: '澳门特别行政区' }
];

// 获取所有省份
router.get('/provinces', async (req, res) => {
  try {
    const dbResult = await query('SELECT code, name FROM administrative_divisions WHERE level = 1 ORDER BY code');
    if (dbResult.rows.length > 0) {
      res.json(dbResult.rows);
    } else {
      res.json(PROVINCES);
    }
  } catch (error) {
    res.json(PROVINCES);
  }
});

// 获取城市
router.get('/cities/:provinceCode', async (req, res) => {
  const { provinceCode } = req.params;
  try {
    const dbResult = await query(
      'SELECT code, name FROM administrative_divisions WHERE level = 2 AND (parent_code = $1 OR province_code = $1) ORDER BY code',
      [provinceCode]
    );
    if (dbResult.rows.length > 0) {
      res.json(dbResult.rows);
    } else {
      res.json(getCitiesFromBuiltin(provinceCode));
    }
  } catch (error) {
    res.json(getCitiesFromBuiltin(provinceCode));
  }
});

// 获取区县
router.get('/districts/:cityCode', async (req, res) => {
  const { cityCode } = req.params;
  try {
    const dbResult = await query(
      'SELECT code, name FROM administrative_divisions WHERE level = 3 AND parent_code = $1 ORDER BY code',
      [cityCode]
    );
    if (dbResult.rows.length > 0) {
      res.json(dbResult.rows);
    } else {
      res.json(getDistrictsFromBuiltin(cityCode));
    }
  } catch (error) {
    res.json(getDistrictsFromBuiltin(cityCode));
  }
});

// 获取街道/乡镇
router.get('/streets/:districtCode', async (req, res) => {
  const { districtCode } = req.params;
  try {
    const dbResult = await query(
      'SELECT code, name FROM administrative_divisions WHERE level = 4 AND parent_code = $1 ORDER BY code',
      [districtCode]
    );
    res.json(dbResult.rows.length > 0 ? dbResult.rows : []);
  } catch (error) {
    res.json([]);
  }
});

// 内置城市数据
function getCitiesFromBuiltin(provinceCode) {
  const cities = {
    '13': [
      { code: '1301', name: '石家庄市' }, { code: '1302', name: '唐山市' }, { code: '1303', name: '秦皇岛市' },
      { code: '1304', name: '邯郸市' }, { code: '1305', name: '邢台市' }, { code: '1306', name: '保定市' },
      { code: '1307', name: '张家口市' }, { code: '1308', name: '承德市' }, { code: '1309', name: '沧州市' },
      { code: '1310', name: '廊坊市' }, { code: '1311', name: '衡水市' }
    ],
    '44': [
      { code: '4401', name: '广州市' }, { code: '4402', name: '珠海市' }, { code: '4403', name: '深圳市' },
      { code: '4404', name: '汕头市' }, { code: '4405', name: '佛山市' }, { code: '4406', name: '韶关市' },
      { code: '4407', name: '湛江市' }, { code: '4408', name: '肇庆市' }, { code: '4409', name: '江门市' },
      { code: '4412', name: '惠州市' }, { code: '4413', name: '梅州市' }, { code: '4414', name: '汕尾市' },
      { code: '4415', name: '河源市' }, { code: '4416', name: '阳江市' }, { code: '4417', name: '清远市' },
      { code: '4418', name: '东莞市' }, { code: '4419', name: '中山市' }, { code: '4420', name: '潮州市' },
      { code: '4421', name: '揭阳市' }, { code: '4422', name: '云浮市' }
    ],
    '33': [
      { code: '3301', name: '杭州市' }, { code: '3302', name: '宁波市' }, { code: '3303', name: '温州市' },
      { code: '3304', name: '嘉兴市' }, { code: '3305', name: '湖州市' }, { code: '3306', name: '绍兴市' },
      { code: '3307', name: '金华市' }, { code: '3308', name: '衢州市' }, { code: '3309', name: '舟山市' },
      { code: '3310', name: '台州市' }, { code: '3311', name: '丽水市' }
    ],
    '32': [
      { code: '3201', name: '南京市' }, { code: '3202', name: '无锡市' }, { code: '3203', name: '徐州市' },
      { code: '3204', name: '常州市' }, { code: '3205', name: '苏州市' }, { code: '3206', name: '南通市' },
      { code: '3207', name: '连云港市' }, { code: '3208', name: '淮安市' }, { code: '3209', name: '盐城市' },
      { code: '3210', name: '扬州市' }, { code: '3211', name: '镇江市' }, { code: '3212', name: '泰州市' },
      { code: '3213', name: '宿迁市' }
    ],
    '51': [
      { code: '5101', name: '成都市' }, { code: '5102', name: '自贡市' }, { code: '5103', name: '攀枝花市' },
      { code: '5104', name: '泸州市' }, { code: '5105', name: '德阳市' }, { code: '5106', name: '绵阳市' },
      { code: '5107', name: '广元市' }, { code: '5108', name: '遂宁市' }, { code: '5109', name: '内江市' },
      { code: '5110', name: '乐山市' }, { code: '5111', name: '南充市' }, { code: '5113', name: '眉山市' },
      { code: '5114', name: '宜宾市' }, { code: '5115', name: '广安市' }, { code: '5116', name: '达州市' },
      { code: '5117', name: '雅安市' }, { code: '5118', name: '巴中市' }, { code: '5119', name: '资阳市' }
    ],
    '37': [
      { code: '3701', name: '济南市' }, { code: '3702', name: '青岛市' }, { code: '3703', name: '淄博市' },
      { code: '3704', name: '枣庄市' }, { code: '3705', name: '东营市' }, { code: '3706', name: '烟台市' },
      { code: '3707', name: '潍坊市' }, { code: '3708', name: '济宁市' }, { code: '3709', name: '泰安市' },
      { code: '3710', name: '威海市' }, { code: '3711', name: '日照市' }, { code: '3712', name: '临沂市' },
      { code: '3713', name: '德州市' }, { code: '3714', name: '聊城市' }, { code: '3715', name: '滨州市' },
      { code: '3716', name: '菏泽市' }
    ],
    '41': [
      { code: '4101', name: '郑州市' }, { code: '4102', name: '开封市' }, { code: '4103', name: '洛阳市' },
      { code: '4104', name: '平顶山市' }, { code: '4105', name: '安阳市' }, { code: '4106', name: '鹤壁市' },
      { code: '4107', name: '新乡市' }, { code: '4108', name: '焦作市' }, { code: '4109', name: '濮阳市' },
      { code: '4110', name: '许昌市' }, { code: '4111', name: '漯河市' }, { code: '4112', name: '三门峡市' },
      { code: '4113', name: '南阳市' }, { code: '4114', name: '商丘市' }, { code: '4115', name: '信阳市' },
      { code: '4116', name: '周口市' }, { code: '4117', name: '驻马店市' }
    ],
    '42': [
      { code: '4201', name: '武汉市' }, { code: '4202', name: '黄石市' }, { code: '4203', name: '十堰市' },
      { code: '4205', name: '宜昌市' }, { code: '4206', name: '襄阳市' }, { code: '4207', name: '鄂州市' },
      { code: '4208', name: '荆门市' }, { code: '4209', name: '孝感市' }, { code: '4210', name: '荆州市' },
      { code: '4211', name: '黄冈市' }, { code: '4212', name: '咸宁市' }, { code: '4213', name: '随州市' }
    ],
    '43': [
      { code: '4301', name: '长沙市' }, { code: '4302', name: '株洲市' }, { code: '4303', name: '湘潭市' },
      { code: '4304', name: '衡阳市' }, { code: '4305', name: '邵阳市' }, { code: '4306', name: '岳阳市' },
      { code: '4307', name: '常德市' }, { code: '4308', name: '张家界市' }, { code: '4309', name: '益阳市' },
      { code: '4310', name: '郴州市' }, { code: '4311', name: '永州市' }, { code: '4312', name: '怀化市' },
      { code: '4313', name: '娄底市' }
    ],
    '50': [
      { code: '5001', name: '重庆市辖区' }
    ],
    '11': [
      { code: '1101', name: '北京市辖区' }
    ],
    '12': [
      { code: '1201', name: '天津市辖区' }
    ],
    '31': [
      { code: '3101', name: '上海市辖区' }
    ],
    '21': [
      { code: '2101', name: '沈阳市' }, { code: '2102', name: '大连市' }, { code: '2103', name: '鞍山市' },
      { code: '2104', name: '抚顺市' }, { code: '2105', name: '本溪市' }, { code: '2106', name: '丹东市' },
      { code: '2107', name: '锦州市' }, { code: '2108', name: '营口市' }, { code: '2109', name: '阜新市' },
      { code: '2110', name: '辽阳市' }, { code: '2111', name: '盘锦市' }, { code: '2112', name: '铁岭市' },
      { code: '2113', name: '朝阳市' }, { code: '2114', name: '葫芦岛市' }
    ],
    '22': [
      { code: '2201', name: '长春市' }, { code: '2202', name: '吉林市' }, { code: '2203', name: '四平市' },
      { code: '2204', name: '辽源市' }, { code: '2205', name: '通化市' }, { code: '2206', name: '白山市' },
      { code: '2207', name: '松原市' }, { code: '2208', name: '白城市' }
    ],
    '23': [
      { code: '2301', name: '哈尔滨市' }, { code: '2302', name: '齐齐哈尔市' }, { code: '2303', name: '鸡西市' },
      { code: '2304', name: '鹤岗市' }, { code: '2305', name: '双鸭山市' }, { code: '2306', name: '大庆市' },
      { code: '2307', name: '伊春市' }, { code: '2308', name: '佳木斯市' }, { code: '2309', name: '七台河市' },
      { code: '2310', name: '牡丹江市' }, { code: '2311', name: '黑河市' }, { code: '2312', name: '绥化市' }
    ],
    '14': [
      { code: '1401', name: '太原市' }, { code: '1402', name: '大同市' }, { code: '1403', name: '阳泉市' },
      { code: '1404', name: '长治市' }, { code: '1405', name: '晋城市' }, { code: '1406', name: '朔州市' },
      { code: '1407', name: '晋中市' }, { code: '1408', name: '运城市' }, { code: '1409', name: '忻州市' },
      { code: '1410', name: '临汾市' }, { code: '1411', name: '吕梁市' }
    ],
    '15': [
      { code: '1501', name: '呼和浩特市' }, { code: '1502', name: '包头市' }, { code: '1503', name: '乌海市' },
      { code: '1504', name: '赤峰市' }, { code: '1505', name: '通辽市' }, { code: '1506', name: '鄂尔多斯市' },
      { code: '1507', name: '呼伦贝尔市' }, { code: '1508', name: '巴彦淖尔市' }, { code: '1509', name: '乌兰察布市' }
    ],
    '61': [
      { code: '6101', name: '西安市' }, { code: '6102', name: '铜川市' }, { code: '6103', name: '宝鸡市' },
      { code: '6104', name: '咸阳市' }, { code: '6105', name: '渭南市' }, { code: '6106', name: '延安市' },
      { code: '6107', name: '汉中市' }, { code: '6108', name: '榆林市' }, { code: '6109', name: '安康市' },
      { code: '6110', name: '商洛市' }
    ],
    '62': [
      { code: '6201', name: '兰州市' }, { code: '6202', name: '嘉峪关市' }, { code: '6203', name: '金昌市' },
      { code: '6204', name: '白银市' }, { code: '6205', name: '天水市' }, { code: '6206', name: '武威市' },
      { code: '6207', name: '张掖市' }, { code: '6208', name: '平凉市' }, { code: '6209', name: '酒泉市' },
      { code: '6210', name: '庆阳市' }, { code: '6211', name: '定西市' }, { code: '6212', name: '陇南市' }
    ],
    '63': [
      { code: '6301', name: '西宁市' }, { code: '6302', name: '海东市' }
    ],
    '64': [
      { code: '6401', name: '银川市' }, { code: '6402', name: '石嘴山市' }, { code: '6403', name: '吴忠市' },
      { code: '6404', name: '固原市' }, { code: '6405', name: '中卫市' }
    ],
    '65': [
      { code: '6501', name: '乌鲁木齐市' }, { code: '6502', name: '克拉玛依市' }, { code: '6504', name: '吐鲁番市' },
      { code: '6505', name: '哈密市' }
    ],
    '45': [
      { code: '4501', name: '南宁市' }, { code: '4502', name: '柳州市' }, { code: '4503', name: '桂林市' },
      { code: '4504', name: '梧州市' }, { code: '4505', name: '北海市' }, { code: '4506', name: '防城港市' },
      { code: '4507', name: '钦州市' }, { code: '4508', name: '贵港市' }, { code: '4509', name: '玉林市' },
      { code: '4510', name: '百色市' }, { code: '4511', name: '贺州市' }, { code: '4512', name: '河池市' },
      { code: '4513', name: '来宾市' }, { code: '4514', name: '崇左市' }
    ],
    '52': [
      { code: '5201', name: '贵阳市' }, { code: '5202', name: '六盘水市' }, { code: '5203', name: '遵义市' },
      { code: '5204', name: '安顺市' }, { code: '5205', name: '毕节市' }, { code: '5206', name: '铜仁市' }
    ],
    '53': [
      { code: '5301', name: '昆明市' }, { code: '5303', name: '曲靖市' }, { code: '5304', name: '玉溪市' },
      { code: '5305', name: '保山市' }, { code: '5306', name: '昭通市' }, { code: '5307', name: '丽江市' },
      { code: '5308', name: '普洱市' }, { code: '5309', name: '临沧市' }
    ],
    '35': [
      { code: '3501', name: '福州市' }, { code: '3502', name: '厦门市' }, { code: '3503', name: '莆田市' },
      { code: '3504', name: '三明市' }, { code: '3505', name: '泉州市' }, { code: '3506', name: '漳州市' },
      { code: '3507', name: '南平市' }, { code: '3508', name: '龙岩市' }, { code: '3509', name: '宁德市' }
    ],
    '36': [
      { code: '3601', name: '南昌市' }, { code: '3602', name: '景德镇市' }, { code: '3603', name: '萍乡市' },
      { code: '3604', name: '九江市' }, { code: '3605', name: '新余市' }, { code: '3606', name: '鹰潭市' },
      { code: '3607', name: '赣州市' }, { code: '3608', name: '吉安市' }, { code: '3609', name: '宜春市' },
      { code: '3610', name: '抚州市' }, { code: '3611', name: '上饶市' }
    ],
    '34': [
      { code: '3401', name: '合肥市' }, { code: '3402', name: '芜湖市' }, { code: '3403', name: '蚌埠市' },
      { code: '3404', name: '淮南市' }, { code: '3405', name: '马鞍山市' }, { code: '3406', name: '淮北市' },
      { code: '3407', name: '铜陵市' }, { code: '3408', name: '安庆市' }, { code: '3410', name: '黄山市' },
      { code: '3411', name: '滁州市' }, { code: '3412', name: '阜阳市' }, { code: '3413', name: '宿州市' },
      { code: '3415', name: '六安市' }, { code: '3416', name: '亳州市' }, { code: '3417', name: '池州市' },
      { code: '3418', name: '宣城市' }
    ],
    '46': [
      { code: '4601', name: '海口市' }, { code: '4602', name: '三亚市' }, { code: '4603', name: '三沙市' },
      { code: '4604', name: '儋州市' }
    ]
  };
  return cities[provinceCode] || [];
}

// 内置区县数据
function getDistrictsFromBuiltin(cityCode) {
  const districts = {
    '4401': [
      { code: '440103', name: '荔湾区' }, { code: '440104', name: '越秀区' }, { code: '440105', name: '海珠区' },
      { code: '440106', name: '天河区' }, { code: '440111', name: '白云区' }, { code: '440112', name: '黄埔区' },
      { code: '440113', name: '番禺区' }, { code: '440114', name: '花都区' }, { code: '440115', name: '南沙区' },
      { code: '440117', name: '从化区' }, { code: '440118', name: '增城区' }
    ],
    '4403': [
      { code: '440303', name: '罗湖区' }, { code: '440304', name: '福田区' }, { code: '440305', name: '南山区' },
      { code: '440306', name: '宝安区' }, { code: '440307', name: '龙岗区' }, { code: '440308', name: '盐田区' },
      { code: '440309', name: '龙华区' }, { code: '440310', name: '坪山区' }, { code: '440311', name: '光明区' }
    ],
    '3301': [
      { code: '330102', name: '上城区' }, { code: '330105', name: '拱墅区' }, { code: '330106', name: '西湖区' },
      { code: '330108', name: '滨江区' }, { code: '330109', name: '萧山区' }, { code: '330110', name: '余杭区' },
      { code: '330111', name: '富阳区' }, { code: '330112', name: '临安区' }
    ],
    '5101': [
      { code: '510104', name: '锦江区' }, { code: '510105', name: '青羊区' }, { code: '510106', name: '金牛区' },
      { code: '510107', name: '武侯区' }, { code: '510108', name: '成华区' }, { code: '510112', name: '龙泉驿区' },
      { code: '510113', name: '青白江区' }, { code: '510114', name: '新都区' }, { code: '510115', name: '温江区' },
      { code: '510116', name: '双流区' }, { code: '510117', name: '郫都区' }
    ],
    '3201': [
      { code: '320102', name: '玄武区' }, { code: '320104', name: '秦淮区' }, { code: '320105', name: '建邺区' },
      { code: '320106', name: '鼓楼区' }, { code: '320111', name: '浦口区' }, { code: '320113', name: '栖霞区' },
      { code: '320114', name: '雨花台区' }, { code: '320115', name: '江宁区' }, { code: '320116', name: '六合区' },
      { code: '320117', name: '溧水区' }, { code: '320118', name: '高淳区' }
    ],
    '4201': [
      { code: '420103', name: '江岸区' }, { code: '420104', name: '江汉区' }, { code: '420105', name: '硚口区' },
      { code: '420106', name: '汉阳区' }, { code: '420107', name: '武昌区' }, { code: '420111', name: '洪山区' },
      { code: '420112', name: '东西湖区' }, { code: '420113', name: '汉南区' }, { code: '420114', name: '蔡甸区' },
      { code: '420115', name: '江夏区' }, { code: '420116', name: '黄陂区' }, { code: '420117', name: '新洲区' }
    ],
    '6101': [
      { code: '610102', name: '新城区' }, { code: '610103', name: '碑林区' }, { code: '610104', name: '莲湖区' },
      { code: '610111', name: '灞桥区' }, { code: '610112', name: '未央区' }, { code: '610113', name: '雁塔区' },
      { code: '610114', name: '阎良区' }, { code: '610115', name: '临潼区' }, { code: '610116', name: '长安区' }
    ],
    '5001': [
      { code: '500101', name: '万州区' }, { code: '500102', name: '涪陵区' }, { code: '500103', name: '渝中区' },
      { code: '500104', name: '大渡口区' }, { code: '500105', name: '江北区' }, { code: '500106', name: '沙坪坝区' },
      { code: '500107', name: '九龙坡区' }, { code: '500108', name: '南岸区' }, { code: '500109', name: '北碚区' },
      { code: '500110', name: '綦江区' }, { code: '500112', name: '渝北区' }, { code: '500113', name: '巴南区' }
    ],
    '1101': [
      { code: '110101', name: '东城区' }, { code: '110102', name: '西城区' }, { code: '110105', name: '朝阳区' },
      { code: '110106', name: '丰台区' }, { code: '110107', name: '石景山区' }, { code: '110108', name: '海淀区' },
      { code: '110109', name: '门头沟区' }, { code: '110111', name: '房山区' }, { code: '110112', name: '通州区' },
      { code: '110113', name: '顺义区' }, { code: '110114', name: '昌平区' }, { code: '110115', name: '大兴区' }
    ],
    '3101': [
      { code: '310101', name: '黄浦区' }, { code: '310104', name: '徐汇区' }, { code: '310105', name: '长宁区' },
      { code: '310106', name: '静安区' }, { code: '310107', name: '普陀区' }, { code: '310109', name: '虹口区' },
      { code: '310110', name: '杨浦区' }, { code: '310112', name: '闵行区' }, { code: '310113', name: '宝山区' },
      { code: '310114', name: '嘉定区' }, { code: '310115', name: '浦东新区' }, { code: '310116', name: '金山区' }
    ]
  };
  return districts[cityCode] || [];
}

export default router;
