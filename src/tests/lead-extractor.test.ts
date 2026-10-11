import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { GooglePlacesProvider } from '@/lib/discovery/providers/google-places';
import {
  escapeFormulaInjection,
  computeExportSummary,
  generateExcelWorkbook,
  generateExcelBuffer,
  generateCsvString,
  ExportLeadItem,
} from '@/lib/discovery/export-helper';
import { LeadExtractorStorage } from '@/lib/discovery/storage';

describe('Universal Business Lead Extractor', () => {
  describe('GooglePlacesProvider', () => {
    const origEnv = process.env.GOOGLE_PLACES_API_KEY;

    beforeEach(() => {
      delete process.env.GOOGLE_PLACES_API_KEY;
    });

    afterEach(() => {
      if (origEnv !== undefined) {
        process.env.GOOGLE_PLACES_API_KEY = origEnv;
      } else {
        delete process.env.GOOGLE_PLACES_API_KEY;
      }
      vi.restoreAllMocks();
    });

    it('reports not configured with clear setup instructions when API key is missing', () => {
      const provider = new GooglePlacesProvider();
      expect(provider.isConfigured()).toBe(false);

      const status = provider.getStatus();
      expect(status.configured).toBe(false);
      expect(status.details).toContain('GOOGLE_PLACES_API_KEY');
      expect(status.details).toContain('Google Cloud Console');
    });

    it('reports configured when GOOGLE_PLACES_API_KEY is provided', () => {
      process.env.GOOGLE_PLACES_API_KEY = 'test_google_places_key_12345';
      const provider = new GooglePlacesProvider();
      expect(provider.isConfigured()).toBe(true);

      const status = provider.getStatus();
      expect(status.configured).toBe(true);
      expect(status.details).toContain('official Google Places API');
    });

    it('returns informative error if searchBusinesses is called without key', async () => {
      const provider = new GooglePlacesProvider();
      const res = await provider.searchBusinesses({
        profession: 'Lawyer',
        location: 'Gurgaon',
        limit: 10,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('GOOGLE_PLACES_API_KEY');
    });

    it('parses Google Places search results and Place Details correctly', async () => {
      process.env.GOOGLE_PLACES_API_KEY = 'mock_valid_key';
      const provider = new GooglePlacesProvider();

      const mockTextSearchResponse = {
        status: 'OK',
        results: [
          {
            place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            name: 'Apex Legal Advocates',
            formatted_address: 'DLF Cyber City, Sector 24, Gurgaon, Haryana 122002, India',
            rating: 4.8,
            user_ratings_total: 54,
            types: ['lawyer', 'point_of_interest', 'establishment'],
          },
        ],
      };

      const mockDetailsResponse = {
        status: 'OK',
        result: {
          name: 'Apex Legal Advocates',
          formatted_address: 'Tower B, DLF Cyber City, Gurgaon, Haryana 122002, India',
          formatted_phone_number: '0124 429 1122',
          international_phone_number: '+91 124 429 1122',
          website: 'https://apexlegal.example.com',
          rating: 4.8,
          user_ratings_total: 54,
          address_components: [
            { long_name: 'Gurgaon', short_name: 'Gurgaon', types: ['locality'] },
            { long_name: 'Haryana', short_name: 'HR', types: ['administrative_area_level_1'] },
            { long_name: 'India', short_name: 'IN', types: ['country'] },
            { long_name: '122002', short_name: '122002', types: ['postal_code'] },
          ],
        },
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('place/textsearch/json')) {
          return Promise.resolve(new Response(JSON.stringify(mockTextSearchResponse), { status: 200 }));
        }
        if (url.includes('place/details/json')) {
          return Promise.resolve(new Response(JSON.stringify(mockDetailsResponse), { status: 200 }));
        }
        return Promise.reject(new Error('Unknown URL: ' + url));
      });

      const res = await provider.searchBusinesses({
        profession: 'Lawyer',
        category: 'Lawyers & Law Firms',
        location: 'Gurgaon',
        locality: 'DLF Cyber City',
        limit: 5,
      });

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.length).toBe(1);

      const record = res.data![0];
      expect(record.businessName).toBe('Apex Legal Advocates');
      expect(record.city).toBe('Gurgaon');
      expect(record.state).toBe('Haryana');
      expect(record.country).toBe('India');
      expect(record.postalCode).toBe('122002');
      expect(record.publicPhone).toBe('+91 124 429 1122');
      expect(record.website).toBe('https://apexlegal.example.com');
      expect(record.publicEmail).toBeNull(); // Google Places does not return email
      expect(record.emailStatus).toBe('UNAVAILABLE');
      expect(record.phoneStatus).toBe('SOURCE_CONFIRMED');
      expect(record.rating).toBe(4.8);
      expect(record.reviewCount).toBe(54);
      expect(record.source).toBe('Google Places API');
    });
  });

  describe('Excel and CSV Export Engine', () => {
    const sampleLeads: ExportLeadItem[] = [
      {
        businessName: 'Sharma & Associates',
        profession: 'Lawyer',
        publicPhone: '+91-9811122233',
        publicEmail: 'contact@sharma-legal.example',
        website: 'https://sharma-legal.example',
        address: 'Sector 14',
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
        rating: 4.9,
        reviewCount: 30,
        contactStatus: 'SOURCE_CONFIRMED',
        source: 'Bar Council Listing',
        sourceUrl: 'https://directory.example/sharma',
      },
      {
        businessName: '=HYPERLINK("http://attacker.com")', // formula injection candidate
        profession: 'Doctor',
        publicPhone: '+91-124-4061234',
        publicEmail: null,
        website: null,
        address: 'MG Road',
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
        rating: null,
        reviewCount: null,
        contactStatus: 'SOURCE_CONFIRMED',
        source: 'Medical Directory',
        sourceUrl: 'https://directory.example/doctor',
      },
    ];

    it('escapes spreadsheet formula injection attempts (CWE-1236)', () => {
      expect(escapeFormulaInjection('=cmd|/C calc')).toBe("'=cmd|/C calc");
      expect(escapeFormulaInjection('+cmd')).toBe("'+cmd");
      expect(escapeFormulaInjection('-cmd')).toBe("'-cmd");
      expect(escapeFormulaInjection('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
      expect(escapeFormulaInjection('\tcmd')).toBe("'\tcmd");
      expect(escapeFormulaInjection('Legitimate Business')).toBe('Legitimate Business');
    });

    it('computes accurate export summary metrics', () => {
      const summary = computeExportSummary(sampleLeads, {
        searchKeyword: 'Lawyers',
        searchLocation: 'Gurgaon',
        providerUsed: 'Google Places API',
      });

      expect(summary.totalRecords).toBe(2);
      expect(summary.uniqueRecords).toBe(2);
      expect(summary.recordsWithPhone).toBe(2);
      expect(summary.recordsWithWebsite).toBe(1);
      expect(summary.recordsWithEmail).toBe(1);
      expect(summary.searchKeyword).toBe('Lawyers');
      expect(summary.searchLocation).toBe('Gurgaon');
    });

    it('builds a valid 2-sheet Excel workbook with filters and frozen header', () => {
      const summary = computeExportSummary(sampleLeads, {
        searchKeyword: 'Lawyers',
        searchLocation: 'Gurgaon',
        providerUsed: 'Live Web Search',
      });

      const wb = generateExcelWorkbook(sampleLeads, summary);

      // Check sheet names
      expect(wb.SheetNames).toContain('Business Leads');
      expect(wb.SheetNames).toContain('Export Summary');

      // Check Sheet 1 (Business Leads)
      const wsLeads = wb.Sheets['Business Leads'];
      expect(wsLeads).toBeDefined();
      expect(wsLeads['!autofilter']).toBeDefined(); // AutoFilter enabled
      expect(wsLeads['!views']).toBeDefined(); // Frozen header row
      expect(wsLeads['!cols']).toBeDefined(); // Styled column widths

      // Verify formula injection candidate in cell was escaped
      const data = XLSX.utils.sheet_to_json<any>(wsLeads);
      expect(data.length).toBe(2);
      expect(data[1]['Business Name']).toBe('\'=HYPERLINK("http://attacker.com")');

      // Check Sheet 2 (Export Summary)
      const wsSummary = wb.Sheets['Export Summary'];
      expect(wsSummary).toBeDefined();
      const summaryData = XLSX.utils.sheet_to_json<any>(wsSummary);
      expect(summaryData.some((r) => r['Metric / Property'] === 'Total Records Exported')).toBe(true);
    });

    it('generates a valid binary XLSX buffer', () => {
      const summary = computeExportSummary(sampleLeads, {
        searchKeyword: 'Lawyers',
        searchLocation: 'Gurgaon',
        providerUsed: 'Live Web Search',
      });

      const buf = generateExcelBuffer(sampleLeads, summary);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(100);

      // Verify it can be parsed back by SheetJS
      const parsedWb = XLSX.read(buf, { type: 'buffer' });
      expect(parsedWb.SheetNames).toEqual(['Business Leads', 'Export Summary']);
    });

    it('generates safely escaped CSV output', () => {
      const csv = generateCsvString(sampleLeads);
      expect(typeof csv).toBe('string');
      expect(csv).toContain('"Business Name","Category"');
      expect(csv).toContain('Sharma & Associates');
      // Escaped formula character
      expect(csv).toContain('\'=HYPERLINK');
    });
  });

  describe('LeadExtractorStorage (Saved Searches & Export History)', () => {
    const testOrgId = 'test-org-storage-' + Date.now();

    it('creates, lists, updates, and deletes saved search configurations', () => {
      // 1. Create
      const created = LeadExtractorStorage.createSavedSearch(testOrgId, {
        name: 'Gyms in South Delhi',
        category: 'Gyms & Fitness Centers',
        location: 'South Delhi',
        limit: 50,
        providerId: 'live-search',
        fieldsToCollect: ['name', 'phone', 'website', 'address'],
        exportFormat: 'XLSX',
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Gyms in South Delhi');
      expect(created.organizationId).toBe(testOrgId);

      // 2. List
      const list = LeadExtractorStorage.listSavedSearches(testOrgId);
      expect(list.some((s) => s.id === created.id)).toBe(true);

      // 3. Update
      const updated = LeadExtractorStorage.updateSavedSearch(testOrgId, created.id, {
        name: 'Updated Gym Search',
        lastRunAt: new Date().toISOString(),
      });
      expect(updated?.name).toBe('Updated Gym Search');

      // 4. Delete
      const deleted = LeadExtractorStorage.deleteSavedSearch(testOrgId, created.id);
      expect(deleted).toBe(true);

      const afterDelete = LeadExtractorStorage.listSavedSearches(testOrgId);
      expect(afterDelete.some((s) => s.id === created.id)).toBe(false);
    });

    it('records, lists, and deletes export history records', () => {
      const recorded = LeadExtractorStorage.recordExport(testOrgId, {
        fileName: 'test_leads_export.xlsx',
        format: 'XLSX',
        rowCount: 42,
        searchKeyword: 'Real Estate Agents',
        searchLocation: 'Noida',
        providerUsed: 'Google Places API',
      });

      expect(recorded.id).toBeDefined();
      expect(recorded.rowCount).toBe(42);

      const history = LeadExtractorStorage.listExportHistory(testOrgId);
      expect(history.some((h) => h.id === recorded.id)).toBe(true);

      const deleted = LeadExtractorStorage.deleteExportHistory(testOrgId, recorded.id);
      expect(deleted).toBe(true);

      const afterDelete = LeadExtractorStorage.listExportHistory(testOrgId);
      expect(afterDelete.some((h) => h.id === recorded.id)).toBe(false);
    });
  });
});
