import {
  ILeadSourceProvider,
  DiscoverySearchInput,
  DiscoveredBusinessRecord,
} from './types';
import { ProviderStatus, ProviderExecutionResult } from '@/lib/providers/provider-result';
import { globalRateLimiter } from '../rate-limiter';

const FICTIONAL_LOCALITIES = [
  'DLF Cyber City, Phase 2',
  'Sector 44 Institutional Area',
  'Golf Course Road, Sector 54',
  'Sohna Road, Sector 48',
  'Udyog Vihar Phase 4',
  'MG Road Commercial Complex',
  'Sector 29 Business Park',
  'Golf Course Extension Road, Sector 65',
];

interface ProfessionProfile {
  namePattern: (pad: string) => string;
  slug: string;
}

function getProfessionProfile(profession: string): ProfessionProfile {
  const norm = (profession || '').trim().toLowerCase();
  if (norm.includes('accountant') || norm === 'ca') {
    return {
      namePattern: (pad) => `Demo CA Firm ${pad}`,
      slug: 'ca',
    };
  }
  if (norm.includes('dentist') || norm.includes('dental')) {
    return {
      namePattern: (pad) => `Demo Dental Clinic ${pad}`,
      slug: 'dental',
    };
  }
  if (norm.includes('lawyer') || norm.includes('legal') || norm.includes('advocate')) {
    return {
      namePattern: (pad) => `Demo Law Practice ${pad}`,
      slug: 'legal',
    };
  }
  if (norm.includes('doctor') || norm.includes('clinic') || norm.includes('medical')) {
    return {
      namePattern: (pad) => `Demo Medical Clinic ${pad}`,
      slug: 'medical',
    };
  }
  if (norm.includes('architect')) {
    return {
      namePattern: (pad) => `Demo Architecture Studio ${pad}`,
      slug: 'architect',
    };
  }
  if (norm.includes('interior')) {
    return {
      namePattern: (pad) => `Demo Interior Design ${pad}`,
      slug: 'interior',
    };
  }
  if (norm.includes('real estate') || norm.includes('realt')) {
    return {
      namePattern: (pad) => `Demo Realty Group ${pad}`,
      slug: 'realty',
    };
  }
  if (norm.includes('consultant') || norm.includes('consulting')) {
    return {
      namePattern: (pad) => `Demo Consulting Group ${pad}`,
      slug: 'consulting',
    };
  }
  if (norm.includes('gym') || norm.includes('fitness')) {
    return {
      namePattern: (pad) => `Demo Fitness Center ${pad}`,
      slug: 'fitness',
    };
  }
  if (norm.includes('coaching') || norm.includes('institute') || norm.includes('academy')) {
    return {
      namePattern: (pad) => `Demo Learning Academy ${pad}`,
      slug: 'academy',
    };
  }

  // Fallback for custom/other professions
  const safeSlug = norm.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'biz';
  const cleanTitle = (profession || 'Business').trim();
  return {
    namePattern: (pad) => `Demo ${cleanTitle} Practice ${pad}`,
    slug: safeSlug,
  };
}

export class DemoLeadSourceProvider implements ILeadSourceProvider {
  id = 'demo-provider';
  name = 'Demo Business Directory Provider';
  sourceQuality = 'DEMO' as const;
  requestsPerMinute = 120;

