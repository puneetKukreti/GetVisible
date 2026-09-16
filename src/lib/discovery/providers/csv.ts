import {
  ILeadSourceProvider,
  DiscoverySearchInput,
  DiscoveredBusinessRecord,
} from './types';
import { ProviderStatus, ProviderExecutionResult } from '@/lib/providers/provider-result';

export interface CsvLeadRow {
  business_name: string;
  profession?: string;
  city?: string;
  address?: string;
  website?: string;
  business_email?: string;
  business_phone?: string;
  source?: string;
  source_url?: string;
}

export class CsvLeadSourceProvider implements ILeadSourceProvider {
  id = 'csv-provider';
  name = 'Manual CSV Import Provider';
  sourceQuality = 'USER_IMPORTED' as const;
  requestsPerMinute = 1000;

  isConfigured(): boolean {
    return true; // Always available as an authorized manual upload pathway
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      configured: true,
      isMock: false,
      details: 'Available. Allows importing verified public business data from CSV files.',
    };
  }

  /**
   * Parse raw CSV text into structured DiscoveredBusinessRecord objects.
   */
  parseCsv(csvContent: string): DiscoveredBusinessRecord[] {
    const lines = csvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      return [];
    }

    // Parse header
    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().toLowerCase().replace(/[\s"-]/g, '_'));

    const records: DiscoveredBusinessRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCsvLine(lines[i]);
      if (row.length === 0) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((header, colIndex) => {
        rowObj[header] = (row[colIndex] || '').trim();
      });

      const businessName = rowObj['business_name'] || rowObj['name'] || rowObj['firm_name'] || '';
      if (!businessName) continue;

      const profession = rowObj['profession'] || 'Chartered Accountant';
      const city = rowObj['city'] || 'Gurgaon';
      const address = rowObj['address'] || city;
      const website = rowObj['website'] || null;
      const publicEmail = rowObj['business_email'] || rowObj['email'] || null;
      const publicPhone = rowObj['business_phone'] || rowObj['phone'] || null;
      const source = rowObj['source'] || 'User Imported CSV';
      const sourceUrl = rowObj['source_url'] || 'user-import://file';

      records.push({
        sourceRecordId: `csv-row-${i}`,
        businessName,
        profession,
        city,
        address,
        website,
        publicEmail,
        publicPhone,
        source,
        sourceUrl,
        sourceQuality: 'USER_IMPORTED',
        isDemoData: false,
        metadata: {
          csvRowNumber: i + 1,
          importedAt: new Date().toISOString(),
        },
      });
    }

    return records;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  async searchBusinesses(
    _input: DiscoverySearchInput
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord[]>> {
    return {
      success: true,
      configured: true,
      isMock: false,
      data: [],
    };
  }

  async getBusinessDetails(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord | null>> {
    return {
      success: false,
      configured: true,
      isMock: false,
      error: `CSV details lookup not supported for ${sourceRecordId}`,
    };
  }

  async getPublicBusinessContact(
    _sourceRecordId: string
  ): Promise<ProviderExecutionResult<{ email?: string; phone?: string } | null>> {
    return {
      success: false,
      configured: true,
      isMock: false,
      error: 'CSV does not support live contact lookups.',
    };
  }

  async getOfficialWebsite(
    _sourceRecordId: string
  ): Promise<ProviderExecutionResult<string | null>> {
    return {
      success: false,
      configured: true,
      isMock: false,
      error: 'CSV does not support live website lookups.',
    };
  }
}
