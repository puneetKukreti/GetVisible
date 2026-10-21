import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
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
import type { IndustryDesignBlueprint } from '@/lib/demos/industry-blueprint';
import {
  INITIAL_DEMO_LEADS,
  INITIAL_DEMO_JOBS,
  INITIAL_DEMO_AUDIT_LOGS,
  DEMO_ORGANIZATION_ID,
  isExplicitDemoMode,
} from './demo-data';
import { createAuditLogEntry, CreateAuditLogParams } from '../audit';
import { validateStatusTransition } from '../sales/lifecycle';
import {
  generatePublicDemoToken,
  isDemoExpired,
  DEMO_PUBLIC_TTL_MS,
} from '../demos/public';
import { PILOT_ORGANIZATION_ID } from '../workspace';
import { getTemplateScreenshotPath } from '../demos/stitch-templates';

export class DatabaseConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

const LOCAL_DATA_DIR = path.join(process.cwd(), '.data');
function getStoreFilePath(): string {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    return path.join(LOCAL_DATA_DIR, 'getvisible_permanent_store.json');
  } catch {
    return path.join(os.tmpdir(), 'getvisible_demo_store_v1.json');
  }
}
const DEMO_STORE_FILE = getStoreFilePath();

/** Media assets are global (served publicly by unguessable id), so they live
 *  under a single ledger key instead of per-organization arrays. */
const MEDIA_LEDGER_KEY = 'media-assets';

/** Design blueprints for every covered industry live under one ledger key. */
const BLUEPRINT_LEDGER_KEY = 'industry-blueprints';

/**
 * Bumped whenever DemoDataStore gains fields/methods. In dev, Next caches the
 * store instance on globalThis across hot reloads; an instance built by an
 * older class shape would silently lack new methods (e.g. a media lookup threw
 * `getMediaBySourceUrl is not a function` and disabled image dedupe). A stale
 * instance is discarded and rebuilt from the .data ledger instead.
 */
const DEMO_STORE_SCHEMA_VERSION = 3;

/** Per-industry design blueprint authored once and reused (see industry-blueprint.ts). */
export interface DemoBlueprintRecord {
  key: string;
  industry: string;
  /** The full IndustryDesignBlueprint payload. */
  blueprint: Record<string, unknown>;
  source: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** A downloaded image persisted by the app (base64 payload in demo mode). */
export interface DemoMediaRecord {
  id: string;
  mime: string;
  /** base64 of the image bytes (demo/in-memory mode only). */
  dataBase64: string;
  byteSize: number;
  sourceUrl?: string | null;
  attribution?: string | null;
  purpose?: string | null;
  createdAt: string;
}

// In-memory demo store scoped strictly per organization when DEMO_MODE=true
class DemoDataStore {
  /** See DEMO_STORE_SCHEMA_VERSION — stale cached instances are rejected. */
  readonly schemaVersion = DEMO_STORE_SCHEMA_VERSION;
  private leads: Map<string, LeadData[]> = new Map();
  private jobs: Map<string, JobData[]> = new Map();
  private auditLogs: Map<string, AuditLogData[]> = new Map();
  private suppressionRecords: Map<string, SuppressionRecordData[]> = new Map();
  private consentRecords: Map<string, ConsentRecordData[]> = new Map();
  private demos: Map<string, WebsiteDemoData[]> = new Map();
  /**
   * Downloaded industry imagery, persisted as base64 inside the ledger so both
   * the in-memory store and the .data/ JSON mirror stay in sync with storage
   * semantics identical to demos (survives restarts in demo mode).
   */
  private media: Map<string, DemoMediaRecord[]> = new Map();
  /**
   * Per-industry design blueprints (one row per industry key), so the same trade
   * always renders the same reference-informed design — in demo mode they live
   * in the ledger alongside media.
   */
  private blueprints: Map<string, DemoBlueprintRecord[]> = new Map();
  private lastLoadedMtime = 0;

  constructor() {
    const loaded = this.syncFromDisk();
    if (!loaded || this.leads.size === 0 || !this.leads.has(DEMO_ORGANIZATION_ID)) {
      this.initializeDemoOrg();
      this.saveToDisk();
    }
  }

  getLeadsMap(): Map<string, LeadData[]> {
    return this.leads;
  }

  setOrgLeads(orgId: string, leads: LeadData[]): void {
    this.leads.set(orgId, leads);
  }

  getMediaMap(): Map<string, DemoMediaRecord[]> {
    return this.media;
  }

  getMediaById(id: string): DemoMediaRecord | null {
    for (const rows of Array.from(this.media.values())) {
      const hit = rows.find((row) => row.id === id);
      if (hit) return hit;
    }
    return null;
  }

  getMediaBySourceUrl(sourceUrl: string): DemoMediaRecord | null {
    for (const rows of Array.from(this.media.values())) {
      const hit = rows.find((row) => row.sourceUrl === sourceUrl);
      if (hit) return hit;
    }
    return null;
  }

  putMedia(records: DemoMediaRecord[]): void {
    const existing = this.media.get(MEDIA_LEDGER_KEY) || [];
    this.media.set(MEDIA_LEDGER_KEY, [...existing, ...records]);
  }

  getBlueprint(key: string): DemoBlueprintRecord | null {
    const rows = this.blueprints.get(BLUEPRINT_LEDGER_KEY) || [];
    return rows.find((row) => row.key === key) || null;
  }

  putBlueprint(record: DemoBlueprintRecord): void {
    const rows = this.blueprints.get(BLUEPRINT_LEDGER_KEY) || [];
    const withoutKey = rows.filter((row) => row.key !== record.key);
    this.blueprints.set(BLUEPRINT_LEDGER_KEY, [...withoutKey, record]);
  }

