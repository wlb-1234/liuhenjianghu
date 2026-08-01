import { Router } from "express";
import { getCache, setCache, CACHE_KEYS } from "../middleware/cache";
import { getCoordinates } from "../data/coordinates";
import { query } from "../config/database";

const router = Router();

// ==================== 从数据库读取行政区域数据 ====================

// 获取省级数据
async function getProvinces() {
  const cacheKey = CACHE_KEYS.PROVINCES;
  const cached = getCache(cacheKey);
  if (cached) return cached as { code: string; name: string }[];

  const result = await query(
    "SELECT code, name, type FROM regions WHERE level = 1 ORDER BY code"
  );
  const provinces: { code: string; name: string }[] = result.rows.map((r) => ({ code: r.code, name: r.name }));
  setCache(cacheKey, provinces, 3600);
  return provinces;
}

// 获取地级数据
async function getCities(provinceCode?: string) {
  const cacheKey = CACHE_KEYS.CITIES + (provinceCode || "all");
  const cached = getCache(cacheKey);
  if (cached) return cached as Record<string, { code: string; name: string }[]>;

  let sql = "SELECT code, name, type, parent_code FROM regions WHERE level = 2";
  const params: any[] = [];
  if (provinceCode) {
    sql += " AND parent_code = $1";
    params.push(provinceCode);
  }
  sql += " ORDER BY code";

  const result = await query(sql, params);
  const cities: Record<string, { code: string; name: string }[]> = {};
  for (const row of result.rows) {
    const parent = row.parent_code;
    if (!cities[parent]) cities[parent] = [];
    cities[parent].push({ code: row.code, name: row.name });
  }
  setCache(cacheKey, cities, 3600);
  return cities;
}

// 获取县级数据
async function getDistricts(cityCode?: string) {
  const cacheKey = CACHE_KEYS.DISTRICTS + (cityCode || "all");
  const cached = getCache(cacheKey);
  if (cached) return cached as Record<string, { code: string; name: string }[]>;

  let sql = "SELECT code, name, type, parent_code FROM regions WHERE level = 3";
  const params: any[] = [];
  if (cityCode) {
    sql += " AND parent_code = $1";
    params.push(cityCode);
  }
  sql += " ORDER BY code";

  const result = await query(sql, params);
  const districts: Record<string, { code: string; name: string }[]> = {};
  for (const row of result.rows) {
    const parent = row.parent_code;
    if (!districts[parent]) districts[parent] = [];
    districts[parent].push({ code: row.code, name: row.name });
  }
  setCache(cacheKey, districts, 3600);
  return districts;
}

// 获取镇级数据
async function getStreets(districtCode?: string) {
  const cacheKey = CACHE_KEYS.STREETS + (districtCode || "all");
  const cached = getCache(cacheKey);
  if (cached) return cached as Record<string, { code: string; name: string; type: string }[]>;

  let sql = "SELECT code, name, type, parent_code FROM regions WHERE level = 4";
  const params: any[] = [];
  if (districtCode) {
    sql += " AND parent_code = $1";
    params.push(districtCode);
  }
  sql += " ORDER BY code";

  const result = await query(sql, params);
  const streets: Record<string, { code: string; name: string; type: string }[]> = {};
  for (const row of result.rows) {
    const parent = row.parent_code;
    if (!streets[parent]) streets[parent] = [];
    streets[parent].push({ code: row.code, name: row.name, type: row.type });
  }
  setCache(cacheKey, streets, 3600);
  return streets;
}

// ==================== 路由定义 ====================

