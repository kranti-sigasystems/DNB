-- Add missing detail columns to offer_draft_products table
ALTER TABLE "offer_draft_products" ADD COLUMN IF NOT EXISTS "sizeDetails" VARCHAR(100);
ALTER TABLE "offer_draft_products" ADD COLUMN IF NOT EXISTS "breakupDetails" VARCHAR(100);
ALTER TABLE "offer_draft_products" ADD COLUMN IF NOT EXISTS "priceDetails" VARCHAR(50);
ALTER TABLE "offer_draft_products" ADD COLUMN IF NOT EXISTS "conditionDetails" VARCHAR(100);

-- Add missing detail columns to size_breakups table
ALTER TABLE "size_breakups" ADD COLUMN IF NOT EXISTS "sizeDetails" VARCHAR(100);
ALTER TABLE "size_breakups" ADD COLUMN IF NOT EXISTS "breakupDetails" VARCHAR(100);
ALTER TABLE "size_breakups" ADD COLUMN IF NOT EXISTS "priceDetails" VARCHAR(50);