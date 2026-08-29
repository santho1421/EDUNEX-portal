require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'skillbridge',
      multipleStatements: true
    });
    console.log('✅ Connected to MySQL');

    // Generate real bcrypt hash for "demo123"
    const hash = await bcrypt.hash('demo123', 10);
    console.log('🔐 Password hash generated');

    // Fix the demo user passwords in seed.sql with real hash
    let seedSQL = fs.readFileSync(path.join(__dirname, '../models/seed.sql'), 'utf8');
    seedSQL = seedSQL.replace(
      /'\$2a\$10\$92IXUNpkjO0rOQ5byMi\.Ye4oKoEa3Ro9llC\/\.og\/at2\.uheWG\/igi'/g,
      `'${hash}'`
    );

    await conn.query(seedSQL);
    await conn.query(
      `UPDATE users SET email = 'demo@gmail.com' WHERE id = 'u-student-demo-001'`
    );
    await conn.query(
      `UPDATE users SET password_hash = ? WHERE email IN ('student@demo.com', 'college@demo.com', 'industry@demo.com', 'demo@gmail.com', 'college@gmail.com', 'industry@gmail.com')`,
      [hash]
    );
    console.log('✅ Seed data inserted');

    console.log('\n🎉 Demo accounts created (Password: demo123):');
    console.log('   Student  → demo@gmail.com   / demo123');
    console.log('   College  → college@demo.com / demo123');
    console.log('   Industry → industry@demo.com/ demo123');
    console.log('\n🚀 Ready! Run: npm run dev\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

seed();
