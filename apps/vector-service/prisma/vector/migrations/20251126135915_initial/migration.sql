-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "vector_layers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "geometry" JSONB NOT NULL,
    "geom" geometry(Geometry,4326),
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "vector_layers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vector_layers_userId_idx" ON "vector_layers"("userId");

-- CreateIndex
CREATE INDEX "vector_layers_name_idx" ON "vector_layers"("name");

-- CreateIndex
CREATE INDEX "vector_layers_geom_idx" ON "vector_layers" USING GIST ("geom");

-- CreateIndex
CREATE INDEX "vector_layers_deletedAt_idx" ON "vector_layers"("deletedAt");
