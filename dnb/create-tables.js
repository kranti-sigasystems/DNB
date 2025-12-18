const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function createTables() {
  try {
    console.log('🚀 Creating database tables...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Try to create a simple record to test if tables exist
    try {
      const testUser = await prisma.user.findFirst();
      console.log('✅ Tables already exist and working');
      return;
    } catch (error) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        console.log('❌ Tables do not exist, need to create them');
        console.log('Please run: npx prisma db push');
        process.exit(1);
      }
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTables();