-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'yearly');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'monthly',
    "stripeProductId" TEXT,
    "stripePriceMonthlyId" TEXT,
    "stripePriceYearlyId" TEXT,
    "priceMonthly" DECIMAL(65,30),
    "priceYearly" DECIMAL(65,30),
    "maxLocations" INTEGER NOT NULL DEFAULT 1,
    "maxProducts" INTEGER NOT NULL DEFAULT 50,
    "maxOffers" INTEGER NOT NULL DEFAULT 100,
    "maxBuyers" INTEGER NOT NULL DEFAULT 50,
    "features" JSONB NOT NULL DEFAULT '[]',
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");
