import {
  LeadData,
  LeadFilterParams,
  PaginatedLeads,
  DashboardMetrics,
  LeadStatus,
  AuditLogData,
  JobData,
  SuppressionRecordData,
  ConsentRecordData,
  Channel,
  WebsiteDemoData,
  LeadNoteData,
  ActivityData,
} from '@/types';
import {
  INITIAL_DEMO_LEADS,
  INITIAL_DEMO_JOBS,
  INITIAL_DEMO_AUDIT_LOGS,
  DEMO_ORGANIZATION_ID,
  isExplicitDemoMode,
} from './demo-data';
import { createAuditLogEntry } from '../audit';
import { validateStatusTransition } from '../sales/lifecycle';
import { generatePublicDemoToken } from '../demos/public';

export class DatabaseConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

// In-memory demo store scoped strictly per organization when DEMO_MODE=true
class DemoDataStore {
  private leads: Map<string, LeadData[]> = new Map();
  private jobs: Map<string, JobData[]> = new Map();
  private auditLogs: Map<string, AuditLogData[]> = new Map();
  private suppressionRecords: Map<string, SuppressionRecordData[]> = new Map();
  private consentRecords: Map<string, ConsentRecordData[]> = new Map();
  private demos: Map<string, WebsiteDemoData[]> = new Map();

  constructor() {
    this.initializeDemoOrg();
  }