  removeBlueprint(key: string): void {
    const rows = this.blueprints.get(BLUEPRINT_LEDGER_KEY) || [];
    this.blueprints.set(
      BLUEPRINT_LEDGER_KEY,
      rows.filter((row) => row.key !== key)
    );
  }

  getDemosMap(): Map<string, WebsiteDemoData[]> {
    return this.demos;
  }

  setOrgDemos(orgId: string, demos: WebsiteDemoData[]): void {
    this.demos.set(orgId, demos);
  }

  syncFromDisk(): boolean {
    if (process.env.NODE_ENV === 'test') return false;
    try {
      if (fs.existsSync(DEMO_STORE_FILE)) {
        const stat = fs.statSync(DEMO_STORE_FILE);
        if (stat.mtimeMs > this.lastLoadedMtime) {
          const raw = fs.readFileSync(DEMO_STORE_FILE, 'utf-8');
          const data = JSON.parse(raw);
          if (data && typeof data === 'object') {
            if (Array.isArray(data.leads)) this.leads = new Map(data.leads);
            if (Array.isArray(data.jobs)) this.jobs = new Map(data.jobs);
            if (Array.isArray(data.auditLogs)) this.auditLogs = new Map(data.auditLogs);
            if (Array.isArray(data.suppressionRecords)) this.suppressionRecords = new Map(data.suppressionRecords);
            if (Array.isArray(data.consentRecords)) this.consentRecords = new Map(data.consentRecords);
            if (Array.isArray(data.demos)) this.demos = new Map(data.demos);
            if (Array.isArray(data.media)) this.media = new Map(data.media);
            if (Array.isArray(data.blueprints)) this.blueprints = new Map(data.blueprints);
            this.lastLoadedMtime = stat.mtimeMs;
            return true;
          }
        } else {
          return true;
        }
      }
    } catch {
      // Ignore disk read error in restricted environments
    }
    return false;
  }

  saveToDisk() {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const data = {
        leads: Array.from(this.leads.entries()),
        jobs: Array.from(this.jobs.entries()),
        auditLogs: Array.from(this.auditLogs.entries()),
        suppressionRecords: Array.from(this.suppressionRecords.entries()),
        consentRecords: Array.from(this.consentRecords.entries()),
        demos: Array.from(this.demos.entries()),
        media: Array.from(this.media.entries()),
        blueprints: Array.from(this.blueprints.entries()),
      };
      fs.writeFileSync(DEMO_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
      const stat = fs.statSync(DEMO_STORE_FILE);
      this.lastLoadedMtime = stat.mtimeMs;
    } catch {
      // Ignore disk write error in restricted environments
    }
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
    this.syncFromDisk();
    if (!this.leads.has(orgId)) {
      this.leads.set(orgId, []);
    }
    return this.leads.get(orgId)!;
  }

  getOrgJobs(orgId: string): JobData[] {
    this.syncFromDisk();
    if (!this.jobs.has(orgId)) {
      this.jobs.set(orgId, []);
    }
    return this.jobs.get(orgId)!;
  }

  getOrgAuditLogs(orgId: string): AuditLogData[] {
    this.syncFromDisk();
    if (!this.auditLogs.has(orgId)) {
      this.auditLogs.set(orgId, []);
    }
    return this.auditLogs.get(orgId)!;
  }

  getOrgSuppressions(orgId: string): SuppressionRecordData[] {
    this.syncFromDisk();
    if (!this.suppressionRecords.has(orgId)) {
      this.suppressionRecords.set(orgId, []);
    }
    return this.suppressionRecords.get(orgId)!;
  }

  getOrgConsents(orgId: string): ConsentRecordData[] {
    this.syncFromDisk();
    if (!this.consentRecords.has(orgId)) {
      this.consentRecords.set(orgId, []);
    }
    return this.consentRecords.get(orgId)!;
  }

  getOrgDemos(orgId: string): WebsiteDemoData[] {
    this.syncFromDisk();
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
    this.syncFromDisk();
    const list = this.getOrgDemos(orgId);
    const copy = JSON.parse(JSON.stringify(demo));
    list.unshift(copy);
    this.saveToDisk();
    return copy;
  }

  updateDemo(orgId: string, id: string, updates: Partial<WebsiteDemoData>): WebsiteDemoData | null {
    this.syncFromDisk();
    const list = this.getOrgDemos(orgId);
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) return null;
    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToDisk();
    return JSON.parse(JSON.stringify(list[index]));
  }

  /**
   * True when a public token is already used by a *different* demo in the
   * in-memory ledger (mirrors the unique `publicToken` column in Postgres).
   */
  hasPublicToken(token: string, exceptDemoId?: string): boolean {
    this.syncFromDisk();
    const clean = token.trim().toLowerCase();
    if (!clean) return false;
    for (const demos of Array.from(this.demos.values())) {
      if (demos.some((d) => d.id !== exceptDemoId && d.publicToken?.toLowerCase() === clean)) {
        return true;
      }
    }
    return false;
  }

  getDemoByPublicToken(token: string): WebsiteDemoData | null {
    this.syncFromDisk();
    const cleanToken = token.trim().toLowerCase();
    for (const demos of Array.from(this.demos.values())) {
      const found = demos.find((d: WebsiteDemoData) => {
        if (d.publicToken && d.publicToken.toLowerCase() === cleanToken) {
          return true;
        }
        const brandName =
          (d.content as any)?.brand?.businessName ||
          (d.content as any)?.brandName;
        if (brandName) {
          const slug = generatePublicDemoToken(brandName).toLowerCase();
          if (slug === cleanToken) {
            return true;
          }
        }
        return false;
      });
      if (found) {
        return JSON.parse(JSON.stringify(found));
      }
    }
    return null;
  }

