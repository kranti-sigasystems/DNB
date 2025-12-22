const { PrismaClient } = require('./src/generated/prisma');
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
  log: ['query', 'error'],
});

async function fixBuyersTable() {
  try {
    console.log('🔧 Fixing buyers table structure...');
    
    // Check current columns
    const currentColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'buyers' 
      ORDER BY ordinal_position;
    `;
    
    const columnNames = currentColumns.map(col => col.column_name);
    console.log('📋 Current columns:', columnNames);
    
    // Add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'phoneNumber', type: 'TEXT', nullable: true },
      { name: 'businessName', type: 'TEXT', nullable: true },
      { name: 'registrationNumber', type: 'TEXT', nullable: true },
      { name: 'address', type: 'TEXT', nullable: true },
      { name: 'city', type: 'TEXT', nullable: true },
      { name: 'state', type: 'TEXT', nullable: true },
      { name: 'country', type: 'TEXT', nullable: false, default: "'India'" },
      { name: 'postalCode', type: 'TEXT', nullable: true }
    ];
    
    for (const column of columnsToAdd) {
      if (!columnNames.includes(column.name)) {
        console.log(`➕ Adding missing column: ${column.name}`);
        
        let sql = `ALTER TABLE "buyers" ADD COLUMN "${column.name}" ${column.type}`;
        if (!column.nullable) {
          sql += ' NOT NULL';
        }
        if (column.default) {
          sql += ` DEFAULT ${column.default}`;
        }
        
        try {
          await prisma.$executeRawUnsafe(sql);
          console.log(`✅ Added column: ${column.name}`);
        } catch (error) {
          console.log(`⚠️ Failed to add column ${column.name}:`, error.message);
        }
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }
    
    // Add unique constraint for registrationNumber if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "buyers_registrationNumber_key" 
        ON "buyers"("registrationNumber") 
        WHERE "registrationNumber" IS NOT NULL;
      `;
      console.log('✅ Added unique constraint for registrationNumber');
    } catch (error) {
      console.log('⚠️ Unique constraint may already exist:', error.message);
    }
    
    console.log('\n🎉 Buyers table structure fixed!');
    
    // Test the buyer query now
    console.log('\n🧪 Testing buyer query...');
    try {
      const buyers = await prisma.buyer.findMany({ take: 1 });
      console.log(`✅ Buyer query successful! Found ${buyers.length} buyers`);
    } catch (error) {
      console.log('❌ Buyer query still failing:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to fix buyers table:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

fixBuyersTable();