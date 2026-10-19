-- Per-industry design blueprints used by the demo generator.
-- Authored once per industry key (see src/lib/demos/industry-blueprint.ts) and
-- reused by every demo in that trade so designs stay deterministic.
CREATE TABLE "industry_blueprints" (
    "key" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "blueprint" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'deterministic',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_blueprints_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "industry_blueprints_createdAt_idx" ON "industry_blueprints"("createdAt");
