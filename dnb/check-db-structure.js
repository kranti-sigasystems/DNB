const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Check if users table exists and its structure
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
      `;
      
      if (result.length > 0) {
        console.log('✅ Users table exists with columns:');
        result.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      } else {
        console.log('❌ Users table does not exist');
      }
    } catch (error) {
      console.log('❌ Error checking users table:', error.message);
    }

    // Check other tables
    const tables = ['business_owners', 'buyers', 'payments', 'subscriptions', 'plans'];
    
    for (const tableName of tables) {
      try {
        const result = await prisma.$queryRaw`
          SELECT column_name, data_type
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

checkDatabaseStructure();