  recordDemoView(orgId: string, demoId: string): WebsiteDemoData | null {
    this.syncFromDisk();
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
    this.saveToDisk();
    return JSON.parse(JSON.stringify(demo));
  }
}

const globalForDemoStore = globalThis as unknown as {
  __getvisible_demo_store__?: DemoDataStore;
  __leadforge_demo_store__?: DemoDataStore;
};

export const demoStore: DemoDataStore =
  (globalForDemoStore.__getvisible_demo_store__ ?? globalForDemoStore.__leadforge_demo_store__)
    ?.schemaVersion === DEMO_STORE_SCHEMA_VERSION
    ? (globalForDemoStore.__getvisible_demo_store__ ??
        globalForDemoStore.__leadforge_demo_store__)!
    : new DemoDataStore();

if (process.env.NODE_ENV !== 'production' || isExplicitDemoMode()) {
  globalForDemoStore.__getvisible_demo_store__ = demoStore;
  globalForDemoStore.__leadforge_demo_store__ = demoStore;
}

export { isExplicitDemoMode };


/**
 * Idempotently ensures an Organization row exists in PostgreSQL.
 *
 * Every record has a foreign key to `organizations`, but nothing in the runtime
 * ever created that row (only the offline seed script did). Without this, the very
 * first production write — uploading a lead, saving a demo — fails with a
 * foreign-key violation and nothing persists. Cached per serverless instance.
 */
const ensuredOrganizationIds = new Set<string>();
async function ensureOrganizationRow(organizationId: string): Promise<void> {
  if (!organizationId || ensuredOrganizationIds.has(organizationId)) return;
  const { prisma } = await import('./prisma');
  await prisma.organization.upsert({
    where: { id: organizationId },
    update: {},
    create: {
      id: organizationId,
      name:
        organizationId === DEMO_ORGANIZATION_ID
          ? 'Gurgaon CA Demo Agency'
          : 'Gurgaon CA Pilot Workspace',
      slug: organizationId,
    },
  });
  ensuredOrganizationIds.add(organizationId);
}

/**
 * Ensures production mode does NOT silently fake data.
 */
