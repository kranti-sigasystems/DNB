-- CreateEnum
CREATE TYPE "OfferDraftStatus" AS ENUM ('open', 'close');

-- CreateTable
CREATE TABLE "offers_draft" (
    "draftNo" SERIAL NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "fromParty" VARCHAR(150) NOT NULL,
    "origin" VARCHAR(50) NOT NULL,
    "processor" VARCHAR(50),
    "plantApprovalNumber" VARCHAR(50) NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "draftName" VARCHAR(50),
    "offerValidityDate" TIMESTAMP(3),
    "shipmentDate" TIMESTAMP(3),
    "quantity" TEXT,
    "tolerance" TEXT,
    "paymentTerms" TEXT,
    "remark" VARCHAR(100),
    "grandTotal" DECIMAL(15,2),
    "status" "OfferDraftStatus" NOT NULL DEFAULT 'open',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_draft_pkey" PRIMARY KEY ("draftNo")
);

-- CreateTable
CREATE TABLE "offer_draft_products" (
    "id" TEXT NOT NULL,
    "draftNo" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" VARCHAR(100) NOT NULL,
    "species" VARCHAR(100) NOT NULL,
    "sizeDetails" VARCHAR(100),
    "breakupDetails" VARCHAR(100),
    "priceDetails" VARCHAR(50),
    "conditionDetails" VARCHAR(100),
    "packing" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_draft_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "size_breakups" (
    "id" TEXT NOT NULL,
    "offerDraftProductId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "breakup" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "condition" VARCHAR(50),
    "sizeDetails" VARCHAR(100),
    "breakupDetails" VARCHAR(100),
    "priceDetails" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "size_breakups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "offers_draft" ADD CONSTRAINT "offers_draft_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "business_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_draft_products" ADD CONSTRAINT "offer_draft_products_draftNo_fkey" FOREIGN KEY ("draftNo") REFERENCES "offers_draft"("draftNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_breakups" ADD CONSTRAINT "size_breakups_offerDraftProductId_fkey" FOREIGN KEY ("offerDraftProductId") REFERENCES "offer_draft_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;