  private initializeDemoOrg() {
    this.leads.set(DEMO_ORGANIZATION_ID, JSON.parse(JSON.stringify(INITIAL_DEMO_LEADS)));
    this.jobs.set(DEMO_ORGANIZATION_ID, JSON.parse(JSON.stringify(INITIAL_DEMO_JOBS)));
    this.auditLogs.set(DEMO_ORGANIZATION_ID, JSON.parse(JSON.stringify(INITIAL_DEMO_AUDIT_LOGS)));
    
    // Extract initial suppressions
    const initialSuppressions: SuppressionRecordData[] = [];
    INITIAL_DEMO_LEADS.forEach((lead) => {
      if (lead.suppressionRecords) {
        initialSuppressions.push(...lead.suppressionRecords);
      }
    });
    this.suppressionRecords.set(DEMO_ORGANIZATION_ID, initialSuppressions);
    this.consentRecords.set(DEMO_ORGANIZATION_ID, []);

    // Seed initial demo for demo-lead-003 (Example Accounting Services)
    const seedDemo: WebsiteDemoData = {
      id: 'demo-lead-003-v1',
      leadId: 'demo-lead-003',
      organizationId: DEMO_ORGANIZATION_ID,
      templateId: 'CA_ACCOUNTING_PROFESSIONAL',
      version: 1,
      generationStatus: 'COMPLETED',
      approvalStatus: 'APPROVED',
      publicToken: 'demo-public-003',
      viewCount: 0,
      firstViewedAt: null,
      lastViewedAt: null,
      theme: {
        id: 'executive-navy',
        name: 'Executive Navy',
        primaryColor: '#1e3a8a',
        secondaryColor: '#1e293b',
        accentColor: '#2563eb',
        fontFamily: 'sans',
        style: 'corporate',
        borderRadius: 'md',
      },
      content: {
        meta: {
          title: 'Example Accounting Services | Chartered Accountants in Gurgaon',
          description: 'Dedicated chartered accountancy practice in Gurgaon providing statutory audit, corporate taxation, and GST advisory.',
          profession: 'Chartered Accountant',
          templateId: 'CA_ACCOUNTING_PROFESSIONAL',
        },
        brand: {
          businessName: 'Example Accounting Services',
          tagline: 'Professional Chartered Accountancy & Tax Advisory in Gurgaon',
          provenance: 'VERIFIED_LEAD',
        },
        theme: {
          id: 'executive-navy',
          name: 'Executive Navy',
          primaryColor: '#1e3a8a',
          secondaryColor: '#1e293b',
          accentColor: '#2563eb',
          fontFamily: 'sans',
          style: 'corporate',
          borderRadius: 'md',
        },
        navigation: {
          items: [
            { label: 'Home', href: '#hero' },
            { label: 'About', href: '#about' },
            { label: 'Services', href: '#services' },
            { label: 'Why Us', href: '#why-choose-us' },
            { label: 'FAQ', href: '#faq' },
            { label: 'Contact', href: '#contact' },
          ],
          ctaText: 'Inquire Now',
          ctaHref: '#contact',
        },
        hero: {
          badge: 'Chartered Accountancy & Advisory',
          headline: 'Modern Financial Clarity & Compliance for Growing Businesses',
          subheadline: 'Dedicated chartered accountancy practice in Gurgaon providing statutory audit, corporate taxation, GST advisory, and strategic financial guidance.',
          primaryCta: { label: 'Schedule Consultation', href: '#contact' },
          secondaryCta: { label: 'View Practice Areas', href: '#services' },
          provenance: 'NEUTRAL_PLACEHOLDER',
        },
        about: {
          title: 'About Our Practice',
          leadParagraph: 'Example Accounting Services is a chartered accountancy practice based in Gurgaon, providing comprehensive tax, audit, and regulatory advisory.',
          body: 'We partner with corporate entities, family enterprises, and emerging ventures to maintain rigorous statutory compliance and optimize financial operations.',
          highlights: [
            { title: 'Regulatory Precision', description: 'Methodical alignment with current Indian accounting standards.' },
            { title: 'Strict Confidentiality', description: 'Rigorous data protocols safeguarding corporate financial records.' },
            { title: 'Ethical Governance', description: 'Uncompromising integrity and adherence to statutory codes of conduct.' },
            { title: 'Proactive Advisory', description: 'Clear milestone schedules and proactive compliance calendars.' },
          ],
          provenance: 'NEUTRAL_PLACEHOLDER',
        },
        services: {
          sectionTitle: 'Practice Areas & Services',
          sectionSubtitle: 'Comprehensive accounting, audit, and tax solutions tailored to corporate requirements.',
          items: [
            { id: 'srv-1', title: 'Corporate Tax Compliance & Planning', description: 'Direct tax planning, advance tax computations, and representation before revenue authorities.', isConfirmed: false, provenance: 'NEUTRAL_PLACEHOLDER' },
            { id: 'srv-2', title: 'Statutory Audit & Assurance', description: 'Independent examination of financial statements under Companies Act guidelines.', isConfirmed: false, provenance: 'NEUTRAL_PLACEHOLDER' },
            { id: 'srv-3', title: 'GST Advisory & Return Filings', description: 'Monthly and quarterly GST return filing, input tax credit reconciliation, and audit representation.', isConfirmed: false, provenance: 'NEUTRAL_PLACEHOLDER' },
            { id: 'srv-4', title: 'Transfer Pricing & International Tax', description: 'Documentation, benchmarking studies, and cross-border transaction compliance.', isConfirmed: false, provenance: 'NEUTRAL_PLACEHOLDER' },
          ],
        },
        whyChooseUs: {
          sectionTitle: 'Why Choose Our Practice',
          sectionSubtitle: 'Core commitments that define our client engagements.',
          points: [
            { title: 'Direct Partner Attention', description: 'Engagements are directly overseen by experienced chartered accountants.', iconName: 'UserCheck' },
            { title: 'Regulatory Accuracy', description: 'Meticulous adherence to current Indian accounting standards and tax guidelines.', iconName: 'CheckCircle2' },
            { title: 'Confidentiality & Data Security', description: 'Strict security protocols protecting your corporate financial records.', iconName: 'Lock' },
            { title: 'Transparent Communication', description: 'Clear milestone schedules and straightforward explanations.', iconName: 'Clock' },
          ],
        },
        industries: {
          enabled: true,
          sectionTitle: 'Industries We Support',
          items: ['Technology & Software Services', 'Manufacturing & Supply Chain', 'Real Estate & Infrastructure', 'Healthcare & Life Sciences'],
        },
        testimonials: {
          enabled: false,
          sectionTitle: 'Client Testimonials',
          items: [
            { quote: 'Client testimonials can be displayed here following formal verification and written consent.', author: 'Verified Client Placeholder', role: 'Corporate Partner', isPlaceholder: true },
          ],
        },
        faq: {
          sectionTitle: 'Frequently Asked Questions',
          items: [
            { question: 'How do we get started with your accounting services?', answer: 'You can initiate contact through our inquiry form or direct phone line.' },
            { question: 'Do you provide end-to-end GST support?', answer: 'Yes, we handle recurring GST return filings, annual reconciliation, and audit representation.' },
          ],
        },
        contact: {
          sectionTitle: 'Connect With Our Team',
          sectionSubtitle: 'Reach out to schedule an introductory consultation regarding your accounting requirements.',
          formTitle: 'Send a Message',
          simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
          publicEmail: 'inquiries@example-accounting.example',
          publicPhone: '+91-124-5550103',
          ctaSubmitText: 'Submit Message (Simulated)',
        },
        location: {
          address: 'Sector 44 Institutional Area, Gurgaon, Haryana 122003',
          city: 'Gurgaon',
          officeHours: 'Monday – Friday: 9:30 AM – 6:30 PM IST',
          mapPlaceholder: true,
        },
        footer: {
          copyright: `© ${new Date().getFullYear()} Example Accounting Services. All rights reserved.`,
          disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for review and evaluation.',
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    };
    this.demos.set(DEMO_ORGANIZATION_ID, [seedDemo]);
  }

  getOrgLeads(orgId: string): LeadData[] {
    if (!this.leads.has(orgId)) {
      this.leads.set(orgId, []);
    }
    return this.leads.get(orgId)!;
  }

  getOrgJobs(orgId: string): JobData[] {
    if (!this.jobs.has(orgId)) {
      this.jobs.set(orgId, []);
    }
    return this.jobs.get(orgId)!;
  }

  getOrgAuditLogs(orgId: string): AuditLogData[] {
    if (!this.auditLogs.has(orgId)) {
      this.auditLogs.set(orgId, []);
    }
    return this.auditLogs.get(orgId)!;
  }

  getOrgSuppressions(orgId: string): SuppressionRecordData[] {
    if (!this.suppressionRecords.has(orgId)) {
      this.suppressionRecords.set(orgId, []);
    }
    return this.suppressionRecords.get(orgId)!;
  }

  getOrgConsents(orgId: string): ConsentRecordData[] {
    if (!this.consentRecords.has(orgId)) {
      this.consentRecords.set(orgId, []);
    }
    return this.consentRecords.get(orgId)!;
  }

  getOrgDemos(orgId: string): WebsiteDemoData[] {
    if (!this.demos.has(orgId)) {
      this.demos.set(orgId, []);
    }
    return this.demos.get(orgId)!;
  }

  getDemosForLead(orgId: string, leadId: string): WebsiteDemoData[] {
    return this.getOrgDemos(orgId)
      .filter((d) => d.leadId === leadId)
      .sort((a, b) => b.version - a.version);
  }

  getDemoById(orgId: string, id: string): WebsiteDemoData | null {
    const found = this.getOrgDemos(orgId).find((d) => d.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  saveDemo(orgId: string, demo: WebsiteDemoData): WebsiteDemoData {
    const list = this.getOrgDemos(orgId);
    const copy = JSON.parse(JSON.stringify(demo));
    list.unshift(copy);
    return copy;
  }

  updateDemo(orgId: string, id: string, updates: Partial<WebsiteDemoData>): WebsiteDemoData | null {
    const list = this.getOrgDemos(orgId);
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) return null;
    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return JSON.parse(JSON.stringify(list[index]));
  }

  getDemoByPublicToken(token: string): WebsiteDemoData | null {
    for (const demos of Array.from(this.demos.values())) {
      const found = demos.find((d: WebsiteDemoData) => d.publicToken === token);
      if (found) {
        return JSON.parse(JSON.stringify(found));
      }
    }
    return null;
  }

  recordDemoView(orgId: string, demoId: string): WebsiteDemoData | null {
    const list = this.getOrgDemos(orgId);
    const demo = list.find((d) => d.id === demoId);
    if (!demo) return null;
    const now = new Date().toISOString();
    demo.viewCount = (demo.viewCount || 0) + 1;
    if (!demo.firstViewedAt) {
      demo.firstViewedAt = now;
    }
    demo.lastViewedAt = now;
    demo.updatedAt = now;
    return JSON.parse(JSON.stringify(demo));
  }
}

const globalForDemoStore = globalThis as unknown as {
  __getvisible_demo_store__?: DemoDataStore;
  __leadforge_demo_store__?: DemoDataStore;
};

export const demoStore: DemoDataStore =
  globalForDemoStore.__getvisible_demo_store__ ??
  globalForDemoStore.__leadforge_demo_store__ ??
  new DemoDataStore();

if (process.env.NODE_ENV !== 'production' || isExplicitDemoMode()) {
  globalForDemoStore.__getvisible_demo_store__ = demoStore;
  globalForDemoStore.__leadforge_demo_store__ = demoStore;
}

export { isExplicitDemoMode };


/**
 * Ensures production mode does NOT silently fake data.
 */
async function ensureDatabaseMode(): Promise<void> {
  if (!isExplicitDemoMode()) {
    // If not in demo mode, verify PostgreSQL connectivity.
    // When live Prisma client is used, connection failure throws an explicit DatabaseConnectionError.
    try {
      const { prisma } = await import('./prisma');
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new DatabaseConnectionError(
        `Production Database Error: PostgreSQL database is unreachable at DATABASE_URL. Details: ${msg}. Never running on fake data in production. If you want to test in demo mode, explicitly set DEMO_MODE=true in your environment variables.`
      );
    }
  }
}

function normalizeWebsiteDemo(demo: unknown): WebsiteDemoData {
  if (!demo || typeof demo !== 'object') return demo as WebsiteDemoData;
  const copy = { ...(demo as Record<string, unknown>) };
  if (typeof copy.content === 'string') {
    try {
      copy.content = JSON.parse(copy.content);
    } catch {
      // Keep as is
    }
  }
  if (typeof copy.theme === 'string') {
    try {
      copy.theme = JSON.parse(copy.theme);
    } catch {
      // Keep as is
    }
  }
  const contentObj = (copy.content && typeof copy.content === 'object') ? (copy.content as Record<string, unknown>) : null;
  if (!copy.design && contentObj?.design) {
    copy.design = contentObj.design;
  }
  return copy as unknown as WebsiteDemoData;
}

export class LeadRepository {
  /**
   * List leads scoped strictly by organizationId.
   * Deterministic search, filter, sort, pagination (No AI used for basic DB operations).
   */
  static async listLeads(
    organizationId: string,
    params: LeadFilterParams = {}
  ): Promise<PaginatedLeads> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      let items = demoStore.getOrgLeads(organizationId);

      // 1. Search (businessName, city, publicEmail, address)
      if (params.search && params.search.trim().length > 0) {
        const query = params.search.trim().toLowerCase();
        items = items.filter(
          (l) =>
            l.businessName.toLowerCase().includes(query) ||
            l.city.toLowerCase().includes(query) ||
            l.address.toLowerCase().includes(query) ||
            (l.publicEmail && l.publicEmail.toLowerCase().includes(query)) ||
            (l.website && l.website.toLowerCase().includes(query))
        );
      }

      // 2. Filter by leadStatus
      if (params.leadStatus && params.leadStatus !== 'ALL') {
        items = items.filter((l) => l.leadStatus === params.leadStatus);
      }

      // 2b. Filter by profession
      if (params.profession && params.profession !== 'ALL') {
        items = items.filter((l) => (l.profession || '').toLowerCase() === params.profession!.toLowerCase());
      }

      // 2c. Filter by city
      if (params.city && params.city !== 'ALL') {
        items = items.filter((l) => (l.city || '').toLowerCase().includes(params.city!.toLowerCase()));
      }

      // 3. Filter by websiteStatus
      if (params.websiteStatus && params.websiteStatus !== 'ALL') {
        items = items.filter((l) => l.websiteStatus === params.websiteStatus);
      }

      // 3b. Filter by Source
      if (params.source && params.source !== 'ALL') {
        items = items.filter((l) => l.source.toLowerCase().includes(params.source!.toLowerCase()));
      }

      // 3c. Filter by isDemoData
      if (typeof params.isDemoData === 'boolean') {
        items = items.filter((l) => l.isDemoData === params.isDemoData);
      }

      // 3d. Filter by Contact availability
      if (params.hasContact === 'EMAIL') {
        items = items.filter((l) => Boolean(l.publicEmail));
      } else if (params.hasContact === 'PHONE') {
        items = items.filter((l) => Boolean(l.publicPhone));
      } else if (params.hasContact === 'BOTH') {
        items = items.filter((l) => Boolean(l.publicEmail && l.publicPhone));
      }

      // 3e. Filter by Channel
      if (params.channel && params.channel !== 'ALL') {
        items = items.filter((l) => l.contactChannel === params.channel || l.activities?.some((a) => (a.metadata as any)?.channel === params.channel));
      }

      // 3f. Filter by Date Range
      if (params.startDate) {
        const startMs = new Date(params.startDate).getTime();
        items = items.filter((l) => new Date(l.createdAt).getTime() >= startMs);
      }
      if (params.endDate) {
        const endMs = new Date(params.endDate).getTime();
        items = items.filter((l) => new Date(l.createdAt).getTime() <= endMs);
      }

      // 4. Filter by score range
      if (typeof params.minScore === 'number') {
        items = items.filter((l) => l.opportunityScore >= params.minScore!);
      }
      if (typeof params.maxScore === 'number') {
        items = items.filter((l) => l.opportunityScore <= params.maxScore!);
      }

      // 5. Sort
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';

      items.sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'opportunityScore') {
          cmp = a.opportunityScore - b.opportunityScore;
        } else if (sortBy === 'businessName') {
          cmp = a.businessName.localeCompare(b.businessName);
        } else if (sortBy === 'updatedAt') {
          cmp = new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
        } else {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortOrder === 'desc' ? -cmp : cmp;
      });

      // 6. Pagination
      const page = Math.max(1, params.page || 1);
      const pageSize = Math.max(1, params.pageSize || 10);
      const total = items.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedLeads = items.slice(startIndex, startIndex + pageSize).map((l) => ({
        ...l,
        websiteDemos: demoStore.getDemosForLead(organizationId, l.id).map(normalizeWebsiteDemo),
      }));

      return {
        leads: paginatedLeads,
        total,
        page,
        pageSize,
        totalPages,
      };
    }

