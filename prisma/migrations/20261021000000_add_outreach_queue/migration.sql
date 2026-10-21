-- Outreach send queue: draft -> approved/queued -> sent, with audit + suppression.
-- Backs the approval-gate workflow (see src/lib/sales/outreach-queue.ts).
CREATE TABLE "outreach_queue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "demoId" TEXT,
    "channel" "Channel" NOT NULL DEFAULT 'WHATSAPP',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "mode" TEXT NOT NULL DEFAULT 'MANUAL',
    "message" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "outreach_queue_organizationId_idx" ON "outreach_queue"("organizationId");
CREATE INDEX "outreach_queue_status_idx" ON "outreach_queue"("status");
CREATE INDEX "outreach_queue_scheduledAt_idx" ON "outreach_queue"("scheduledAt");
CREATE INDEX "outreach_queue_leadId_idx" ON "outreach_queue"("leadId");

ALTER TABLE "outreach_queue" ADD CONSTRAINT "outreach_queue_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "outreach_queue" ADD CONSTRAINT "outreach_queue_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;