async function ensureDatabaseMode(): Promise<void> {
  if (isExplicitDemoMode() && process.env.NODE_ENV === 'production') {
    const g = globalThis as unknown as { __gvDemoModeWarned?: boolean };
    if (!g.__gvDemoModeWarned) {
      g.__gvDemoModeWarned = true;
      console.warn(
        '[GetVisible] WARNING: DEMO_MODE=true in a production build. Data is held in an in-memory store mirrored to .data/ and is NOT durable or concurrency-safe. Set DEMO_MODE=false and provide DATABASE_URL for a production deployment.'
      );
    }
  }

  if (!isExplicitDemoMode()) {
    // If not in demo mode, verify PostgreSQL connectivity.
    // When live Prisma client is used, connection failure throws an explicit DatabaseConnectionError.
    try {
      const { prisma } = await import('./prisma');
      await prisma.$queryRaw`SELECT 1`;
      // Guarantee the active organization rows exist before any write occurs.
      await ensureOrganizationRow(DEMO_ORGANIZATION_ID);
      await ensureOrganizationRow(PILOT_ORGANIZATION_ID);
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
  const existingUrl = typeof copy.screenshotUrl === 'string' ? copy.screenshotUrl : '';
  const isBrokenMicrolink =
    existingUrl.includes('api.microlink.io') &&
    (existingUrl.includes('localhost') || existingUrl.includes('127.0.0.1'));
  // Upgrade dead or legacy preview references (old screen.png/screen.svg art or
  // the never-written /generated-screenshots path) to the current Stitch art.
  const isLegacyPreviewArt = /\/demo-templates\/[^/]+\/(?:screen|hero)\.(?:png|svg)$/i.test(
    existingUrl
  );
  const isMissingGeneratedShot = existingUrl.startsWith('/generated-screenshots/');
  if (!existingUrl || isBrokenMicrolink || isLegacyPreviewArt || isMissingGeneratedShot) {
    const layout =
      (copy.design as any)?.layout ||
      (contentObj?.design as any)?.layout ||
      (copy.templateId as string);
    copy.screenshotUrl = getTemplateScreenshotPath(layout);
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
      let items = demoStore.getOrgLeads(organizationId);
      let lead = items.find(
        (l) =>
          l.id === cleanId ||
          generatePublicDemoToken(l.businessName).toLowerCase() === cleanId.toLowerCase()
      );
      if (!lead) return null;

      // Attach org suppressions, consents, and demos
      const suppressions = demoStore.getOrgSuppressions(organizationId).filter((s) => s.leadId === lead.id);
      const consents = demoStore.getOrgConsents(organizationId).filter((c) => c.leadId === lead.id);
      const demos = demoStore.getDemosForLead(organizationId, lead.id).map(normalizeWebsiteDemo);
      return {
        ...lead,
        suppressionRecords: suppressions,
        consentRecords: consents,
        websiteDemos: demos,
      };
    }

    const { prisma } = await import('./prisma');
    const lead = await prisma.lead.findFirst({
      where: {
        organizationId,
        OR: [
          { id: cleanId },
          { businessName: { equals: cleanId.replace(/-/g, ' '), mode: 'insensitive' } },
        ],
      },
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
      demoStore.saveToDisk();

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
   * Permanently delete a lead and all associated demos.
   */
  static async deleteLead(leadId: string, organizationId: string): Promise<boolean> {
    await ensureDatabaseMode();
    const cleanId = leadId ? leadId.trim() : '';
    if (!cleanId) return false;

    // 1. Delete associated website demos
    await WebsiteDemoRepository.deleteDemosForLead(organizationId, cleanId);

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      let deleted = false;
      for (const [org, leads] of Array.from(demoStore.getLeadsMap().entries())) {
        const initialLen = leads.length;
        const filtered = leads.filter((l) => l.id !== cleanId);
        if (filtered.length !== initialLen) {
          demoStore.setOrgLeads(org, filtered);
          deleted = true;
        }
      }
      if (deleted) {
        demoStore.saveToDisk();
      }
      return deleted;
    }

    const { prisma } = await import('./prisma');
    await prisma.lead.delete({
      where: { id: cleanId },
    }).catch(() => null);
    return true;
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

      // Auto-revoke public website demo if prospect is not interested / opt-out / lost
      if (newStatus === 'NOT_INTERESTED' || newStatus === 'DO_NOT_CONTACT' || newStatus === 'LOST') {
        await WebsiteDemoRepository.deleteDemosForLead(organizationId, leadId);
        lead.websiteDemos = [];
      }

      demoStore.saveToDisk();
      return lead;
    }

    const { prisma } = await import('./prisma');
    const existing = await prisma.lead.findFirst({
      where: { id: leadId, organizationId },
    });

    if (!existing) {
      throw new Error(`Lead ${leadId} not found in organization.`);
    }

    // Enforce the same lifecycle rules as the in-memory branch. Without this the
    // Prisma/Postgres path accepted any status jump (e.g. LOST -> CONTACTED or
    // DO_NOT_CONTACT -> INTERESTED), silently resurrecting suppressed leads.
    const transition = validateStatusTransition(existing.leadStatus as LeadStatus, newStatus);
    if (!transition.allowed) {
      throw new Error(transition.reason || `Transition from ${existing.leadStatus} to ${newStatus} is not allowed.`);
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

    // Auto-revoke public website demo if prospect is not interested / opt-out / lost
    if (newStatus === 'NOT_INTERESTED' || newStatus === 'DO_NOT_CONTACT' || newStatus === 'LOST') {
      await WebsiteDemoRepository.deleteDemosForLead(organizationId, leadId);
    }

    return updated as unknown as LeadData;
  }

  /**
   * Update a single profile field of a lead (profession only, kept minimal).
   * Used by the owner dashboard to correct a mis-categorised trade *before*
   * demo generation: the demo's design, imagery and tag line all derive from
   * the recorded profession, so a wrong value bakes the wrong industry into
   * the site. Writes an audit entry like every other owner mutation.
   */
  static async updateLeadProfession(
    leadId: string,
    profession: string,
    organizationId: string,
    actorName: string
  ): Promise<LeadData> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }
    const nextProfession = String(profession || '').trim();
    if (nextProfession.length < 2 || nextProfession.length > 80) {
      throw new Error('Profession must be between 2 and 80 characters.');
    }

    if (isExplicitDemoMode()) {
      const lead = demoStore.getOrgLeads(organizationId).find((l) => l.id === leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} not found in organization.`);
      }
      const oldProfession = lead.profession;
      lead.profession = nextProfession;
      lead.updatedAt = new Date().toISOString();
      const audit = createAuditLogEntry({
        action: 'LEAD_PROFILE_UPDATED',
        entity: 'Lead',
        entityId: leadId,
        actor: actorName,
        organizationId,
        details: { field: 'profession', from: oldProfession, to: nextProfession },
      });
      demoStore.getOrgAuditLogs(organizationId).unshift(audit);
      demoStore.saveToDisk();
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
      data: { profession: nextProfession },
    });

    await prisma.auditLog.create({
      data: {
        action: 'LEAD_PROFILE_UPDATED',
        entity: 'Lead',
        entityId: leadId,
        actor: actorName,
        organizationId,
        details: { field: 'profession', from: existing.profession, to: nextProfession },
      },
    });

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

      demoStore.saveToDisk();
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
      demoStore.saveToDisk();
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
   * Persists an audit log entry in whichever storage mode is active.
   *
   * `createAuditLogEntry()` only *builds* the object — it does not write it. Every
   * call site must route through this helper, otherwise `await
   * createAuditLogEntry({...})` silently discards the entry (which is what
   * happened for DEMO_GENERATED/DEMO_APPROVED/DEMO_REJECTED events).
   */
  static async addAuditLog(
    organizationId: string,
    params: CreateAuditLogParams
  ): Promise<AuditLogData> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    const entry = createAuditLogEntry({ ...params, organizationId });

    if (isExplicitDemoMode()) {
      demoStore.getOrgAuditLogs(organizationId).unshift(entry);
      return entry;
    }

    const { prisma } = await import('./prisma');
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        actor: entry.actor,
        organizationId,
        details: (entry.details || {}) as never,
      },
    });

    return entry;
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

/**
 * Collapses duplicate public-view reports for the same demo.
 *
 * A single prospect visit can be reported twice: once by the server-rendered
 * demo page and once by the client-side fallback fetch. The window is short
 * enough that it never suppresses a genuine second visit.
 */
const recentPublicDemoViews = new Map<string, number>();
const PUBLIC_DEMO_VIEW_DEDUPE_MS = 5_000;

export class WebsiteDemoRepository {
  /**
   * Delete a website demo by demoId, leadId, or publicToken.
   */
  static async deleteDemo(organizationId: string, demoId: string): Promise<boolean> {
    await ensureDatabaseMode();
    const cleanId = demoId ? demoId.trim() : '';
    if (!cleanId) return false;

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      let deleted = false;
      for (const [org, demos] of Array.from(demoStore.getDemosMap().entries())) {
        // Tenancy guard: never touch another organization's demos.
        if (org !== organizationId) continue;
        const initialLen = demos.length;
        const filtered = demos.filter(
          (d) =>
            d.id !== cleanId &&
            d.leadId !== cleanId &&
            d.publicToken !== cleanId &&
            generatePublicDemoToken(d.content?.brand?.businessName || (d.content as any)?.brandName).toLowerCase() !== cleanId.toLowerCase()
        );
        if (filtered.length !== initialLen) {
          demoStore.setOrgDemos(org, filtered);
          deleted = true;
        }
      }
      if (deleted) {
        demoStore.saveToDisk();
      }
      return deleted;
    }

    const { prisma } = await import('./prisma');
    const res = await prisma.websiteDemo.deleteMany({
      where: {
        organizationId,
        OR: [
          { id: cleanId },
          { leadId: cleanId },
          { publicToken: cleanId },
        ],
      },
    });
    return res.count > 0;
  }

  /**
   * Delete all website demos for a lead.
   */
  static async deleteDemosForLead(organizationId: string, leadId: string): Promise<number> {
    await ensureDatabaseMode();
    const cleanId = leadId ? leadId.trim() : '';
    if (!cleanId) return 0;

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      let count = 0;
      for (const [org, demos] of Array.from(demoStore.getDemosMap().entries())) {
        // Tenancy guard: never touch another organization's demos.
        if (org !== organizationId) continue;
        const initialLen = demos.length;
        const filtered = demos.filter((d) => d.leadId !== cleanId && d.id !== cleanId);
        const removed = initialLen - filtered.length;
        if (removed > 0) {
          count += removed;
          demoStore.setOrgDemos(org, filtered);
        }
      }
      if (count > 0) {
        demoStore.saveToDisk();
      }
      return count;
    }

    const { prisma } = await import('./prisma');
    const res = await prisma.websiteDemo.deleteMany({
      where: { leadId: cleanId, organizationId },
    });
    return res.count;
  }

  /**
   * Physically removes every demo whose public-link TTL (3 days) has elapsed.
   *
   * Called opportunistically whenever a public demo link is opened, and by the
   * daily `/api/cron/prune-demos` job, so demos never outlive their window unless
   * retained on purpose. Returns the number of demos removed.
   */
  static async pruneExpiredDemos(): Promise<number> {
    await ensureDatabaseMode();

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      let removed = 0;
      for (const [org, demos] of Array.from(demoStore.getDemosMap().entries())) {
        const filtered = demos.filter((d) => !isDemoExpired(d));
        if (filtered.length !== demos.length) {
          removed += demos.length - filtered.length;
          demoStore.setOrgDemos(org, filtered);
        }
      }
      if (removed > 0) {
        demoStore.saveToDisk();
      }
      return removed;
    }

    const { prisma } = await import('./prisma');
    const res = await prisma.websiteDemo.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - DEMO_PUBLIC_TTL_MS) } },
    });
    return res.count;
  }

  /**
   * List website demos strictly scoped by organizationId, optionally filtered by leadId.
   */
  static async listDemos(organizationId: string, leadId?: string): Promise<WebsiteDemoData[]> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    if (isExplicitDemoMode()) {
      const activeOnly = (demos: WebsiteDemoData[]) => demos.filter((d) => !isDemoExpired(d));
      if (leadId) {
        return activeOnly(demoStore.getDemosForLead(organizationId, leadId)).map(normalizeWebsiteDemo);
      }
      return activeOnly(demoStore.getOrgDemos(organizationId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(normalizeWebsiteDemo);
    }

    const { prisma } = await import('./prisma');
    const where: Record<string, unknown> = {
      organizationId,
      createdAt: { gte: new Date(Date.now() - DEMO_PUBLIC_TTL_MS) },
    };
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
  /**
   * Public tokens are readable brand slugs ("sharma-and-associates"), so two
   * demos for the same business name — a regeneration (v2 keeps v1), a second
   * lead with a similar name, or the demo page auto-creating one — would try to
   * write the same token into the unique `publicToken` column and fail with
   * `Unique constraint failed on the fields: (publicToken)`.
   *
   * Keeps the readable slug for the first demo and appends `-2`, `-3`, … for
   * later ones. Concurrent writers are additionally covered by the P2002 retry
   * in `saveDemo`.
   */
  private static async resolveUniquePublicToken(base: string, demoId: string): Promise<string> {
    const cleanBase = (base || '').trim() || crypto.randomBytes(16).toString('base64url');

    const isTaken = async (candidate: string): Promise<boolean> => {
      if (isExplicitDemoMode()) {
        return demoStore.hasPublicToken(candidate, demoId);
      }
      const { prisma } = await import('./prisma');
      const hit = await prisma.websiteDemo.findFirst({
        where: { publicToken: { equals: candidate, mode: 'insensitive' } },
        select: { id: true },
      });
      return Boolean(hit && hit.id !== demoId);
    };

    if (!(await isTaken(cleanBase))) return cleanBase;

    for (let suffix = 2; suffix < 50; suffix += 1) {
      const candidate = `${cleanBase}-${suffix}`;
      if (!(await isTaken(candidate))) return candidate;
    }
    return `${cleanBase}-${crypto.randomBytes(3).toString('hex')}`;
  }

  static async saveDemo(
    organizationId: string,
    demo: WebsiteDemoData,
    actorName = 'system'
  ): Promise<WebsiteDemoData> {
    await ensureDatabaseMode();

    if (!organizationId) {
      throw new Error('Unauthorized: organizationId is required for data isolation.');
    }

    const brandName =
      (demo.content as any)?.brand?.businessName ||
      (demo.content as any)?.brandName ||
      (demo as any).businessName;
    const publicToken = await this.resolveUniquePublicToken(
      demo.publicToken || generatePublicDemoToken(brandName),
      demo.id
    );

    const demoWithToken: WebsiteDemoData = {
      ...demo,
      publicToken,
      approvalStatus: demo.approvalStatus || 'PENDING_REVIEW',
      viewCount: demo.viewCount || 0,
    };

    if (isExplicitDemoMode()) {
      const saved = demoStore.saveDemo(organizationId, demoWithToken);
      await LeadRepository.addAuditLog(organizationId, {
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
    const createDemoRow = (token: string) =>
      prisma.websiteDemo.create({
        data: {
          id: demoWithToken.id,
          leadId: demoWithToken.leadId,
          organizationId,
          templateId: demoWithToken.templateId,
          version: demoWithToken.version,
          generationStatus: demoWithToken.generationStatus,
          approvalStatus: demoWithToken.approvalStatus,
          publicToken: token,
          viewCount: demoWithToken.viewCount || 0,
          content: demoWithToken.content as any,
          theme: demoWithToken.theme as any,
          error: demoWithToken.error || null,
        },
      });

    let created;
    try {
      created = await createDemoRow(publicToken);
    } catch (error: unknown) {
      // Race: another generation claimed the same brand slug between our
      // uniqueness probe and the insert. Fall back to a random suffix.
      const code = (error as { code?: string } | null)?.code;
      const target = String(
        (error as { meta?: { target?: unknown } } | null)?.meta?.target || ''
      ).toLowerCase();
      if (code === 'P2002' && target.includes('publictoken')) {
        created = await createDemoRow(
          `${publicToken}-${crypto.randomBytes(3).toString('hex')}`
        );
      } else {
        throw error;
      }
    }

    await LeadRepository.addAuditLog(organizationId, {
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
        await LeadRepository.addAuditLog(organizationId, {
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

    await LeadRepository.addAuditLog(organizationId, {
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
    const lead = await LeadRepository.getLeadById(demo.leadId, organizationId);
    const brandName =
      (demo.content as any)?.brand?.businessName ||
      (demo.content as any)?.brandName ||
      lead?.businessName;
    const publicToken = generatePublicDemoToken(brandName) || demo.publicToken || generatePublicDemoToken();
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
    await LeadRepository.addAuditLog(organizationId, {
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
    await LeadRepository.addAuditLog(organizationId, {
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
      if (isDemoExpired(demo)) {
        // Public-link TTL elapsed: remove it so the shared link stops working.
        await this.deleteDemo(demo.organizationId, demo.id);
        return null;
      }
      return normalizeWebsiteDemo(demo);
    }

    const { prisma } = await import('./prisma');
    // Exact, case-insensitive lookup on the indexed unique column first.
    let demo = await prisma.websiteDemo.findFirst({
      where: {
        publicToken: { equals: cleanToken, mode: 'insensitive' },
        approvalStatus: 'APPROVED',
      },
    });

    if (!demo) {
      // Legacy fallback for demos whose stored publicToken is not the readable
      // brand slug. Bounded and index-ordered (createdAt) so this can never
      // degrade into an unbounded full-table scan on every public request.
      const recentApproved = await prisma.websiteDemo.findMany({
        where: { approvalStatus: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      demo =
        recentApproved.find((d) => {
          if (d.publicToken?.toLowerCase() === cleanToken.toLowerCase()) return true;
          const brandName =
            (d.content as any)?.brand?.businessName ||
            (d.content as any)?.brandName;
          if (brandName) {
            const slug = generatePublicDemoToken(brandName).toLowerCase();
            if (slug === cleanToken.toLowerCase()) return true;
          }
          return false;
        }) || null;
    }

    if (demo && isDemoExpired(demo)) {
      // Public-link TTL elapsed: remove it so the shared link stops working.
      await this.deleteDemo(demo.organizationId, demo.id);
      return null;
    }

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
    // Deduplicate: the SSR page and the client fallback can both report the same
    // visit, which previously incremented viewCount twice for one prospect.
    const dedupeKey = `${organizationId}:${demoId}`;
    const nowMs = Date.now();
    const lastSeen = recentPublicDemoViews.get(dedupeKey) || 0;
    if (nowMs - lastSeen < PUBLIC_DEMO_VIEW_DEDUPE_MS) return;
    if (recentPublicDemoViews.size > 5_000) {
      for (const [key, seenAt] of Array.from(recentPublicDemoViews.entries())) {
        if (nowMs - seenAt >= PUBLIC_DEMO_VIEW_DEDUPE_MS) recentPublicDemoViews.delete(key);
      }
    }
    recentPublicDemoViews.set(dedupeKey, nowMs);

    const demo = await this.getDemo(organizationId, demoId);
    if (!demo) return;

    let newViewCount = 1;
    if (isExplicitDemoMode()) {
      const updated = demoStore.recordDemoView(organizationId, demoId);
      newViewCount = updated?.viewCount || 1;
      await LeadRepository.addActivity(organizationId, demo.leadId, {
        type: 'DEMO_VIEW',
        title: 'Public Demo Viewed',
        description: 'Prospect opened public website concept via shared link.',
        metadata: {
          publicToken: demo.publicToken,
          version: demo.version,
          viewCount: newViewCount,
        },
      });
    } else {
      const { prisma } = await import('./prisma');
      const now = new Date();
      newViewCount = (demo.viewCount || 0) + 1;
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
          viewCount: newViewCount,
        },
      });
    }

    // Optional High-Intent Webhook Alert (Telegram Bot)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const contentObj =
          typeof demo.content === 'string' ? JSON.parse(demo.content) : demo.content;
        const bizName = contentObj?.brand?.businessName || 'Prospect Practice';
        const city = contentObj?.location?.city || contentObj?.meta?.city || 'Delhi NCR';
        const tgMsg = `🔥 High Intent Alert: ${bizName} (${city}) just opened their website demo! (View #${newViewCount})`;

        fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: tgMsg,
          }),
        }).catch(() => {});
      } catch {
        // Non-blocking
      }
    }
  }
}

