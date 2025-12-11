-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "spatial";

-- CreateEnum
CREATE TYPE "auth"."UserRole" AS ENUM ('VIEWER', 'SITE_MANAGER', 'GIS_ANALYST', 'DATA_ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "auth"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "core"."CategoryType" AS ENUM ('PLANTATION', 'SOLAR', 'COMMUNITY', 'WASTE', 'SEWAGE', 'RESTORATION');

-- CreateEnum
CREATE TYPE "core"."SiteType" AS ENUM ('HOTEL', 'PLANTATION', 'SOLAR_INSTALLATION', 'COMMUNITY_INITIATIVE', 'WASTE_FACILITY', 'SEWAGE_PLANT', 'CONSERVATION');

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "auth"."UserRole" NOT NULL DEFAULT 'VIEWER',
    "status" "auth"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "emailVerificationCode" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "pfpId" TEXT,
    "fileUrl" TEXT,
    "assignedSites" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."reset_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiry" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."device_info" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "device_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."regions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "core"."CategoryType" NOT NULL,
    "regionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."sub_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."sites" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "subCategoryId" INTEGER,
    "district" TEXT,
    "city" TEXT,
    "area" DOUBLE PRECISION,
    "coordinates" JSONB,
    "siteType" "core"."SiteType" NOT NULL,
    "infrastructure" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."yearly_metrics" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "treeCanopy" DOUBLE PRECISION,
    "greenArea" DOUBLE PRECISION,
    "barrenLand" DOUBLE PRECISION,
    "wetLand" DOUBLE PRECISION,
    "snow" DOUBLE PRECISION,
    "rock" DOUBLE PRECISION,
    "water" DOUBLE PRECISION,
    "buildup" DOUBLE PRECISION,
    "solarPanels" DOUBLE PRECISION,
    "baseRasterId" INTEGER,
    "classifiedRasterId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yearly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."plantation_data" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "plants" INTEGER NOT NULL,
    "species" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantation_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."solar_data" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "installationYear" INTEGER NOT NULL,
    "capacityKwh" DOUBLE PRECISION NOT NULL,
    "quarterlyProduction" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solar_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."waste_data" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "organicWaste" DOUBLE PRECISION NOT NULL,
    "compostReceived" DOUBLE PRECISION NOT NULL,
    "methaneRecovered" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waste_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."sewage_data" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "recoveryRatio" DOUBLE PRECISION NOT NULL,
    "methaneSaved" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sewage_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."species" (
    "code" TEXT NOT NULL,
    "botanicalName" TEXT NOT NULL,
    "localName" TEXT,
    "englishName" TEXT,
    "description" TEXT,
    "uses" TEXT,
    "imagePath" TEXT,

    CONSTRAINT "species_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "spatial"."site_boundaries" (
    "id" TEXT NOT NULL,
    "siteId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "geometry" JSONB NOT NULL,
    "geom" TEXT,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "site_boundaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spatial"."rasters" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT,
    "minioUrl" TEXT NOT NULL,
    "minioKey" TEXT NOT NULL,
    "bbox" JSONB,
    "crs" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bandCount" INTEGER,
    "isClassified" BOOLEAN NOT NULL DEFAULT false,
    "classifications" JSONB,
    "year" INTEGER NOT NULL,
    "acquisitionDate" TIMESTAMP(3),
    "uploadedById" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rasters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reset_tokens_token_key" ON "auth"."reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "core"."organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "regions_organizationId_slug_key" ON "core"."regions"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_regionId_slug_key" ON "core"."categories"("regionId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_categoryId_slug_key" ON "core"."sub_categories"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "sites_categoryId_idx" ON "core"."sites"("categoryId");

-- CreateIndex
CREATE INDEX "sites_subCategoryId_idx" ON "core"."sites"("subCategoryId");

-- CreateIndex
CREATE INDEX "sites_siteType_idx" ON "core"."sites"("siteType");

-- CreateIndex
CREATE UNIQUE INDEX "sites_categoryId_slug_key" ON "core"."sites"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "yearly_metrics_siteId_year_idx" ON "core"."yearly_metrics"("siteId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "yearly_metrics_siteId_year_key" ON "core"."yearly_metrics"("siteId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "plantation_data_siteId_key" ON "core"."plantation_data"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "solar_data_siteId_key" ON "core"."solar_data"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "waste_data_siteId_year_key" ON "core"."waste_data"("siteId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "sewage_data_siteId_year_key" ON "core"."sewage_data"("siteId", "year");

-- CreateIndex
CREATE INDEX "site_boundaries_siteId_year_idx" ON "spatial"."site_boundaries"("siteId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "site_boundaries_siteId_year_key" ON "spatial"."site_boundaries"("siteId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "rasters_minioUrl_key" ON "spatial"."rasters"("minioUrl");

-- CreateIndex
CREATE INDEX "rasters_siteId_year_isClassified_idx" ON "spatial"."rasters"("siteId", "year", "isClassified");

-- CreateIndex
CREATE INDEX "rasters_uploadedById_idx" ON "spatial"."rasters"("uploadedById");

-- AddForeignKey
ALTER TABLE "auth"."reset_tokens" ADD CONSTRAINT "reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."device_info" ADD CONSTRAINT "device_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."regions" ADD CONSTRAINT "regions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "core"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."categories" ADD CONSTRAINT "categories_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "core"."regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."sub_categories" ADD CONSTRAINT "sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "core"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."sites" ADD CONSTRAINT "sites_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "core"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."sites" ADD CONSTRAINT "sites_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "core"."sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."yearly_metrics" ADD CONSTRAINT "yearly_metrics_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."yearly_metrics" ADD CONSTRAINT "yearly_metrics_baseRasterId_fkey" FOREIGN KEY ("baseRasterId") REFERENCES "spatial"."rasters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."yearly_metrics" ADD CONSTRAINT "yearly_metrics_classifiedRasterId_fkey" FOREIGN KEY ("classifiedRasterId") REFERENCES "spatial"."rasters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."plantation_data" ADD CONSTRAINT "plantation_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."solar_data" ADD CONSTRAINT "solar_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."waste_data" ADD CONSTRAINT "waste_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."sewage_data" ADD CONSTRAINT "sewage_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spatial"."site_boundaries" ADD CONSTRAINT "site_boundaries_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spatial"."rasters" ADD CONSTRAINT "rasters_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spatial"."rasters" ADD CONSTRAINT "rasters_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
