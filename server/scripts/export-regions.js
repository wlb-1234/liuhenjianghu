const pg = require('pg');
const fs = require('fs');
const path = require('path');

async function exportData() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/liuhenjianghu?sslmode=require'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 获取省份
    const provinces = await client.query(`
      SELECT code, name FROM administrative_divisions 
      WHERE level = 1 ORDER BY code
    `);

    // 获取城市
    const cities = await client.query(`
      SELECT parent_code, code, name FROM administrative_divisions 
      WHERE level = 2 ORDER BY parent_code, code
    `);

    // 获取区县
    const districts = await client.query(`
      SELECT parent_code, code, name FROM administrative_divisions 
      WHERE level = 3 ORDER BY parent_code, code
    `);

    // 获取街道
    const streets = await client.query(`
      SELECT parent_code, code, name FROM administrative_divisions 
      WHERE level = 4 ORDER BY parent_code, code
    `);

    // 整理数据
    const provincesList = provinces.rows.map(r => ({ code: r.code, name: r.name }));
    const citiesMap = {};
    const districtsMap = {};
    const streetsMap = {};

    cities.rows.forEach(r => {
      if (!citiesMap[r.parent_code]) citiesMap[r.parent_code] = [];
      citiesMap[r.parent_code].push({ code: r.code, name: r.name });
    });

    districts.rows.forEach(r => {
      if (!districtsMap[r.parent_code]) districtsMap[r.parent_code] = [];
      districtsMap[r.parent_code].push({ code: r.code, name: r.name });
    });

    streets.rows.forEach(r => {
      if (!streetsMap[r.parent_code]) streetsMap[r.parent_code] = [];
      streetsMap[r.parent_code].push({ code: r.code, name: r.name });
    });

    const result = {
      provinces: provincesList,
      cities: citiesMap,
      districts: districtsMap,
      streets: streetsMap
    };

    // 写入JSON文件
    const outputPath = path.join(__dirname, 'src/data/regions.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Exported to ${outputPath}`);
    console.log(`Provinces: ${provincesList.length}, Cities: ${cities.rows.length}, Districts: ${districts.rows.length}, Streets: ${streets.rows.length}`);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

exportData();