export interface SaveDemoMediaInput {
  mime: string;
  data: Buffer;
  sourceUrl?: string | null;
  attribution?: string | null;
  purpose?: string | null;
}

export interface DemoMediaSummary {
  id: string;
  mime: string;
  byteSize: number;
  sourceUrl?: string | null;
  attribution?: string | null;
  purpose?: string | null;
  createdAt: string;
}

/**
 * Persisted storage for demo imagery downloaded from the live web (Openverse).
 *
 * - Demo mode: in-memory store mirrored to `.data/` (base64 payloads).
 * - Production: `demo_media` table (BYTEA) in PostgreSQL/Neon.
 *
 * Assets are addressable by unguessable random ids and intentionally NOT bound
 * to an organization — the public demo sites embed `/api/media/<id>` URLs.
 */
export class MediaRepository {
  static async saveDemoMediaAsset(input: SaveDemoMediaInput): Promise<DemoMediaSummary> {
    await ensureDatabaseMode();

    const mime = (input.mime || '').trim() || 'application/octet-stream';
    const data = input.data;
    const byteSize = data.byteLength;
    const createdAt = new Date().toISOString();

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      if (input.sourceUrl) {
        const existing = demoStore.getMediaBySourceUrl(input.sourceUrl);
        if (existing) {
          return {
            id: existing.id,
            mime: existing.mime,
            byteSize: existing.byteSize,
            sourceUrl: existing.sourceUrl,
            attribution: existing.attribution,
            purpose: existing.purpose,
            createdAt: existing.createdAt,
          };
        }
      }
      const record: DemoMediaRecord = {
        id: randomMediaId(),
        mime,
        dataBase64: data.toString('base64'),
        byteSize,
        sourceUrl: input.sourceUrl ?? null,
        attribution: input.attribution ?? null,
        purpose: input.purpose ?? null,
        createdAt,
      };
      demoStore.putMedia([record]);
      demoStore.saveToDisk();
      return {
        id: record.id,
        mime,
        byteSize,
        sourceUrl: record.sourceUrl,
        attribution: record.attribution,
        purpose: record.purpose,
        createdAt,
      };
    }

