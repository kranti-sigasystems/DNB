const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllTables() {
  try {
    console.log('🔍 Checking all database tables...');
    
    // Get all tables in the database
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📋 Existing tables:');
    if (tables.length === 0) {
      console.log('  ❌ No tables found in database');
    } else {
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.table_name}`);
      });
    }
    
    console.log('\n🔍 Checking specific tables needed for the application...');
    
    // Check each required table
    const requiredTables = ['users', 'business_owners', 'buyers', 'payments', 'subscriptions', 'plans'];
    
    for (const tableName of requiredTables) {
      try {
        const result = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position;
        `;
        
        if (result.length > 0) {
          console.log(`✅ ${tableName} table exists with ${result.length} columns`);
        } else {
          console.log(`❌ ${tableName} table does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${tableName} table:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTables();