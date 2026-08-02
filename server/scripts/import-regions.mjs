import { getPool } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载 .env 文件
dotenv.config({ path: path.join(__dirname, '../.env') });

async function importRegions() {
  console.log('开始导入民政部行政区划数据...');
  
  // 读取数据文件
  const dataPath = path.join(__dirname, '../../mca_official_regions.json');
  console.log('数据文件路径:', dataPath);
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`读取到 ${data.length} 条记录`);
  
  const pool = getPool();
  
  // 清空现有数据
  console.log('清空现有数据...');
  await pool.query('DELETE FROM regions');
  
  // 批量插入数据
  console.log('开始插入数据...');
  const batchSize = 1000;
  let inserted = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const values = [];
    const placeholders = [];
    
    batch.forEach((item, idx) => {
      const base = idx * 6;
      // 根据 level 设置 type
      let type = '';
      if (item.level === 1) type = '省';
      else if (item.level === 2) type = '市';
      else if (item.level === 3) type = '县';
      else if (item.level === 4) type = '镇';
      
      values.push(
        item.code,
        item.name,
        item.parent_code || null,
        item.level,
        type,
        new Date()
      );
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
    });
    
    const query = `
      INSERT INTO regions (code, name, parent_code, level, type, created_at)
      VALUES ${placeholders.join(', ')}
    `;
    
    await pool.query(query, values);
    inserted += batch.length;
    console.log(`已插入 ${inserted}/${data.length} 条记录`);
  }
  
  console.log('数据导入完成！');
  
  // 统计各级别数量
  const stats = await pool.query(`
    SELECT level, COUNT(*) as count 
    FROM regions 
    GROUP BY level 
    ORDER BY level
  `);
  
  console.log('\n各级别统计：');
  stats.rows.forEach(row => {
    const levelNames = {
      1: '省级',
      2: '地级',
      3: '县级',
      4: '乡级'
    };
    console.log(`${levelNames[row.level] || '未知'}: ${row.count} 条`);
  });
  
  await pool.end();
  process.exit(0);
}

importRegions().catch(err => {
  console.error('导入失败:', err);
  process.exit(1);
});
