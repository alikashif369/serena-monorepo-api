-- CreateTable
CREATE TABLE "Raster" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/tiff',
    "minioUrl" TEXT NOT NULL,
    "minioKey" TEXT NOT NULL,
    "bbox" JSONB NOT NULL,
    "crs" TEXT NOT NULL DEFAULT 'EPSG:4326',
    "width" INTEGER,
    "height" INTEGER,
    "bandCount" INTEGER NOT NULL DEFAULT 1,
    "isClassified" BOOLEAN NOT NULL DEFAULT false,
    "classifications" JSONB,
    "siteId" INTEGER,
    "siteName" TEXT,
    "acquisitionDate" TIMESTAMP(3),
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" INTEGER NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Raster_minioUrl_key" ON "Raster"("minioUrl");

-- CreateIndex
CREATE INDEX "Raster_siteId_idx" ON "Raster"("siteId");

-- CreateIndex
CREATE INDEX "Raster_uploadedById_idx" ON "Raster"("uploadedById");

-- CreateIndex
CREATE INDEX "Raster_isClassified_idx" ON "Raster"("isClassified");

-- CreateIndex
CREATE INDEX "Raster_acquisitionDate_idx" ON "Raster"("acquisitionDate");
