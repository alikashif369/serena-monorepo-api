/*
  Warnings:

  - You are about to alter the column `geom` on the `site_boundaries` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Unsupported("geometry(Geometry,4326)")`.

*/

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- AlterTable
ALTER TABLE "spatial"."site_boundaries" ALTER COLUMN "geom" SET DATA TYPE geometry(Geometry,4326);