    const { prisma } = await import('./prisma');
    if (input.sourceUrl) {
      const existing = await prisma.demoMedia.findFirst({
        where: { sourceUrl: input.sourceUrl },
        orderBy: { createdAt: 'asc' },
      });
      if (existing) {
        return {
          id: existing.id,
          mime: existing.mime,
          byteSize: existing.byteSize,
          sourceUrl: existing.sourceUrl,
          attribution: existing.attribution,
          purpose: existing.purpose,
          createdAt: existing.createdAt.toISOString(),
        };
      }
    }

    let created;
    try {
      created = await prisma.demoMedia.create({
        data: {
          id: randomMediaId(),
          mime,
          data,
          byteSize,
          sourceUrl: input.sourceUrl || undefined,
          attribution: input.attribution || undefined,
          purpose: input.purpose || undefined,
        },
      });
    } catch (error: unknown) {
      // Concurrent generation of the same industry raced us to the same photo
      // (unique index on sourceUrl) — reuse the winner instead of failing.
      const code = (error as { code?: string } | null)?.code;
      if (code === 'P2002' && input.sourceUrl) {
        const winner = await prisma.demoMedia.findFirst({
          where: { sourceUrl: input.sourceUrl },
          orderBy: { createdAt: 'asc' },
        });
        if (winner) {
          return {
            id: winner.id,
            mime: winner.mime,
            byteSize: winner.byteSize,
            sourceUrl: winner.sourceUrl,
            attribution: winner.attribution,
            purpose: winner.purpose,
            createdAt: winner.createdAt.toISOString(),
          };
        }
      }
      throw error;
    }

