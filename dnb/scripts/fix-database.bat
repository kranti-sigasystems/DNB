@echo off
REM Database Migration Fix Script for Windows
REM This script applies pending Prisma migrations and regenerates the client

echo.
echo 🔧 Starting database migration fix...
echo.

REM Step 1: Apply migrations
echo 📦 Step 1: Applying pending migrations...
call npx prisma migrate deploy

if errorlevel 1 (
  echo ❌ Migration failed. Please check the error above.
  exit /b 1
)

echo ✅ Migrations applied successfully
echo.

REM Step 2: Regenerate Prisma client
echo 🔄 Step 2: Regenerating Prisma client...
call npx prisma generate

if errorlevel 1 (
  echo ❌ Prisma generation failed. Please check the error above.
  exit /b 1
)

echo ✅ Prisma client regenerated successfully
echo.

REM Step 3: Success message
echo ✅ Database migration fix completed!
echo.
echo Next steps:
echo 1. Restart your development server: npm run dev
echo 2. The error should now be resolved
echo.

pause
