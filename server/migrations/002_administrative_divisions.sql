-- 行政区划表（完整版）
CREATE TABLE IF NOT EXISTS administrative_divisions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,  -- 行政区划代码
    name VARCHAR(100) NOT NULL,         -- 名称
    level INTEGER NOT NULL,             -- 级别: 1省/自治区/直辖市, 2市/地区/自治州, 3区/县/县级市, 4街道/镇/乡
    parent_code VARCHAR(20),            -- 父级代码
    province_code VARCHAR(10),          -- 省级代码
    city_code VARCHAR(10),             -- 市级代码
    district_code VARCHAR(10),          -- 区县代码
    full_path VARCHAR(500),            -- 完整路径，如 "广东省/广州市/天河区/沙河街道"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ad_code ON administrative_divisions(code);
CREATE INDEX IF NOT EXISTS idx_ad_parent ON administrative_divisions(parent_code);
CREATE INDEX IF NOT EXISTS idx_ad_level ON administrative_divisions(level);
CREATE INDEX IF NOT EXISTS idx_ad_province ON administrative_divisions(province_code);
CREATE INDEX IF NOT EXISTS idx_ad_city ON administrative_divisions(city_code);
CREATE INDEX IF NOT EXISTS idx_ad_district ON administrative_divisions(district_code);

-- 西部数据导入函数
CREATE OR REPLACE FUNCTION import_administrative_divisions()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    -- 数据将通过批量INSERT导入
END;
$$ LANGUAGE plpgsql;
