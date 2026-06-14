# 变更日志 (Changelog)

> 最后更新：2026-06-14 21:50 (UTC+8)
> 当前版本：v2.2.0

---

## 2026-06-14 21:50 (UTC+8) - v2.2.0

### 行政区划数据补全

**更新内容**：
根据民政部截至2025年12月31日最新统计数据，补全全国行政区划数据。

### 行政区划数据补全（第二阶段）

**更新内容**：
根据民政部截至2025年12月31日最新统计数据，补全乡级行政区划数据。

**数据规模**：

| 层级 | 数量 | 说明 |
|------|------|------|
| 省级 | 34 个 | 省23个、自治区5个、直辖市4个、特别行政区2个 |
| 地级 | 356 个 | 地级市293个、地区7个、自治州30个、盟3个、港澳台城市23个 |
| 区县 | 381 个 | 覆盖全国主要城市主城区县 |
| 街道/镇/乡 | 39,156 个 | 包含街道、镇、乡、民族乡、苏木等类型 |

**乡级数据说明**：
- 街道：覆盖各城市主城区
- 镇：覆盖各县域中心镇
- 乡：覆盖各农业型乡镇
- 民族乡：覆盖各少数民族聚居区
- 苏木：覆盖内蒙古等地

---

## 2026-06-14 21:50 (UTC+8) - v2.2.0

**已包含完整区县数据的城市**：
- 北京市、上海市、天津市、重庆市（直辖市）
- 河北省：石家庄市、唐山市、保定市
- 广东省：广州市、深圳市、佛山市、珠海市
- 江苏省：南京市、苏州市
- 浙江省：杭州市、宁波市
- 山东省：济南市、青岛市
- 四川省：成都市
- 湖北省：武汉市
- 河南省：郑州市
- 湖南省：长沙市

**数据来源**：中华人民共和国民政部

**变更文件**：
| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `server/src/routes/regions.ts` | 修改 | 补全全国城市数据，添加主要城市完整区县数据 |

---

## 2026-06-14 21:30 (UTC+8) - v2.1.0

### 行政区划 API 修复

**问题描述**：
- Railway 部署后 `/api/v1/regions/cities/13` (河北省) 返回空数组
- Railway 部署失败，报错 `service config at 'server/railway.json' not found`

**根本原因**：
- Railway 在 `server/` 子目录中查找 `railway.json` 配置文件，但该文件不存在
- 数据文件 JSON 无法正确加载到容器中

**解决方案**：
1. 创建 `server/railway.json` 配置文件，指向根目录 Dockerfile
2. 将行政区划数据完全内联到 `server/src/routes/regions.ts` 中，不再依赖外部 JSON 文件

**变更文件**：
| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `server/railway.json` | 新增 | Railway 部署配置 |
| `server/src/routes/regions.ts` | 修改 | 数据内联化，添加完整城市数据 |
| `CHANGELOG.md` | 新增 | 变更日志文档 |

**数据结构**：

```typescript
interface RegionData {
  provinces: Province[];      // 省份列表
  cities: Record<string, City[]>;   // 省份代码 → 城市列表
  districts: Record<string, District[]>;  // 城市代码 → 区县列表
  streets: Record<string, Street[]>;     // 区县代码 → 街道列表
}
```

**数据规模**：

| 层级 | 数量 |
|------|------|
| 省份 | 34 个 |
| 城市 | 300+ 个 |
| 区县 | 部分完整 |
| 街道 | 待扩展 |

**API 端点**：

| 端点 | 说明 |
|------|------|
| `GET /api/v1/regions/provinces` | 获取所有省份 |
| `GET /api/v1/regions/cities/:provinceCode` | 获取省份下所有城市 |
| `GET /api/v1/regions/districts/:cityCode` | 获取城市下所有区县 |
| `GET /api/v1/regions/streets/:districtCode` | 获取区县下所有街道 |

**河北省完整城市数据**：

```json
[
  {"code": "1301", "name": "石家庄市"},
  {"code": "1302", "name": "唐山市"},
  {"code": "1303", "name": "秦皇岛市"},
  {"code": "1304", "name": "邯郸市"},
  {"code": "1305", "name": "邢台市"},
  {"code": "1306", "name": "保定市"},
  {"code": "1307", "name": "张家口市"},
  {"code": "1308", "name": "承德市"},
  {"code": "1309", "name": "沧州市"},
  {"code": "1310", "name": "廊坊市"},
  {"code": "1311", "name": "衡水市"}
]
```

**部署验证**：

```bash
curl https://server-production-64d28.up.railway.app/api/v1/regions/cities/13
# 返回: {"code":0,"message":"success","data":[...11个城市...]}
```
