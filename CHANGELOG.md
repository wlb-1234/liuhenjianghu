# 变更日志 (Changelog)

## 2026-06-14

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
