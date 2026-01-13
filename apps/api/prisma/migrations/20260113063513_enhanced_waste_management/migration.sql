-- AlterTable
ALTER TABLE "core"."waste_data" ADD COLUMN     "co2Equivalent" DOUBLE PRECISION,
ADD COLUMN     "compostQuality" TEXT,
ADD COLUMN     "dataSource" TEXT,
ADD COLUMN     "disposalMethod" TEXT,
ADD COLUMN     "inorganicWaste" DOUBLE PRECISION,
ADD COLUMN     "landfillDiverted" DOUBLE PRECISION,
ADD COLUMN     "methaneSaved" DOUBLE PRECISION,
ADD COLUMN     "monthlyData" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rawMeatWaste" DOUBLE PRECISION,
ADD COLUMN     "recoveryRatio" DOUBLE PRECISION,
ADD COLUMN     "recyclingRate" DOUBLE PRECISION,
ADD COLUMN     "totalWaste" DOUBLE PRECISION;
