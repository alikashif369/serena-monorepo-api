/*
  Warnings:

  - Made the column `image1Url` on table `species` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image2Url` on table `species` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image3Url` on table `species` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image4Url` on table `species` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "core"."species" ALTER COLUMN "image1Url" SET NOT NULL,
ALTER COLUMN "image2Url" SET NOT NULL,
ALTER COLUMN "image3Url" SET NOT NULL,
ALTER COLUMN "image4Url" SET NOT NULL;
