-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- Drop existing columns from locations table
ALTER TABLE "locations" DROP COLUMN IF EXISTS "locationName";
ALTER TABLE "locations" DROP COLUMN IF EXISTS "country";
ALTER TABLE "locations" DROP COLUMN IF EXISTS "address";
ALTER TABLE "locations" DROP COLUMN IF EXISTS "postalCode";

-- Add new columns to locations table
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "countryId" TEXT;

-- Update existing data (if any) - set default values
UPDATE "locations" SET 
    "city" = COALESCE("city", 'Unknown'),
    "state" = COALESCE("state", 'Unknown')
WHERE "city" IS NULL OR "state" IS NULL;

-- Make columns NOT NULL after setting default values
ALTER TABLE "locations" ALTER COLUMN "city" SET NOT NULL;
ALTER TABLE "locations" ALTER COLUMN "state" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "countries" ADD CONSTRAINT "countries_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "business_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (will be added after countryId is populated)
-- ALTER TABLE "locations" ADD CONSTRAINT "locations_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;