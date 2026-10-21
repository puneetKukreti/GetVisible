import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository, OutreachQueueRepository } from '@/lib/db/repository';
import { checkOutreachEligibility } from '@/lib/compliance';
import { createAuditLogEntry } from '@/lib/audit';

export const dynamic = 'force-dynamic';
// Process a small batch per invocation to keep paced sends and stay within
// serverless time limits. Vercel cron drives this every few minutes.
export const maxDuration = 60;

const BATCH_SIZE = 5;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results: { id: string; leadId: string; outcome: string; error?: string }[] = [];

  try {
    const due = await OutreachQueueRepository.getDue(undefined, BATCH_SIZE);

    for (const item of due) {
      const lead = await LeadRepository.getLeadById(item.leadId, item.organizationId);
      if (!lead) {
        await OutreachQueueRepository.markFailed(item.id, item.organizationId, 'Lead not found');
        results.push({ id: item.id, leadId: item.leadId, outcome: 'failed', error: 'Lead not found' });
        continue;
      }

      // Compliance gate (suppression / opt-out / DO_NOT_CONTACT)
      const eligibility = checkOutreachEligibility(
        lead,
        item.channel,
        true,
        lead.suppressionRecords || [],
        lead.consentRecords || []
      );
      if (!eligibility.allowed) {
        await OutreachQueueRepository.markSuppressed(item.id, item.organizationId, eligibility.reason || 'Blocked by compliance');
        results.push({ id: item.id, leadId: item.leadId, outcome: 'suppressed', error: eligibility.reason });
        continue;
      }

      // Mark sending
      // (No separate SENDING state transition needed; markSent/markFailed cover outcomes.)

      const apiUrl = process.env.WHATSAPP_API_URL;
      const apiToken = process.env.WHATSAPP_API_TOKEN;

      if (item.channel === 'WHATSAPP' && apiUrl && apiToken) {
        try {
          const dispatchRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: lead.publicPhone,
              imageUrl: item.screenshotUrl,
              caption: item.message,
            }),
          });
          if (!dispatchRes.ok) {
            const errText = await dispatchRes.text().catch(() => '');
            throw new Error(`WhatsApp API error (${dispatchRes.status}): ${errText}`);
          }
          await LeadRepository.updateLeadStatus(item.leadId, 'CONTACTED', item.organizationId, 'Outreach Queue', 'Dispatched via cron flusher', 'WHATSAPP');
          await OutreachQueueRepository.markSent(item.id, item.organizationId);
          createAuditLogEntry({
            action: 'OUTREACH_APPROVED',
            entity: 'Lead',
            entityId: item.leadId,
            actor: 'Outreach Queue (cron)',
            organizationId: item.organizationId,
            details: { channel: item.channel, mode: item.mode, queueId: item.id },
          });
          results.push({ id: item.id, leadId: item.leadId, outcome: 'sent' });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          await OutreachQueueRepository.markFailed(item.id, item.organizationId, msg);
          results.push({ id: item.id, leadId: item.leadId, outcome: 'failed', error: msg });
        }
      } else {
        // No automated transport configured (WEB_ASSISTED mode): do not pretend
        // a send happened. Leave the item READY so the dashboard can drive the
        // manual clipboard flow, but record that the flusher could not dispatch.
        await OutreachQueueRepository.markFailed(item.id, item.organizationId, 'No automated transport configured (WHATSAPP_API_URL/TOKEN missing)');
        results.push({ id: item.id, leadId: item.leadId, outcome: 'not_dispatched', error: 'No automated transport configured' });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Flush failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
