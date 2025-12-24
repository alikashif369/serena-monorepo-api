-- CreateEnum
CREATE TYPE "core"."EntityType" AS ENUM ('ORGANIZATION', 'REGION', 'CATEGORY');

-- CreateEnum
CREATE TYPE "core"."MetricType" AS ENUM ('PLANTATION_TARGET', 'PLANTATION_ACHIEVED', 'PLANTATION_STEWARDSHIP_TARGET', 'PLANTATION_STEWARDSHIP_ACHIEVED', 'SOLAR_CAPACITY_TOTAL', 'SOLAR_PRODUCTION_ANNUAL', 'SOLAR_PRODUCTION_CUMULATIVE', 'COMMUNITY_STOVES', 'COMMUNITY_SEEDS_FODDER', 'COMMUNITY_SEEDS_KITCHEN', 'COMMUNITY_SOLAR_GEYSERS', 'WASTE_ORGANIC_TOTAL', 'WASTE_COMPOST_TOTAL', 'SEWAGE_RECOVERY_TOTAL', 'CUSTOM');

-- CreateTable
CREATE TABLE "core"."aggregate_metrics" (
    "id" SERIAL NOT NULL,
    "entityType" "core"."EntityType" NOT NULL,
    "organizationId" INTEGER,
    "regionId" INTEGER,
    "categoryId" INTEGER,
    "metricType" "core"."MetricType" NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "year" INTEGER,
    "targetValue" DOUBLE PRECISION,
    "achievedValue" DOUBLE PRECISION,
    "unit" TEXT,
    "details" JSONB,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" INTEGER,

    CONSTRAINT "aggregate_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."category_summaries" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER,
    "regionId" INTEGER,
    "categoryId" INTEGER,
    "title" TEXT,
    "summary" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" INTEGER,

    CONSTRAINT "category_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aggregate_metrics_categoryId_metricType_idx" ON "core"."aggregate_metrics"("categoryId", "metricType");

-- CreateIndex
CREATE INDEX "aggregate_metrics_regionId_metricType_idx" ON "core"."aggregate_metrics"("regionId", "metricType");

-- CreateIndex
CREATE INDEX "aggregate_metrics_organizationId_metricType_idx" ON "core"."aggregate_metrics"("organizationId", "metricType");

-- CreateIndex
CREATE UNIQUE INDEX "aggregate_metrics_entityType_organizationId_regionId_catego_key" ON "core"."aggregate_metrics"("entityType", "organizationId", "regionId", "categoryId", "metricType", "startYear", "endYear", "year");

-- AddForeignKey
ALTER TABLE "core"."aggregate_metrics" ADD CONSTRAINT "aggregate_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "core"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."aggregate_metrics" ADD CONSTRAINT "aggregate_metrics_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "core"."regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."aggregate_metrics" ADD CONSTRAINT "aggregate_metrics_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "core"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."aggregate_metrics" ADD CONSTRAINT "aggregate_metrics_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."category_summaries" ADD CONSTRAINT "category_summaries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "core"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."category_summaries" ADD CONSTRAINT "category_summaries_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "core"."regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."category_summaries" ADD CONSTRAINT "category_summaries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "core"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."category_summaries" ADD CONSTRAINT "category_summaries_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
