import { describe, it } from 'vitest';
import { LiveWebSearchProvider } from '@/lib/discovery/providers/live-search';

describe('Inspect Live Output', () => {
  it('inspects output', async () => {
    const provider = new LiveWebSearchProvider();
    const result = await provider.searchBusinesses({
      profession: 'Chartered Accountant',
      location: 'Gurgaon',
      limit: 5,
    });
    console.log('Result success:', result.success);
    console.log('Count:', result.data?.length);
    result.data?.forEach((d, i) => {
      console.log(`[${i+1}] Name: ${d.businessName}`);
      console.log(`    Contact Name: ${d.contactName}`);
      console.log(`    Phone: ${d.publicPhone}`);
      console.log(`    Email: ${d.publicEmail}`);
      console.log(`    Website: ${d.website}`);
      console.log(`    Source: ${d.sourceUrl}`);
      console.log(`    Status: ${d.contactStatus}`);
    });
  });
});
