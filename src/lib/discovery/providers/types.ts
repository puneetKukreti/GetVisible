import { SourceQuality } from '@/types';
import { ProviderStatus, ProviderExecutionResult } from '@/lib/providers/provider-result';

export interface DiscoverySearchInput {
  profession: string;
  location: string;
  locality?: string;
  limit: number;
  websitePreference?: 'ANY' | 'NO_WEBSITE' | 'WEBSITE_EXISTS' | 'POOR_OUTDATED';
  contactPreference?: 'EITHER' | 'EMAIL_AVAILABLE' | 'PHONE_AVAILABLE';
  providerId?: string;
  useDemoProvider?: boolean;
}

export type ContactDataStatus = 'VERIFIED' | 'SOURCE_CONFIRMED' | 'FOUND' | 'UNAVAILABLE';

export interface DiscoveredBusinessRecord {
  sourceRecordId: string;
  businessName: string;
  contactName?: string | null;
  profession: string;
  city: string;
  address: string;
  website?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  contactStatus?: ContactDataStatus;
  emailStatus?: 'SOURCE_CONFIRMED' | 'UNAVAILABLE';
  phoneStatus?: 'SOURCE_CONFIRMED' | 'UNAVAILABLE';
  retrievedAt?: string;
  source: string;
  sourceUrl: string;
  sourceQuality: SourceQuality;
  isDemoData: boolean;
  metadata?: Record<string, unknown>;
}

export interface ILeadSourceProvider {
  id: string;
  name: string;
  sourceQuality: SourceQuality;
  requestsPerMinute: number;

  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  searchBusinesses(input: DiscoverySearchInput): Promise<ProviderExecutionResult<DiscoveredBusinessRecord[]>>;
  getBusinessDetails(sourceRecordId: string): Promise<ProviderExecutionResult<DiscoveredBusinessRecord | null>>;
  getPublicBusinessContact(sourceRecordId: string): Promise<ProviderExecutionResult<{ email?: string; phone?: string } | null>>;
  getOfficialWebsite(sourceRecordId: string): Promise<ProviderExecutionResult<string | null>>;
}
