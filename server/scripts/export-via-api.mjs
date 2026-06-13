import fs from 'fs';
import https from 'https';
import http from 'http';

const BASE_URL = 'http://localhost:9091';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching provinces...');
  const provinces = await httpGet(`${BASE_URL}/api/v1/regions/provinces`);
  console.log(`Got ${provinces.length} provinces`);

  const citiesMap = {};
  const districtsMap = {};
  const streetsMap = {};

  // 获取每个省份的城市
  for (const province of provinces) {
    const cities = await httpGet(`${BASE_URL}/api/v1/regions/cities/${province.code}`);
    if (cities && cities.length > 0) {
      citiesMap[province.code] = cities;
      console.log(`  ${province.name}: ${cities.length} cities`);
      
      // 获取每个城市的区县
      for (const city of cities) {
        const districts = await httpGet(`${BASE_URL}/api/v1/regions/districts/${city.code}`);
        if (districts && districts.length > 0) {
          districtsMap[city.code] = districts;
          
          // 获取每个区县的街道
          for (const district of districts) {
            const streets = await httpGet(`${BASE_URL}/api/v1/regions/streets/${district.code}`);
            if (streets && streets.length > 0) {
              streetsMap[district.code] = streets;
            }
          }
        }
      }
    }
  }

  const result = {
    provinces,
    cities: citiesMap,
    districts: districtsMap,
    streets: streetsMap
  };

  const outputPath = './src/data/regions.json';
  fs.writeFileSync(outputPath, JSON.stringify(result));
  console.log(`\nSaved to ${outputPath}`);
  
  // 统计
  const cityCount = Object.values(citiesMap).reduce((sum, arr) => sum + arr.length, 0);
  const districtCount = Object.values(districtsMap).reduce((sum, arr) => sum + arr.length, 0);
  const streetCount = Object.values(streetsMap).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`Stats: ${cityCount} cities, ${districtCount} districts, ${streetCount} streets`);
}

main().catch(console.error);
