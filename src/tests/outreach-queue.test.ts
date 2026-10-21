import { describe, it, expect, beforeEach } from 'vitest';
import { OutreachQueueRepository } from '@/lib/db/repository';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('Outreach queue (draft-approve-send)', () => {
  let leadId: string;

  beforeEach(async () => {
    const { leads } = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID, { pageSize: 5 });
    leadId = leads[0].id;
    // Clear any leftover queue items for isolation
    const existing = await OutreachQueueRepository.list(DEMO_ORGANIZATION_ID);
    for (const item of existing) {
      await OutreachQueueRepository.cancel(item.id, DEMO_ORGANIZATION_ID);
    }
  });

  it('enqueues a MANUAL item as DRAFT', async () => {
    const item = await OutreachQueueRepository.enqueue(DEMO_ORGANIZATION_ID, {
      leadId,
      mode: 'MANUAL',
      message: 'Hi there',
    });
    expect(item.status).toBe('DRAFT');
    expect(item.mode).toBe('MANUAL');
    expect(item.message).toBe('Hi there');
  });

  it('enqueues an AUTO item as READY and schedules it now', async () => {
    const item = await OutreachQueueRepository.enqueue(DEMO_ORGANIZATION_ID, {
      leadId,
      mode: 'AUTO',
      message: 'Auto hi',
    });
    expect(item.status).toBe('READY');
    expect(item.scheduledAt).toBeTruthy();
  });

  it('lists items filtered by status', async () => {
    await OutreachQueueRepository.enqueue(DEMO_ORGANIZATION_ID, { leadId, mode: 'MANUAL', message: 'd1' });
    await OutreachQueueRepository.enqueue(DEMO_ORGANIZATION_ID, { leadId, mode: 'AUTO', message: 'a1' });

    const drafts = await OutreachQueueRepository.list(DEMO_ORGANIZATION_ID, { status: 'DRAFT' });
    const ready = await OutreachQueueRepository.list(DEMO_ORGANIZATION_ID, { status: 'READY' });
    expect(drafts.length).toBeGreaterThanOrEqual(1);
    expect(ready.length).toBeGreaterThanOrEqual(1);
  });

  it('approves a DRAFT into a READY item', async () => {
    const item = await OutreachQueueRepository.enqueue(DEMO_ORGANIZATION_ID, { leadId, mode: 'MANUAL', message: 'to approve' });
    const approved = await OutreachQueueRepository.approve(item.id, DEMO_ORGANIZATION_ID, 'Owner');
    expect(approved?.status).toBe('READY');
    expect(approved?.approvedBy).toBe('Owner');
    expect(approved?.approvedAt).toBeTruthy();
  });

  it('cancels an item (non-SENT)', async () => {
    const item = await OutreachQueueRepository.enqueue(DEMO_ORGANIZATION_ID, { leadId, mode: 'MANUAL', message: 'to cancel' });
    const cancelled = await OutreachQueueRepository.cancel(item.id, DEMO_ORGANIZATION_ID);
    expect(cancelled?.status).toBe('CANCELLED');
  });

  it('getDue returns READY items scheduled now', async () => {
    await OutreachQueueRepository.enqueue(DEMO_ORGANIZATION_ID, { leadId, mode: 'AUTO', message: 'due now' });
    const due = await OutreachQueueRepository.getDue(DEMO_ORGANIZATION_ID);
    expect(due.length).toBeGreaterThanOrEqual(1);
    expect(due.every((i) => i.status === 'READY')).toBe(true);
  });

  it('markSent transitions to SENT', async () => {
    const item = await OutreachQueueRepository.enqueue(DEMO_ORGANIZATION_ID, { leadId, mode: 'AUTO', message: 'send me' });
    await OutreachQueueRepository.markSent(item.id, DEMO_ORGANIZATION_ID);
    const fetched = await OutreachQueueRepository.get(item.id, DEMO_ORGANIZATION_ID);
    expect(fetched?.status).toBe('SENT');
    expect(fetched?.sentAt).toBeTruthy();
  });
});
