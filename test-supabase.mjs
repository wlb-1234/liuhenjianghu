import pg from 'pg';

async function testConnection() {
  const pool = new pg.Pool({
    host: process.env.HOST || '57.182.231.186',
    port: parseInt(process.env.PORT || '5432'),
    database: process.env.DB || 'postgres',
    user: process.env.USER || 'postgres.hmlqsbhbbclbzfuutrie',
    password: process.env.PASS || 'Liuhen2026App',
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 查询当前数据库
    const dbResult = await pool.query('SELECT current_database(), inet_server_addr()');
    console.log('当前数据库:', dbResult.rows[0]);

    // 查看所有表
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('所有表:', tables.rows);

    // 查看 posts 表结构
    const postsTable = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'posts'
      ORDER BY ordinal_position
    `);
    console.log('posts 表结构:', postsTable.rows);

    // 查看 admins 表
    const adminsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admins'
      ) as exists
    `);
    console.log('admins 表存在:', adminsCheck.rows[0]);

  } catch (e) {
    console.error('错误:', e.message);
  } finally {
    await pool.end();
  }
}

testConnection();
