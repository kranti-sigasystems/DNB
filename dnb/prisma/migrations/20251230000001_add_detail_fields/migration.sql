-- Add detail fields to offer_draft_products table
ALTER TABLE "offer_draft_products" 
ADD COLUMN IF NOT EXISTS "sizeDetails" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "breakupDetails" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "priceDetails" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "conditionDetails" VARCHAR(100);