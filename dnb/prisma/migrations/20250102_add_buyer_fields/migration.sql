-- Add missing columns to buyers table
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "businessName" TEXT;
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT;
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "taxId" TEXT;
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "countryCode" TEXT;
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'India';
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;

-- Add unique constraint for registrationNumber if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'buyers' AND constraint_name = 'buyers_registrationNumber_key'
  ) THEN
    ALTER TABLE "buyers" ADD CONSTRAINT "buyers_registrationNumber_key" UNIQUE ("registrationNumber");
  END IF;
END $$;

-- Add unique constraints for businessName and phoneNumber per business owner
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'buyers' AND constraint_name = 'unique_buyer_business_name_per_owner'
  ) THEN
    ALTER TABLE "buyers" ADD CONSTRAINT "unique_buyer_business_name_per_owner" UNIQUE ("businessOwnerId", "businessName");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'buyers' AND constraint_name = 'unique_buyer_phone_per_owner'
  ) THEN
    ALTER TABLE "buyers" ADD CONSTRAINT "unique_buyer_phone_per_owner" UNIQUE ("businessOwnerId", "phoneNumber");
  END IF;
END $$;