    // Production PostgreSQL execution
    const { prisma } = await import('./prisma');
    const where: Record<string, unknown> = { organizationId };

    if (params.search && params.search.trim().length > 0) {
      where.OR = [
        { businessName: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
        { publicEmail: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.leadStatus && params.leadStatus !== 'ALL') {
      where.leadStatus = params.leadStatus;
    }

    if (params.profession && params.profession !== 'ALL') {
      where.profession = { equals: params.profession, mode: 'insensitive' };
    }

    if (params.city && params.city !== 'ALL') {
      where.city = { contains: params.city, mode: 'insensitive' };
    }

    if (params.websiteStatus && params.websiteStatus !== 'ALL') {
      where.websiteStatus = params.websiteStatus;
    }

    if (typeof params.minScore === 'number' || typeof params.maxScore === 'number') {
      where.opportunityScore = {
        gte: params.minScore,
        lte: params.maxScore,
      };
    }

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 10);
    const skip = (page - 1) * pageSize;

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
        include: {
          contacts: true,
          websites: true,
          suppressionRecords: true,
          consentRecords: true,
          websiteDemos: true,
        },
      }),
    ]);

    const normalizedLeads = (leads as unknown as LeadData[]).map((ld) => {
      if (ld.websiteDemos && Array.isArray(ld.websiteDemos)) {
        return {
          ...ld,
          websiteDemos: ld.websiteDemos.map(normalizeWebsiteDemo),
        };
      }
      return ld;
    });

    return {
      leads: normalizedLeads,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get single lead by ID, strictly verifying organization ownership.
   */
  static async getLeadById(id: string, organizationId: string): Promise<LeadData | null> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    const cleanId = id ? id.trim() : '';
    if (!cleanId) return null;

    if (isExplicitDemoMode()) {
      const items = demoStore.getOrgLeads(organizationId);
      const lead = items.find((l) => l.id === cleanId);
      if (!lead) return null;

      // Attach org suppressions, consents, and demos
      const suppressions = demoStore.getOrgSuppressions(organizationId).filter((s) => s.leadId === cleanId);
      const consents = demoStore.getOrgConsents(organizationId).filter((c) => c.leadId === cleanId);
      const demos = demoStore.getDemosForLead(organizationId, cleanId).map(normalizeWebsiteDemo);
      return {
        ...lead,
        suppressionRecords: suppressions,
        consentRecords: consents,
        websiteDemos: demos,
      };
    }

    const { prisma } = await import('./prisma');
    const lead = await prisma.lead.findFirst({
      where: { id: cleanId, organizationId },
      include: {
        contacts: true,
        websites: true,
        activities: { orderBy: { createdAt: 'desc' } },
        consentRecords: true,
        suppressionRecords: true,
        jobs: { orderBy: { createdAt: 'desc' } },
        websiteDemos: { orderBy: { version: 'desc' } },
      },
    });

    if (!lead) return null;

    const leadObj = lead as unknown as LeadData;
    if (leadObj.websiteDemos && Array.isArray(leadObj.websiteDemos)) {
      leadObj.websiteDemos = leadObj.websiteDemos.map(normalizeWebsiteDemo);
    }

    return leadObj;
  }


  /**
   * Create a new Lead scoped to organization.
   */
  static async createLead(
    leadData: Partial<LeadData>,
    organizationId: string,
    actorName: string
  ): Promise<LeadData> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      const isDemoOrg = organizationId === DEMO_ORGANIZATION_ID;
      const leadId =
        leadData.id ||
        (isDemoOrg
          ? `demo-lead-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          : `lead-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

      const newLead: LeadData = {
        id: leadId,
        businessName: leadData.businessName || (isDemoOrg ? 'Demo CA Firm' : 'Prospect Business'),
        profession: leadData.profession || 'Chartered Accountant',
        city: leadData.city || 'Gurgaon',
        address: leadData.address || (isDemoOrg ? 'Demo Address, Gurgaon, Haryana' : 'Gurgaon, Haryana'),
        website: leadData.website || null,
        publicEmail: leadData.publicEmail || null,
        publicPhone: leadData.publicPhone || null,
        source: leadData.source || 'Manual Entry',
        sourceUrl: leadData.sourceUrl || null,
        sourceQuality: leadData.sourceQuality || 'USER_IMPORTED',
        websiteStatus: leadData.websiteStatus || 'NO_WEBSITE',
        leadStatus: leadData.leadStatus || 'NEW',
        opportunityScore: leadData.opportunityScore || 50,
        opportunityReason:
          leadData.opportunityReason ||
          (isDemoOrg ? 'Newly created lead record in demo mode.' : 'Newly created prospect record.'),
        isDemoData: leadData.isDemoData !== undefined ? leadData.isDemoData : isDemoOrg,
        organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contacts: leadData.contacts || [],
        websites: leadData.websites || [],
        activities: [
          {
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'DISCOVERY',
            title: 'Lead Created',
            description: `Lead created by ${actorName}`,
            leadId,
            organizationId,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      const leads = demoStore.getOrgLeads(organizationId);
      leads.unshift(newLead);

      // Audit Log
      const audit = createAuditLogEntry({
        action: 'LEAD_CREATED',
        entity: 'Lead',
        entityId: newLead.id,
        actor: actorName,
        organizationId,
        details: { businessName: newLead.businessName, isDemoData: newLead.isDemoData },
      });
      demoStore.getOrgAuditLogs(organizationId).unshift(audit);

      return newLead;
    }

    const { prisma } = await import('./prisma');
    const created = await prisma.lead.create({
      data: {
        businessName: leadData.businessName!,
        profession: leadData.profession || 'Chartered Accountant',
        city: leadData.city || 'Gurgaon',
        address: leadData.address || '',
        website: leadData.website,
        publicEmail: leadData.publicEmail,
        publicPhone: leadData.publicPhone,
        source: leadData.source || 'Manual Entry',
        sourceUrl: leadData.sourceUrl,
        websiteStatus: leadData.websiteStatus || 'NO_WEBSITE',
        leadStatus: leadData.leadStatus || 'NEW',
        opportunityScore: leadData.opportunityScore || 50,
        opportunityReason: leadData.opportunityReason || 'Newly created lead record.',
        isDemoData: false,
        organizationId,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'LEAD_CREATED',
        entity: 'Lead',
        entityId: created.id,
        actor: actorName,
        organizationId,
        details: { businessName: created.businessName },
      },
    });

    return created as unknown as LeadData;
  }

  /**
   * Update lead status with audit logging and DO_NOT_CONTACT suppression sync.
   */
  static async updateLeadStatus(
    leadId: string,
    newStatus: LeadStatus,
    organizationId: string,
    actorName: string,
    reason?: string,
    channel?: Channel
  ): Promise<LeadData> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      const items = demoStore.getOrgLeads(organizationId);
      const lead = items.find((l) => l.id === leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} not found in organization.`);
      }

      const transition = validateStatusTransition(lead.leadStatus, newStatus);
      if (!transition.allowed) {
        throw new Error(transition.reason || `Transition from ${lead.leadStatus} to ${newStatus} is not allowed.`);
      }

      const oldStatus = lead.leadStatus;
      lead.leadStatus = newStatus;
      if (channel) {
        lead.contactChannel = channel;
      }
      lead.updatedAt = new Date().toISOString();

      // Activity entry
      if (!lead.activities) lead.activities = [];
      lead.activities.unshift({
        id: `act-${Date.now()}`,
        type: 'STATUS_CHANGE',
        title: `Status Changed to ${newStatus}`,
        description: reason || `Status transitioned from ${oldStatus} to ${newStatus} by ${actorName}.`,
        metadata: { from: oldStatus, to: newStatus, reason, channel: channel || null },
        leadId,
        organizationId,
        createdAt: new Date().toISOString(),
      });

      // Audit Log
      const audit = createAuditLogEntry({
        action: newStatus === 'DO_NOT_CONTACT' ? 'LEAD_MARKED_DO_NOT_CONTACT' : 'LEAD_STATUS_CHANGED',
        entity: 'Lead',
        entityId: leadId,
        actor: actorName,
        organizationId,
        details: { from: oldStatus, to: newStatus, reason, channel: channel || null },
      });
      demoStore.getOrgAuditLogs(organizationId).unshift(audit);

      // If marked DO_NOT_CONTACT, automatically create suppression records for all channels
      if (newStatus === 'DO_NOT_CONTACT') {
        const channels: Channel[] = ['EMAIL', 'WHATSAPP', 'SMS', 'VOICE'];
        const suppressions = demoStore.getOrgSuppressions(organizationId);
        channels.forEach((channel) => {
          const exists = suppressions.some((s) => s.leadId === leadId && s.channel === channel);
          if (!exists) {
            suppressions.unshift({
              id: `supp-${Date.now()}-${channel.toLowerCase()}`,
              leadId,
              organizationId,
              channel,
              reason: reason || 'Marked as DO_NOT_CONTACT by compliance rule or human request.',
              createdAt: new Date().toISOString(),
              createdBy: actorName,
            });
          }
        });
      }

      return lead;
    }

    const { prisma } = await import('./prisma');
    const existing = await prisma.lead.findFirst({
      where: { id: leadId, organizationId },
    });

    if (!existing) {
      throw new Error(`Lead ${leadId} not found in organization.`);
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        leadStatus: newStatus,
        activities: {
          create: {
            type: 'STATUS_CHANGE',
            title: `Status Changed to ${newStatus}`,
            description: reason || `Status transitioned from ${existing.leadStatus} to ${newStatus} by ${actorName}.`,
            metadata: { from: existing.leadStatus, to: newStatus, reason, channel: channel || null },
            organizationId,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: newStatus === 'DO_NOT_CONTACT' ? 'LEAD_MARKED_DO_NOT_CONTACT' : 'LEAD_STATUS_CHANGED',
        entity: 'Lead',
        entityId: leadId,
        actor: actorName,
        organizationId,
        details: { from: existing.leadStatus, to: newStatus, reason },
      },
    });

    if (newStatus === 'DO_NOT_CONTACT') {
      const channels: Channel[] = ['EMAIL', 'WHATSAPP', 'SMS', 'VOICE'];
      for (const ch of channels) {
        await prisma.suppressionRecord.create({
          data: {
            leadId,
            organizationId,
            channel: ch,
            reason: reason || 'Marked as DO_NOT_CONTACT',
            createdBy: actorName,
          },
        });
      }
    }

    return updated as unknown as LeadData;
  }

  /**
   * Add a note to the lead and record an activity entry.
   */
  static async addNote(
    organizationId: string,
    leadId: string,
    noteText: string,
    actorName = 'Sales Rep'
  ): Promise<LeadNoteData> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    const note: LeadNoteData = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
      createdBy: actorName,
    };

    if (isExplicitDemoMode()) {
      const items = demoStore.getOrgLeads(organizationId);
      const lead = items.find((l) => l.id === leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} not found in organization.`);
      }

      if (!lead.notes) lead.notes = [];
      lead.notes.unshift(note);

      if (!lead.activities) lead.activities = [];
      lead.activities.unshift({
        id: `act-${Date.now()}`,
        type: 'NOTE_ADDED',
        title: 'Note Recorded',
        description: `"${note.text}" — recorded by ${actorName}.`,
        leadId,
        organizationId,
        createdAt: new Date().toISOString(),
      });

      return note;
    }

    const { prisma } = await import('./prisma');
    await prisma.activity.create({
      data: {
        type: 'NOTE_ADDED',
        title: 'Note Recorded',
        description: `"${note.text}" — recorded by ${actorName}.`,
        leadId,
        organizationId,
      },
    });

    return note;
  }

  /**
   * Adds an activity event to a lead record with organization isolation.
   */
  static async addActivity(
    organizationId: string,
    leadId: string,
    activityData: {
      type: string;
      title: string;
      description: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ActivityData> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      const items = demoStore.getOrgLeads(organizationId);
      const lead = items.find((l) => l.id === leadId);
      const newActivity: ActivityData = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: activityData.type,
        title: activityData.title,
        description: activityData.description,
        metadata: activityData.metadata || null,
        leadId,
        organizationId,
        createdAt: new Date().toISOString(),
      };
      if (lead) {
        if (!lead.activities) lead.activities = [];
        lead.activities.unshift(newActivity);
      }
      return newActivity;
    }

    const { prisma } = await import('./prisma');
    const created = await prisma.activity.create({
      data: {
        type: activityData.type,
        title: activityData.title,
        description: activityData.description,
        metadata: (activityData.metadata || {}) as any,
        leadId,
        organizationId,
      },
    });

    return created as unknown as ActivityData;
  }

  /**
   * Computes real database metrics scoped by organizationId.
   */
  static async getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      const leads = demoStore.getOrgLeads(organizationId);
      const jobs = demoStore.getOrgJobs(organizationId);
      const suppressions = demoStore.getOrgSuppressions(organizationId);
      const demosList = demoStore.getOrgDemos(organizationId);

      const approvedDemoCount = demosList.filter((d) => d.approvalStatus === 'APPROVED').length;

      const metrics: DashboardMetrics = {
        totalLeads: leads.length,
        newLeads: leads.filter((l) => l.leadStatus === 'NEW').length,
        qualifiedLeads: leads.filter((l) => l.leadStatus === 'QUALIFIED').length,
        demos: leads.filter((l) => l.leadStatus === 'DEMO_GENERATED' || Boolean(l.websiteDemos && l.websiteDemos.length > 0)).length,
        demosApproved: Math.max(approvedDemoCount, leads.filter((l) => l.leadStatus === 'APPROVED').length),
        contacted: leads.filter((l) => l.leadStatus === 'CONTACTED').length,
        replies: leads.filter((l) => l.leadStatus === 'RESPONDED' || l.leadStatus === 'REPLIED').length,
        interested: leads.filter((l) => l.leadStatus === 'INTERESTED').length,
        converted: leads.filter((l) => l.leadStatus === 'CONVERTED' || l.leadStatus === 'CUSTOMER').length,
        customers: leads.filter((l) => l.leadStatus === 'CONVERTED' || l.leadStatus === 'CUSTOMER').length,
        suppressionCount: suppressions.length,
        activeJobsCount: jobs.filter((j) => j.status === 'RUNNING' || j.status === 'QUEUED').length,
      };

      return metrics;
    }

    const { prisma } = await import('./prisma');
    const [
      totalLeads,
      newLeads,
      qualifiedLeads,
      demos,
      demosApproved,
      contacted,
      replies,
      interested,
      converted,
      suppressionCount,
      activeJobsCount,
    ] = await Promise.all([
      prisma.lead.count({ where: { organizationId } }),
      prisma.lead.count({ where: { organizationId, leadStatus: 'NEW' } }),
      prisma.lead.count({ where: { organizationId, leadStatus: 'QUALIFIED' } }),
      prisma.lead.count({ where: { organizationId, leadStatus: 'DEMO_GENERATED' } }),
      prisma.lead.count({ where: { organizationId, leadStatus: 'APPROVED' } }),
      prisma.lead.count({ where: { organizationId, leadStatus: 'CONTACTED' } }),
      prisma.lead.count({ where: { organizationId, leadStatus: { in: ['RESPONDED', 'REPLIED'] } } }),
      prisma.lead.count({ where: { organizationId, leadStatus: 'INTERESTED' } }),
      prisma.lead.count({ where: { organizationId, leadStatus: { in: ['CONVERTED', 'CUSTOMER'] } } }),
      prisma.suppressionRecord.count({ where: { organizationId } }),
      prisma.job.count({
        where: {
          organizationId,
          status: { in: ['QUEUED', 'RUNNING'] },
        },
      }),
    ]);

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      demos,
      demosApproved,
      contacted,
      replies,
      interested,
      converted,
      customers: converted,
      suppressionCount,
      activeJobsCount,
    };
  }

  /**
   * List audit logs strictly scoped by organizationId.
   */
  static async getAuditLogs(organizationId: string, entityId?: string): Promise<AuditLogData[]> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      let logs = demoStore.getOrgAuditLogs(organizationId);
      if (entityId) {
        logs = logs.filter((l) => l.entityId === entityId);
      }
      return logs;
    }

    const { prisma } = await import('./prisma');
    const where: Record<string, unknown> = { organizationId };
    if (entityId) {
      where.entityId = entityId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs as unknown as AuditLogData[];
  }

  /**
   * List jobs strictly scoped by organizationId.
   */
  static async getJobs(organizationId: string): Promise<JobData[]> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      return demoStore.getOrgJobs(organizationId);
    }

    const { prisma } = await import('./prisma');
    const jobs = await prisma.job.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return jobs as unknown as JobData[];
  }
}

