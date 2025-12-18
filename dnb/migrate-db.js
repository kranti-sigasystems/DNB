require('dotenv').config();
const { execSync } = require('child_process');

console.log('🚀 Starting database migration...');

try {
  // Use direct URL for migrations
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    throw new Error('DIRECT_URL not found in environment variables');
  }
  
  console.log('📦 Regenerating Prisma client...');
  execSync('npm run prisma:generate', { stdio: 'inherit' });
  
  console.log('🗄️ Pushing schema to database...');
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: directUrl }
  });
  
  console.log('✅ Database migration complete!');
  console.log('🎯 You can now test the checkout flow');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\n🔧 Manual steps:');
  console.log('1. Run: npm run prisma:generate');
  console.log('2. Run: npx prisma db push');
  console.log('3. Check your database connection');
  process.exit(1);
}