  isConfigured(): boolean {
    return process.env.DEMO_MODE === 'true';
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      name: this.name,
      configured,
      isMock: true,
      details: configured
        ? 'Available for explicit sandbox testing. Yields clearly fictional records for selected profession.'
        : 'Disabled: DEMO_MODE is false. Production will never fabricate demo data.',
    };
  }

  async searchBusinesses(
    input: DiscoverySearchInput
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord[]>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: true,
        error: 'Lead discovery provider is not configured: DEMO_MODE is disabled in this environment.',
      };
    }

    const acquired = await globalRateLimiter.acquire(this.id, this.requestsPerMinute);
    if (!acquired) {
      return {
        success: false,
        configured: true,
        isMock: true,
        error: `Rate limit of ${this.requestsPerMinute} requests per minute reached for Demo Provider.`,
      };
    }

    const count = Math.min(Math.max(1, input.limit || 10), 50);
    const results: DiscoveredBusinessRecord[] = [];
    const prof = input.profession || 'Chartered Accountant';
    const city = input.location && input.location.trim().length > 0 ? input.location.trim() : 'Gurgaon';
    const profile = getProfessionProfile(prof);

    for (let i = 1; i <= count; i++) {
      const pad = String(i).padStart(2, '0');
      const locality =
        input.locality && input.locality.trim().length > 0
          ? input.locality.trim()
          : FICTIONAL_LOCALITIES[(i - 1) % FICTIONAL_LOCALITIES.length];

      // Simulate website variations based on preference
      let website: string | null = `https://demo-${profile.slug}-${pad}.example`;
      if (input.websitePreference === 'NO_WEBSITE') {
        website = null;
      } else if (input.websitePreference === 'POOR_OUTDATED') {
        website = `http://outdated-demo-${profile.slug}-${pad}.example`;
      } else if (input.websitePreference === 'WEBSITE_EXISTS') {
        website = `https://demo-${profile.slug}-${pad}.example`;
      } else {
        // ANY preference: 20% no website, 40% outdated, 40% normal
        if (i % 5 === 0) website = null;
      }

      // Simulate contact variations based on preference
      let email: string | null = `contact@demo-${profile.slug}-${pad}.example`;
      let phone: string | null = `+91-124-55501${pad}`;

      if (input.contactPreference === 'EMAIL_AVAILABLE') {
        email = `contact@demo-${profile.slug}-${pad}.example`;
      } else if (input.contactPreference === 'PHONE_AVAILABLE') {
        phone = `+91-124-55501${pad}`;
      }

      results.push({
        sourceRecordId: `demo-rec-${profile.slug}-${pad}`,
        businessName: profile.namePattern(pad),
        profession: prof,
        city,
        address: `Demo Suite ${100 + i}, ${locality}, ${city}`,
        website,
        publicEmail: email,
        publicPhone: phone,
        source: 'Demo Business Directory (Fictional Records)',
        sourceUrl: `https://registry.example/records/demo-${profile.slug}-${pad}`,
        sourceQuality: 'DEMO',
        isDemoData: true,
        metadata: {
          generatedAt: new Date().toISOString(),
          locality,
          isClearlyFictional: true,
        },
      });
    }

    return {
      success: true,
      configured: true,
      isMock: true,
      data: results,
    };
  }

  async getBusinessDetails(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord | null>> {
    const pad = sourceRecordId.replace(/\D/g, '').padStart(2, '0') || '01';
    return {
      success: true,
      configured: true,
      isMock: true,
      data: {
        sourceRecordId,
        businessName: `Demo CA Firm ${pad}`,
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: `Demo Suite 101, DLF Cyber City, Gurgaon`,
        website: `https://demo-ca-${pad}.example`,
        publicEmail: `contact@demo-ca-${pad}.example`,
        publicPhone: `+91-124-55501${pad}`,
        source: 'Demo Business Directory (Fictional Records)',
        sourceUrl: `https://registry.example/records/${sourceRecordId}`,
        sourceQuality: 'DEMO',
        isDemoData: true,
      },
    };
  }

  async getPublicBusinessContact(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<{ email?: string; phone?: string } | null>> {
    const pad = sourceRecordId.replace(/\D/g, '').padStart(2, '0') || '01';
    return {
      success: true,
      configured: true,
      isMock: true,
      data: {
        email: `contact@demo-ca-${pad}.example`,
        phone: `+91-124-55501${pad}`,
      },
    };
  }

  async getOfficialWebsite(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<string | null>> {
    const pad = sourceRecordId.replace(/\D/g, '').padStart(2, '0') || '01';
    return {
      success: true,
      configured: true,
      isMock: true,
      data: `https://demo-ca-${pad}.example`,
    };
  }
}