export class WebsiteDemoRepository {
  /**
   * List website demos strictly scoped by organizationId, optionally filtered by leadId.
   */
  static async listDemos(organizationId: string, leadId?: string): Promise<WebsiteDemoData[]> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      if (leadId) {
        return demoStore.getDemosForLead(organizationId, leadId).map(normalizeWebsiteDemo);
      }
      return demoStore
        .getOrgDemos(organizationId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(normalizeWebsiteDemo);
    }

    const { prisma } = await import('./prisma');
    const where: Record<string, unknown> = { organizationId };
    if (leadId) {
      where.leadId = leadId;
    }

    const demos = await prisma.websiteDemo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return (demos as unknown as WebsiteDemoData[]).map(normalizeWebsiteDemo);
  }

  /**
   * Get single website demo by ID, strictly verifying organization ownership.
   */
  static async getDemo(organizationId: string, id: string): Promise<WebsiteDemoData | null> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      const found = demoStore.getDemoById(organizationId, id);
      return found ? normalizeWebsiteDemo(found) : null;
    }

    const { prisma } = await import('./prisma');
    const demo = await prisma.websiteDemo.findFirst({
      where: { id, organizationId },
    });

    return demo ? normalizeWebsiteDemo(demo) : null;
  }

  /**
   * Save a newly generated website demo concept.
   */
  static async saveDemo(
    organizationId: string,
    demo: WebsiteDemoData,
    actorName = 'system'
  ): Promise<WebsiteDemoData> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    const demoWithToken: WebsiteDemoData = {
      ...demo,
      publicToken: demo.publicToken || generatePublicDemoToken(),
      approvalStatus: demo.approvalStatus || 'PENDING_REVIEW',
      viewCount: demo.viewCount || 0,
    };

    if (isExplicitDemoMode()) {
      const saved = demoStore.saveDemo(organizationId, demoWithToken);
      await createAuditLogEntry({
        action: 'DEMO_GENERATED',
        entity: 'WebsiteDemo',
        entityId: demo.id,
        organizationId,
        actor: actorName,
        details: { leadId: demo.leadId, version: demo.version, templateId: demo.templateId },
      });
      return normalizeWebsiteDemo(saved);
    }

    const { prisma } = await import('./prisma');
    const created = await prisma.websiteDemo.create({
      data: {
        id: demoWithToken.id,
        leadId: demoWithToken.leadId,
        organizationId,
        templateId: demoWithToken.templateId,
        version: demoWithToken.version,
        generationStatus: demoWithToken.generationStatus,
        approvalStatus: demoWithToken.approvalStatus,
        publicToken: demoWithToken.publicToken,
        viewCount: demoWithToken.viewCount || 0,
        content: demoWithToken.content as any,
        theme: demoWithToken.theme as any,
        error: demoWithToken.error || null,
      },
    });

    await createAuditLogEntry({
      action: 'DEMO_GENERATED',
      entity: 'WebsiteDemo',
      entityId: demo.id,
      organizationId,
      actor: actorName,
      details: { leadId: demo.leadId, version: demo.version, templateId: demo.templateId },
    });

    return normalizeWebsiteDemo(created);
  }

  /**
   * Update an existing demo concept (e.g. user manual edits or theme changes).
   */
  static async updateDemo(
    organizationId: string,
    id: string,
    updates: Partial<WebsiteDemoData>,
    actorName = 'user'
  ): Promise<WebsiteDemoData | null> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      const updated = demoStore.updateDemo(organizationId, id, updates);
      if (updated) {
        await createAuditLogEntry({
          action: 'LEAD_UPDATED',
          entity: 'WebsiteDemo',
          entityId: id,
          organizationId,
          actor: actorName,
          details: { updatedFields: Object.keys(updates) },
        });
      }
      return updated ? normalizeWebsiteDemo(updated) : null;
    }

    const { prisma } = await import('./prisma');
    const existing = await prisma.websiteDemo.findFirst({ where: { id, organizationId } });
    if (!existing) return null;

    const dataToUpdate: Record<string, unknown> = {};
    if (updates.content) dataToUpdate.content = updates.content as any;
    if (updates.theme) dataToUpdate.theme = updates.theme as any;
    if (updates.generationStatus) dataToUpdate.generationStatus = updates.generationStatus;
    if (updates.approvalStatus !== undefined) dataToUpdate.approvalStatus = updates.approvalStatus;
    if (updates.publicToken !== undefined) dataToUpdate.publicToken = updates.publicToken;
    if (updates.rejectionReason !== undefined) dataToUpdate.rejectionReason = updates.rejectionReason;
    if (updates.reviewedAt !== undefined) dataToUpdate.reviewedAt = updates.reviewedAt ? new Date(updates.reviewedAt) : null;
    if (updates.reviewedBy !== undefined) dataToUpdate.reviewedBy = updates.reviewedBy;
    if (updates.error !== undefined) dataToUpdate.error = updates.error;

    const updated = await prisma.websiteDemo.update({
      where: { id },
      data: dataToUpdate,
    });

    await createAuditLogEntry({
      action: 'LEAD_UPDATED',
      entity: 'WebsiteDemo',
      entityId: id,
      organizationId,
      actor: actorName,
      details: { updatedFields: Object.keys(updates) },
    });

    return normalizeWebsiteDemo(updated);
  }

  /**
   * Approve a website demo for outreach.
   * Updates demo approvalStatus to 'APPROVED', transitions lead status to 'APPROVED',
   * ensures publicToken is assigned, and records activity + audit log.
   */
  static async approveDemo(
    organizationId: string,
    demoId: string,
    actorName = 'Sales Specialist'
  ): Promise<{ demo: WebsiteDemoData; lead: LeadData }> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    const demo = await this.getDemo(organizationId, demoId);
    if (!demo) {
      throw new Error(`Website demo ${demoId} not found in this organization.`);
    }

    const now = new Date().toISOString();
    const publicToken = demo.publicToken || generatePublicDemoToken();
    const updatedDemo = await this.updateDemo(
      organizationId,
      demoId,
      {
        approvalStatus: 'APPROVED',
        rejectionReason: null,
        reviewedAt: now,
        reviewedBy: actorName,
        publicToken,
      },
      actorName
    );

    if (!updatedDemo) {
      throw new Error(`Failed to update approval status for demo ${demoId}.`);
    }

    // Update lead status to APPROVED
    const updatedLead = await LeadRepository.updateLeadStatus(
      demo.leadId,
      'APPROVED',
      organizationId,
      actorName,
      `Website concept v${demo.version} approved for outreach by ${actorName}.`
    );

    // Audit Log
    await createAuditLogEntry({
      action: 'DEMO_APPROVED',
      entity: 'WebsiteDemo',
      entityId: demoId,
      organizationId,
      actor: actorName,
      details: { leadId: demo.leadId, version: demo.version, publicToken },
    });

    return { demo: updatedDemo, lead: updatedLead };
  }

  /**
   * Reject a website demo.
   * Sets approvalStatus to 'REJECTED' with reason, transitions lead status to 'REJECTED',
   * records activity + audit log, and preserves the demo record for audit history (never deletes).
   */
  static async rejectDemo(
    organizationId: string,
    demoId: string,
    reason: string,
    actorName = 'Sales Specialist'
  ): Promise<{ demo: WebsiteDemoData; lead: LeadData }> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    const demo = await this.getDemo(organizationId, demoId);
    if (!demo) {
      throw new Error(`Website demo ${demoId} not found in this organization.`);
    }

    const now = new Date().toISOString();
    const updatedDemo = await this.updateDemo(
      organizationId,
      demoId,
      {
        approvalStatus: 'REJECTED',
        rejectionReason: reason || 'Concept rejected during review.',
        reviewedAt: now,
        reviewedBy: actorName,
      },
      actorName
    );

    if (!updatedDemo) {
      throw new Error(`Failed to update rejection status for demo ${demoId}.`);
    }

    // Update lead status to REJECTED
    const updatedLead = await LeadRepository.updateLeadStatus(
      demo.leadId,
      'REJECTED',
      organizationId,
      actorName,
      `Website concept v${demo.version} rejected by ${actorName}: ${reason}`
    );

    // Audit Log
    await createAuditLogEntry({
      action: 'DEMO_REJECTED',
      entity: 'WebsiteDemo',
      entityId: demoId,
      organizationId,
      actor: actorName,
      details: { leadId: demo.leadId, version: demo.version, reason },
    });

    return { demo: updatedDemo, lead: updatedLead };
  }

  /**
   * Retrieves an approved website demo by its public token.
   * STRICT SECURITY GATE:
   * - Only returns the demo if approvalStatus === 'APPROVED'.
   * - If demo is PENDING_REVIEW, REJECTED, or nonexistent, returns null (404).
   */
  static async getApprovedDemoByPublicToken(
    publicToken: string
  ): Promise<WebsiteDemoData | null> {
    if (!publicToken || publicToken.trim().length === 0) {
      return null;
    }

    const cleanToken = publicToken.trim();

    if (isExplicitDemoMode()) {
      const demo = demoStore.getDemoByPublicToken(cleanToken);
      if (!demo || demo.approvalStatus !== 'APPROVED') {
        return null;
      }
      return normalizeWebsiteDemo(demo);
    }

    const { prisma } = await import('./prisma');
    const demo = await prisma.websiteDemo.findFirst({
      where: {
        publicToken: cleanToken,
        approvalStatus: 'APPROVED',
      },
    });

    return demo ? normalizeWebsiteDemo(demo) : null;
  }

  /**
   * Records a lightweight public view event for an approved website demo.
   * Increments demo.viewCount, updates firstViewedAt/lastViewedAt,
   * and creates a DEMO_VIEW activity event on the prospect lead record.
   */
  static async recordPublicDemoView(
    demoId: string,
    organizationId: string
  ): Promise<void> {
    const demo = await this.getDemo(organizationId, demoId);
    if (!demo) return;

    if (isExplicitDemoMode()) {
      const updated = demoStore.recordDemoView(organizationId, demoId);
      await LeadRepository.addActivity(organizationId, demo.leadId, {
        type: 'DEMO_VIEW',
        title: 'Public Demo Viewed',
        description: 'Prospect opened public website concept via shared link.',
        metadata: {
          publicToken: demo.publicToken,
          version: demo.version,
          viewCount: updated?.viewCount || 1,
        },
      });
      return;
    }

    const { prisma } = await import('./prisma');
    const now = new Date();
    await prisma.websiteDemo.update({
      where: { id: demoId },
      data: {
        viewCount: { increment: 1 },
        firstViewedAt: demo.firstViewedAt ? undefined : now,
        lastViewedAt: now,
      },
    });

    await LeadRepository.addActivity(organizationId, demo.leadId, {
      type: 'DEMO_VIEW',
      title: 'Public Demo Viewed',
      description: 'Prospect opened public website concept via shared link.',
      metadata: {
        publicToken: demo.publicToken,
        version: demo.version,
        viewCount: (demo.viewCount || 0) + 1,
      },
    });
  }
}

