-- Downloaded industry imagery (Openverse/CC photos) self-hosted for publicity demos.
CREATE TABLE "demo_media" (
    "id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sourceUrl" TEXT,
    "attribution" TEXT,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "demo_media_createdAt_idx" ON "demo_media"("createdAt");

-- One stored copy per origin photo, even when serverless instances generate the
-- same industry demo concurrently (PostgreSQL allows many NULL sourceUrls).
CREATE UNIQUE INDEX "demo_media_sourceUrl_key" ON "demo_media"("sourceUrl");