    return {
      id: created.id,
      mime: created.mime,
      byteSize: created.byteSize,
      sourceUrl: created.sourceUrl,
      attribution: created.attribution,
      purpose: created.purpose,
      createdAt: created.createdAt.toISOString(),
    };
  }

  /**
   * Finds an already-hosted asset for an origin image URL so the same photo is
   * never downloaded/stored twice (across serverless instances and restarts).
   */
  static async findDemoMediaBySourceUrl(sourceUrl: string): Promise<DemoMediaSummary | null> {
    const cleanUrl = sourceUrl ? sourceUrl.trim() : '';
    if (!cleanUrl) return null;

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      const record = demoStore.getMediaBySourceUrl(cleanUrl);
      if (!record) return null;
      return {
        id: record.id,
        mime: record.mime,
        byteSize: record.byteSize,
        sourceUrl: record.sourceUrl,
        attribution: record.attribution,
        purpose: record.purpose,
        createdAt: record.createdAt,
      };
    }

    const { prisma } = await import('./prisma');
    const row = await prisma.demoMedia.findFirst({
      where: { sourceUrl: cleanUrl },
      orderBy: { createdAt: 'asc' },
    });
    if (!row) return null;
    return {
      id: row.id,
      mime: row.mime,
      byteSize: row.byteSize,
      sourceUrl: row.sourceUrl,
      attribution: row.attribution,
      purpose: row.purpose,
      createdAt: row.createdAt.toISOString(),
    };
  }

  static async getDemoMediaAsset(
    id: string
  ): Promise<{ mime: string; bytes: Uint8Array } | null> {
    const cleanId = id ? id.trim() : '';

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      const record = demoStore.getMediaById(cleanId);
      if (!record) return null;
      return { mime: record.mime, bytes: Buffer.from(record.dataBase64, 'base64') };
    }

    const { prisma } = await import('./prisma');
    const row = await prisma.demoMedia.findUnique({ where: { id: cleanId } });
    if (!row) return null;
    const buffer = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
    return { mime: row.mime, bytes: buffer };
  }
}

