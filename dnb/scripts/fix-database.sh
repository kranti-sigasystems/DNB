#!/bin/bash

# Database Migration Fix Script
# This script applies pending Prisma migrations and regenerates the client

echo "🔧 Starting database migration fix..."
echo ""

# Step 1: Apply migrations
echo "📦 Step 1: Applying pending migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Migration failed. Please check the error above."
  exit 1
fi

echo "✅ Migrations applied successfully"
echo ""

# Step 2: Regenerate Prisma client
echo "🔄 Step 2: Regenerating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
  echo "❌ Prisma generation failed. Please check the error above."
  exit 1
fi

echo "✅ Prisma client regenerated successfully"
echo ""

# Step 3: Verify schema
echo "✅ Database migration fix completed!"
echo ""
echo "Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. The error should now be resolved"
echo ""
