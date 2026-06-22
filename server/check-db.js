const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

async function main() {
  console.log('--- DATABASE DIAGNOSTIC ---');
  console.log('Current Directory:', process.cwd());
  console.log('DATABASE_URL from .env:', process.env.DATABASE_URL);
  
  const prisma = new PrismaClient();
  
  try {
    // Check tables in SQLite
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('Tables found in database:', tables.map(t => t.name).join(', ') || 'NONE');
    
    if (tables.length === 0) {
      console.log('❌ ERROR: Database is empty. You MUST run "npx prisma db push"');
    } else {
      console.log('✅ SUCCESS: Tables exist.');
    }
  } catch (err) {
    console.log('❌ CONNECTION ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
