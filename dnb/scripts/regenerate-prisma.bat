@echo off
REM Regenerate Prisma Client Script for Windows

echo.
echo 🔄 Regenerating Prisma Client...
echo.

REM Delete the generated folder if it exists
if exist "src\generated" (
  echo Deleting old generated files...
  rmdir /s /q "src\generated"
)

REM Run prisma generate
echo Running prisma generate...
call npx prisma generate

if errorlevel 1 (
  echo ❌ Prisma generation failed!
  exit /b 1
)

echo.
echo ✅ Prisma client regenerated successfully!
echo.
echo Next steps:
echo 1. Clear Next.js cache: del /s /q .next
echo 2. Restart your dev server: npm run dev
echo.

pause
