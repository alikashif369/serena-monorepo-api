/*
  Warnings:

  - The primary key for the `species` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[code]` on the table `species` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scientificName]` on the table `species` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scientificName` to the `species` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `species` table without a default value. This is not possible if the table is not empty.
  - Made the column `localName` on table `species` required. This step will fail if there are existing NULL values in that column.
  - Made the column `englishName` on table `species` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `species` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uses` on table `species` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "spatial"."PhotoCategory" AS ENUM ('EVENT', 'SITE', 'SPECIES');

-- AlterTable
ALTER TABLE "core"."species" DROP CONSTRAINT "species_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "image1Url" TEXT,
ADD COLUMN     "image2Url" TEXT,
ADD COLUMN     "image3Url" TEXT,
ADD COLUMN     "image4Url" TEXT,
ADD COLUMN     "scientificName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "botanicalName" DROP NOT NULL,
ALTER COLUMN "localName" SET NOT NULL,
ALTER COLUMN "englishName" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "uses" SET NOT NULL,
ADD CONSTRAINT "species_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "spatial"."photos" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "minioUrl" TEXT NOT NULL,
    "minioKey" TEXT NOT NULL,
    "category" "spatial"."PhotoCategory" NOT NULL DEFAULT 'EVENT',
    "siteId" INTEGER,
    "speciesId" INTEGER,
    "year" INTEGER,
    "captureDate" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "caption" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "uploadedById" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."sites_species" (
    "siteId" INTEGER NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "plantedCount" INTEGER,
    "plantedYear" INTEGER,

    CONSTRAINT "sites_species_pkey" PRIMARY KEY ("siteId","speciesId")
);

-- CreateIndex
CREATE UNIQUE INDEX "photos_minioUrl_key" ON "spatial"."photos"("minioUrl");

-- CreateIndex
CREATE INDEX "photos_siteId_year_category_idx" ON "spatial"."photos"("siteId", "year", "category");

-- CreateIndex
CREATE INDEX "photos_speciesId_idx" ON "spatial"."photos"("speciesId");

-- CreateIndex
CREATE INDEX "photos_uploadedById_idx" ON "spatial"."photos"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "species_code_key" ON "core"."species"("code");

-- CreateIndex
CREATE UNIQUE INDEX "species_scientificName_key" ON "core"."species"("scientificName");

-- AddForeignKey
ALTER TABLE "spatial"."photos" ADD CONSTRAINT "photos_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spatial"."photos" ADD CONSTRAINT "photos_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "core"."species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spatial"."photos" ADD CONSTRAINT "photos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."sites_species" ADD CONSTRAINT "sites_species_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "core"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."sites_species" ADD CONSTRAINT "sites_species_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "core"."species"("id") ON DELETE CASCADE ON UPDATE CASCADE;
