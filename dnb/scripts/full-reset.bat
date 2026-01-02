@echo off
REM Full Reset Script - Clears all caches and regenerates everything

echo.
echo 🔧 Starting full reset...
echo.

REM Step 1: Delete Next.js cache
echo Step 1: Clearing Next.js cache...
if exist ".next" (
  rmdir /s /q ".next"
  echo ✅ Next.js cache cleared
) else (
  echo ℹ️  No .next folder found
)

echo.

REM Step 2: Delete generated Prisma client
echo Step 2: Clearing generated Prisma client...
if exist "src\generated" (
  rmdir /s /q "src\generated"
  echo ✅ Generated Prisma client cleared
) else (
  echo ℹ️  No src\generated folder found
)

echo.

REM Step 3: Regenerate Prisma client
echo Step 3: Regenerating Prisma client...
call npx prisma generate

if errorlevel 1 (
  echo ❌ Prisma generation failed!
  exit /b 1
)

echo ✅ Prisma client regenerated

echo.
echo ✅ Full reset completed!
echo.
echo Next steps:
echo 1. Restart your dev server: npm run dev
echo 2. The error should now be completely resolved
echo.

pause
