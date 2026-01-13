/*
  Warnings:

  - You are about to drop the `aggregate_metrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "spatial"."PhotoCategory" ADD VALUE 'COMMUNITY';

-- DropForeignKey
ALTER TABLE "core"."aggregate_metrics" DROP CONSTRAINT "aggregate_metrics_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "core"."aggregate_metrics" DROP CONSTRAINT "aggregate_metrics_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "core"."aggregate_metrics" DROP CONSTRAINT "aggregate_metrics_regionId_fkey";

-- DropForeignKey
ALTER TABLE "core"."aggregate_metrics" DROP CONSTRAINT "aggregate_metrics_updatedById_fkey";

-- DropTable
DROP TABLE "core"."aggregate_metrics";

-- DropEnum
DROP TYPE "core"."MetricType";

-- CreateTable
CREATE TABLE "core"."community_data" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_data_siteId_key" ON "core"."community_data"("siteId");

-- AddForeignKey
ALTER TABLE "core"."community_data" ADD CONSTRAINT "community_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
