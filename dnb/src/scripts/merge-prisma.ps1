$baseSchema = @"
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}


datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Merged from model files
// Generated on $(Get-Date)

"@

$baseSchema | Out-File -FilePath "prisma/schema.prisma" -Encoding UTF8

Get-ChildItem "prisma/models/*.prisma" | Sort-Object Name | ForEach-Object {
    "// --- File: $($_.Name) ---" | Out-File -FilePath "prisma/schema.prisma" -Encoding UTF8 -Append
    Get-Content $_.FullName | Out-File -FilePath "prisma/schema.prisma" -Encoding UTF8 -Append
    "" | Out-File -FilePath "prisma/schema.prisma" -Encoding UTF8 -Append
}

Write-Host "✅ Schema merged successfully!" -ForegroundColor Green