// 省级列表（缓存 1 天）
router.get("/provinces", async (req, res) => {
  try {
    const provinces = await getProvinces();
    // 添加坐标信息
    const provincesWithCoords = provinces.map((p) => ({
      ...p,
      coordinates: getCoordinates(p.code),
    }));
    res.json({ code: 200, message: "success", data: provincesWithCoords });
  } catch (error) {
    console.error("获取省级数据失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 通用下级查询接口
router.get("/children/:code", async (req, res) => {
  try {
    const { code } = req.params;

    if (code.length === 2) {
      // 查询城市
      const cities = await getCities(code);
      const data = (cities[code] || []).map((c) => ({
        code: c.code,
        name: c.name,
        level: "city",
      }));
      return res.json({ code: 200, message: "success", data });
    }

    if (code.length === 4) {
      // 查询区县
      const districts = await getDistricts(code);
      const data = (districts[code] || []).map((d) => ({
        code: d.code,
        name: d.name,
        level: "district",
      }));
      return res.json({ code: 200, message: "success", data });
    }

    if (code.length === 6) {
      // 查询街道
      const streets = await getStreets(code);
      const data = (streets[code] || []).map((s) => ({
        code: s.code,
        name: s.name,
        level: "street",
        type: s.type,
      }));
      return res.json({ code: 200, message: "success", data });
    }

    res.status(400).json({ code: 400, message: "无效的行政区划代码" });
  } catch (error) {
    console.error("查询下级区域失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 模糊搜索接口
router.get("/search", async (req, res) => {
  try {
    const { keyword, level = "all", limit = 20 } = req.query;

    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ code: 400, message: "请提供搜索关键词" });
    }

    const kw = keyword.toLowerCase();
    const limitNum = Math.min(Number(limit) || 20, 100);
    const results: any[] = [];

    // 搜索省级
    if (level === "all" || level === "province") {
      const provinces = await getProvinces();
      for (const p of provinces) {
        if (p.name.toLowerCase().includes(kw)) {
          results.push({ code: p.code, name: p.name, level: "province", path: [p.name] });
        }
      }
    }

    // 搜索城市
    if (results.length < limitNum && (level === "all" || level === "city")) {
      const cities = await getCities();
      const provinces = await getProvinces();
      for (const [pCode, cityList] of Object.entries(cities)) {
        const pName = provinces.find((p) => p.code === pCode)?.name || "";
        for (const c of cityList) {
          if (c.name.toLowerCase().includes(kw)) {
            results.push({ code: c.code, name: c.name, level: "city", path: [pName, c.name] });
            if (results.length >= limitNum) break;
          }
        }
      }
    }

    // 搜索区县
    if (results.length < limitNum && (level === "all" || level === "district")) {
      const districts = await getDistricts();
      const cities = await getCities();
      const provinces = await getProvinces();
      for (const [cCode, districtList] of Object.entries(districts)) {
        const cName = cities[cCode]?.find((c) => c.code === cCode)?.name || "";
        const pCode = cCode.substring(0, 2);
        const pName = provinces.find((p) => p.code === pCode)?.name || "";
        for (const d of districtList) {
          if (d.name.toLowerCase().includes(kw)) {
            results.push({
              code: d.code,
              name: d.name,
              level: "district",
              path: [pName, cName, d.name],
            });
            if (results.length >= limitNum) break;
          }
        }
      }
    }

    // 搜索镇级
    if (results.length < limitNum && (level === "all" || level === "street")) {
      const streets = await getStreets();
      const districts = await getDistricts();
      const cities = await getCities();
      const provinces = await getProvinces();
      for (const [dCode, streetList] of Object.entries(streets)) {
        const dName = districts[dCode]?.find((d) => d.code === dCode)?.name || "";
        const cCode = dCode.substring(0, 4);
        const cName = cities[cCode]?.find((c) => c.code === cCode)?.name || "";
        const pCode = cCode.substring(0, 2);
        const pName = provinces.find((p) => p.code === pCode)?.name || "";
        for (const s of streetList) {
          if (s.name.toLowerCase().includes(kw)) {
            results.push({
              code: s.code,
              name: s.name,
              level: "street",
              type: s.type,
              path: [pName, cName, dName, s.name],
            });
            if (results.length >= limitNum) break;
          }
        }
      }
    }

    res.json({ code: 200, message: "success", data: results.slice(0, limitNum) });
  } catch (error) {
    console.error("搜索区域失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 查询完整路径
router.get("/path/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const path: { code: string; name: string; level: string }[] = [];

    if (code.length === 6) {
      // 镇级代码，需要查询完整路径
      const provinceCode = code.substring(0, 2);
      const cityCode = code.substring(0, 4);
      const districtCode = code.substring(0, 6);

      const provinces = await getProvinces();
      const cities = await getCities(provinceCode);
      const districts = await getDistricts(cityCode);
      const streets = await getStreets(districtCode);

      const province = provinces.find((p) => p.code === provinceCode);
      const city = cities[provinceCode]?.find((c) => c.code === cityCode);
      const district = districts[cityCode]?.find((d) => d.code === districtCode);
      const street = streets[districtCode]?.find((s) => s.code === code);

      if (province) path.push({ code: province.code, name: province.name, level: "province" });
      if (city) path.push({ code: city.code, name: city.name, level: "city" });
      if (district) path.push({ code: district.code, name: district.name, level: "district" });
      if (street) path.push({ code: street.code, name: street.name, level: "street" });
    } else if (code.length === 4) {
      // 县级代码
      const provinceCode = code.substring(0, 2);
      const cityCode = code.substring(0, 4);

      const provinces = await getProvinces();
      const cities = await getCities(provinceCode);
      const districts = await getDistricts(cityCode);

      const province = provinces.find((p) => p.code === provinceCode);
      const city = cities[provinceCode]?.find((c) => c.code === cityCode);
      const district = districts[cityCode]?.find((d) => d.code === cityCode);

      if (province) path.push({ code: province.code, name: province.name, level: "province" });
      if (city) path.push({ code: city.code, name: city.name, level: "city" });
      if (district) path.push({ code: district.code, name: district.name, level: "district" });
    } else if (code.length === 2) {
      // 地级代码
      const provinceCode = code.substring(0, 2);

      const provinces = await getProvinces();
      const cities = await getCities(provinceCode);

      const province = provinces.find((p) => p.code === provinceCode);
      const city = cities[provinceCode]?.find((c) => c.code === code);

      if (province) path.push({ code: province.code, name: province.name, level: "province" });
      if (city) path.push({ code: city.code, name: city.name, level: "city" });
    }

    res.json({ code: 200, message: "success", data: path });
  } catch (error) {
    console.error("查询路径失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 查询指定省份的城市列表
router.get("/cities/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const cities = await getCities(code);
    const data = cities[code] || [];
    res.json({ code: 200, message: "success", data });
  } catch (error) {
    console.error("查询城市列表失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 查询单个城市信息
router.get("/city/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const provinceCode = code.substring(0, 2);
    const cities = await getCities(provinceCode);
    const city = cities[provinceCode]?.find((c) => c.code === code);

    if (city) {
      res.json({ code: 200, message: "success", data: city });
    } else {
      res.status(404).json({ code: 404, message: "城市不存在" });
    }
  } catch (error) {
    console.error("查询城市信息失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 查询指定城市的区县列表
router.get("/districts/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const districts = await getDistricts(code);
    const data = districts[code] || [];
    res.json({ code: 200, message: "success", data });
  } catch (error) {
    console.error("查询区县列表失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 查询单个区县信息
router.get("/district/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const cityCode = code.substring(0, 4);
    const districts = await getDistricts(cityCode);
    const district = districts[cityCode]?.find((d) => d.code === code);

    if (district) {
      res.json({ code: 200, message: "success", data: district });
    } else {
      res.status(404).json({ code: 404, message: "区县不存在" });
    }
  } catch (error) {
    console.error("查询区县信息失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 查询指定区县的镇/街道列表
router.get("/streets/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const streets = await getStreets(code);
    const data = streets[code] || [];
    res.json({ code: 200, message: "success", data });
  } catch (error) {
    console.error("查询镇/街道列表失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 查询单个镇/街道信息
router.get("/street/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const districtCode = code.substring(0, 6);
    const streets = await getStreets(districtCode);
    const street = streets[districtCode]?.find((s) => s.code === code);

    if (street) {
      res.json({ code: 200, message: "success", data: street });
    } else {
      res.status(404).json({ code: 404, message: "镇/街道不存在" });
    }
  } catch (error) {
    console.error("查询镇/街道信息失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 数据统计
router.get("/stats", async (req, res) => {
  try {
    const result = await query(
      "SELECT level, COUNT(*) as count FROM regions GROUP BY level ORDER BY level"
    );
    const stats: Record<string, number> = {};
    for (const row of result.rows) {
      const levelMap: Record<string, string> = {
        "1": "provinces",
        "2": "cities",
        "3": "districts",
        "4": "streets",
      };
      stats[levelMap[row.level] || row.level] = parseInt(row.count);
    }
    res.json({ code: 200, message: "success", data: stats });
  } catch (error) {
    console.error("查询统计数据失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 缓存统计
router.get("/cache/stats", (req, res) => {
  const cacheStats = {
    provinces: getCache(CACHE_KEYS.PROVINCES) ? "cached" : "not cached",
    cities: getCache(CACHE_KEYS.CITIES + "all") ? "cached" : "not cached",
    districts: getCache(CACHE_KEYS.DISTRICTS + "all") ? "cached" : "not cached",
    streets: getCache(CACHE_KEYS.STREETS + "all") ? "cached" : "not cached",
  };
  res.json({ code: 200, message: "success", data: cacheStats });
});

export default router;
