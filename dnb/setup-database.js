// Simple database setup script
const { execSync } = require('child_process');

console.log('🚀 Setting up database...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npm run prisma:generate', { stdio: 'inherit' });
  
  // Push schema to database (creates tables without migration files)
  console.log('🗄️ Creating database tables...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ Database setup complete!');
  console.log('🎯 You can now test the checkout flow');
  
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}