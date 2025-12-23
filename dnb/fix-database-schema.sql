-- Add missing Stripe fields to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT,
ADD COLUMN IF NOT EXISTS "stripePaymentId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

-- Create unique index for stripeSessionId
CREATE UNIQUE INDEX IF NOT EXISTS "payments_stripeSessionId_key" ON payments("stripeSessionId");

-- Add missing Stripe fields to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);

-- Create unique index for stripeSubscriptionId
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripeSubscriptionId_key" ON subscriptions("stripeSubscriptionId");

-- Update existing payment records to have proper transactionId format
UPDATE payments 
SET "transactionId" = CONCAT('legacy_', id) 
WHERE "transactionId" IS NULL OR "transactionId" = '';

-- Ensure all payments have a transactionId
ALTER TABLE payments 
ALTER COLUMN "transactionId" SET NOT NULL;