function randomMediaId(): string {
  // Publicly served asset ids: cryptographically random so the namespace cannot
  // be walked or guessed.
  return `media-${crypto.randomUUID()}`;
}

export interface SaveIndustryBlueprintInput {
  key: string;
  industry: string;
  blueprint: IndustryDesignBlueprint;
  source: string;
  version: number;
  createdAt: string;
}

export interface IndustryBlueprintSummary {
  key: string;
  industry: string;
  blueprint: IndustryDesignBlueprint;
  source: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Persisted per-industry design blueprints (see `industry-blueprint.ts`).
 *
 * - Demo mode: in-memory store mirrored to `.data/`.
 * - Production: `industry_blueprints` table in PostgreSQL/Neon.
 *
 * Keyed by the normalised industry key so the *first* authored design wins and
 * every later lead in that trade (on any serverless instance) reuses it.
 */
export class IndustryBlueprintRepository {
  static async getIndustryBlueprint(key: string): Promise<IndustryBlueprintSummary | null> {
    const cleanKey = key ? key.trim() : '';
    if (!cleanKey) return null;
    await ensureDatabaseMode();

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      const row = demoStore.getBlueprint(cleanKey);
      return row ? toBlueprintSummary(row) : null;
    }

    const { prisma } = await import('./prisma');
    const row = await prisma.industryBlueprint.findUnique({ where: { key: cleanKey } });
    if (!row) return null;
    return {
      key: row.key,
      industry: row.industry,
      blueprint: row.blueprint as unknown as IndustryDesignBlueprint,
      source: row.source,
      version: row.version,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Saves an authored blueprint. Returns the canonical row — on a concurrent
   * race the first writer's design is returned so all leads stay consistent.
   */
  static async saveIndustryBlueprint(
    input: SaveIndustryBlueprintInput
  ): Promise<IndustryBlueprintSummary | null> {
    const cleanKey = input.key ? input.key.trim() : '';
    if (!cleanKey) return null;
    await ensureDatabaseMode();

    const now = new Date().toISOString();

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      const existing = demoStore.getBlueprint(cleanKey);
      if (existing) return toBlueprintSummary(existing);
      const record: DemoBlueprintRecord = {
        key: cleanKey,
        industry: input.industry,
        blueprint: input.blueprint as unknown as Record<string, unknown>,
        source: input.source,
        version: input.version,
        createdAt: input.createdAt || now,
        updatedAt: now,
      };
      demoStore.putBlueprint(record);
      demoStore.saveToDisk();
      return toBlueprintSummary(record);
    }

    const { prisma } = await import('./prisma');
    try {
      const created = await prisma.industryBlueprint.create({
        data: {
          key: cleanKey,
          industry: input.industry,
          blueprint: input.blueprint as unknown as object,
          source: input.source,
          version: input.version,
        },
      });
      return {
        key: created.key,
        industry: created.industry,
        blueprint: created.blueprint as unknown as IndustryDesignBlueprint,
        source: created.source,
        version: created.version,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (error: unknown) {
      // Another instance authored this industry first (unique key) — adopt theirs.
      const code = (error as { code?: string } | null)?.code;
      if (code === 'P2002') {
        const winner = await prisma.industryBlueprint.findUnique({ where: { key: cleanKey } });
        if (winner) {
          return {
            key: winner.key,
            industry: winner.industry,
            blueprint: winner.blueprint as unknown as IndustryDesignBlueprint,
            source: winner.source,
            version: winner.version,
            createdAt: winner.createdAt.toISOString(),
            updatedAt: winner.updatedAt.toISOString(),
          };
        }
      }
      throw error;
    }
  }
  /**
   * Forgets an industry's authored design so it can be authored again (e.g.
   * after configuring the AI provider, or to replace a design authored by an
   * older rule set). Owner-triggered only.
   */
  static async deleteIndustryBlueprint(key: string): Promise<boolean> {
    const cleanKey = key ? key.trim() : '';
    if (!cleanKey) return false;
    await ensureDatabaseMode();

    if (isExplicitDemoMode()) {
      demoStore.syncFromDisk();
      const existing = demoStore.getBlueprint(cleanKey);
      if (!existing) return false;
      demoStore.removeBlueprint(cleanKey);
      demoStore.saveToDisk();
      return true;
    }

    const { prisma } = await import('./prisma');
    const result = await prisma.industryBlueprint.deleteMany({ where: { key: cleanKey } });
    return result.count > 0;
  }
}

function toBlueprintSummary(row: DemoBlueprintRecord): IndustryBlueprintSummary {
  return {
    key: row.key,
    industry: row.industry,
    blueprint: row.blueprint as unknown as IndustryDesignBlueprint,
    source: row.source,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}


