const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

async function checkBuyersTable() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'buyers' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "buyers"`;
    
  } catch (error) {
    console.error('❌ Error checking buyers table:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuyersTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });