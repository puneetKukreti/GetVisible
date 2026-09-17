export type LeadStatus =
  | 'NEW'
  | 'QUALIFIED'
  | 'DEMO_GENERATED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONTACTED'
  | 'RESPONDED'
  | 'INTERESTED'
  | 'CONVERTED'
  | 'NOT_INTERESTED'
  | 'RESEARCHING'
  | 'OUTREACH_PENDING'
  | 'REPLIED'
  | 'DO_NOT_CONTACT'
  | 'PROPOSAL'
  | 'CUSTOMER'
  | 'LOST';

export type WebsiteStatus =
  | 'NO_WEBSITE'
  | 'WEBSITE_EXISTS'
  | 'UNKNOWN'
  | 'REQUIRES_REVIEW';

export type Channel = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'VOICE';

export type ConsentStatus =
  | 'UNKNOWN'
  | 'PENDING'
  | 'OPTED_IN'
  | 'OPTED_OUT'
  | 'EXPIRED';

export type JobType =
  | 'LEAD_DISCOVERY'
  | 'WEBSITE_ANALYSIS'
  | 'AI_ANALYSIS'
  | 'DEMO_GENERATION'
  | 'OUTREACH_GENERATION';

export type JobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// Phase 2 Types
export type SourceQuality =
  | 'OFFICIAL'
  | 'AUTHORIZED_API'
  | 'PUBLIC_BUSINESS_DIRECTORY'
  | 'USER_IMPORTED'
  | 'DEMO';

export type WebsiteVerificationStatus =
  | 'UNVERIFIED'
  | 'VERIFIED'
  | 'FAILED'
  | 'REQUIRES_REVIEW';

export type ContactClassification =
  | 'PUBLIC_BUSINESS_EMAIL'
  | 'PUBLIC_BUSINESS_PHONE'
  | 'PUBLIC_PERSONAL_CONTACT'
  | 'UNKNOWN';

export interface FieldProvenance<T = string> {
  rawValue: T;
  normalizedValue: T;
  source: string;
  sourceQuality: SourceQuality;
  timestamp: string;
}

export interface WebsiteVerificationEvidence {
  status: WebsiteVerificationStatus;
  businessNameFound: boolean;
  phoneMatch: boolean;
  addressMatch: boolean;
  domainMatch: boolean;
  details: string;
  verifiedAt: string;
}

export interface LeadValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  organizationId: string;
  organizationName: string;
}

export interface ContactData {
  id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
  linkedinUrl?: string | null;
  classification?: ContactClassification;
  leadId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteData {
  id: string;
  url: string;
  status: WebsiteStatus;
  cms?: string | null;
  speedScore?: number | null;
  mobileFriendly: boolean;
  hasSsl: boolean;
  auditNotes?: string | null;
  verificationStatus?: WebsiteVerificationStatus;
  verificationEvidence?: WebsiteVerificationEvidence | null;
  leadId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// Phase 4 - Personalized Website Demo Types
export type ContentProvenance =
  | 'VERIFIED_LEAD'
  | 'VERIFIED_SOURCE'
  | 'USER_ENTERED'
  | 'AI_SYNTHESIZED'
  | 'NEUTRAL_PLACEHOLDER';

export interface WebsiteTheme {
  id?: string;
  name?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'sans' | 'serif';
  style: 'corporate' | 'modern' | 'minimal';
  borderRadius: 'none' | 'sm' | 'md' | 'lg';
}

export type WebsiteTemplate =
  | 'EDITORIAL_FINANCE'
  | 'MODERN_FINTECH'
  | 'LUXURY_PROFESSIONAL'
  | 'SWISS_MINIMAL'
  | 'MODERN_INDIAN';

export type WebsiteLayout =
  | WebsiteTemplate
  | 'MODERN_CORPORATE'
  | 'PREMIUM_PROFESSIONAL'
  | 'TRADITIONAL_CA';

export type WebsiteSectionType =
  | 'HERO'
  | 'TRUST'
  | 'SERVICES'
  | 'ABOUT'
  | 'EXPERTISE'
  | 'PROCESS'
  | 'WHY_CHOOSE_US'
  | 'INDUSTRIES'
  | 'TESTIMONIALS'
  | 'FAQ'
  | 'CONTACT'
  | 'CTA'
  | 'LOCATION';

export interface WebsiteDesign {
  layout: WebsiteLayout;
  template?: WebsiteTemplate;
  theme: WebsiteTheme;
  sectionOrder: WebsiteSectionType[];
  heroLayout?: string;
  servicesLayout?: string;
  features?: {
    showVisualArtwork?: boolean;
    floatingHeader?: boolean;
    hairlineBorders?: boolean;
    monochromeGrid?: boolean;
    showLocationHighlight?: boolean;
    [key: string]: any;
  };
  contentDensity?: 'compact' | 'comfortable' | 'spacious';
}

export interface WebsiteProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface WebsiteTrustBadge {
  title: string;
  description: string;
  iconName?: string;
}

export interface WebsiteExpertiseItem {
  title: string;
  description: string;
  tags?: string[];
}

export interface WebsiteCtaBanner {
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export interface WebsiteNavigationItem {
  label: string;
  href: string;
}

export interface WebsiteContent {
  meta: {
    title: string;
    description: string;
    profession: string;
    templateId: string;
  };
  brand: {
    businessName: string;
    tagline: string;
    provenance: ContentProvenance;
  };
  theme: WebsiteTheme;
  design?: WebsiteDesign;
  navigation: {
    items: WebsiteNavigationItem[];
    ctaText: string;
    ctaHref: string;
  };
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    provenance: ContentProvenance;
  };
  about: {
    title: string;
    leadParagraph: string;
    body: string;
    highlights: { title: string; description: string }[];
    provenance: ContentProvenance;
  };
  services: {
    sectionTitle: string;
    sectionSubtitle: string;
    items: {
      id: string;
      title: string;
      description: string;
      isConfirmed: boolean;
      provenance: ContentProvenance;
    }[];
  };
  whyChooseUs: {
    sectionTitle: string;
    sectionSubtitle: string;
    points: {
      title: string;
      description: string;
      iconName?: string;
    }[];
  };
  process?: {
    sectionTitle: string;
    sectionSubtitle: string;
    steps: WebsiteProcessStep[];
  };
  trust?: {
    sectionTitle: string;
    badges: WebsiteTrustBadge[];
  };
  expertise?: {
    sectionTitle: string;
    sectionSubtitle: string;
    items: WebsiteExpertiseItem[];
  };
  ctaBanner?: WebsiteCtaBanner;
  industries: {
    enabled: boolean;
    sectionTitle: string;
    items: string[];
  };
  testimonials: {
    enabled: boolean;
    sectionTitle: string;
    items: {
      quote: string;
      author: string;
      role?: string;
      isPlaceholder: boolean;
    }[];
  };
  faq: {
    sectionTitle: string;
    items: {
      question: string;
      answer: string;
    }[];
  };
  contact: {
    sectionTitle: string;
    sectionSubtitle: string;
    formTitle: string;
    simulatedDisclaimer: string;
    publicEmail: string | null;
    publicPhone: string | null;
    ctaSubmitText: string;
  };
  location: {
    address: string;
    city: string;
    officeHours: string;
    mapPlaceholder: boolean;
  };
  footer: {
    copyright: string;
    disclaimer: string;
  };
}

export type DemoApprovalStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface WebsiteDemoData {
  id: string;
  leadId: string;
  organizationId: string;
  templateId: string;
  version: number;
  generationStatus: 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  approvalStatus?: DemoApprovalStatus;
  isActive?: boolean;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  publicToken?: string | null;
  viewCount?: number;
  firstViewedAt?: string | null;
  lastViewedAt?: string | null;
  content: WebsiteContent;
  theme: WebsiteTheme;
  design?: WebsiteDesign;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityData {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  leadId: string;
  userId?: string | null;
  organizationId: string;
  createdAt: string;
}

export interface AuditLogData {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actor: string;
  actorId?: string | null;
  organizationId: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ConsentRecordData {
  id: string;
  leadId: string;
  organizationId: string;
  channel: Channel;
  status: ConsentStatus;
  source: string;
  evidence?: string | null;
  timestamp: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuppressionRecordData {
  id: string;
  leadId: string;
  organizationId: string;
  channel: Channel;
  reason: string;
  createdAt: string;
  createdBy?: string | null;
}

export interface JobData {
  id: string;
  organizationId: string;
  type: JobType;
  status: JobStatus;
  leadId?: string | null;
  progress: number;
  error?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface LeadNoteData {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;
}

export interface OutreachMessage {
  subject?: string;
  message: string;
  personalizationReason: string;
}

export interface OutreachInput {
  businessName: string;
  profession: string;
  city: string;
  contactName?: string;
  publicEmail?: string | null;
  publicPhone?: string | null;
  demoUrl: string;
  templateName?: string;
  themeName?: string;
  opportunityReason?: string;
}

export interface LeadData {
  id: string;
  businessName: string;
  profession: string;
  city: string;
  address: string;
  website?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  source: string;
  sourceUrl?: string | null;
  sourceQuality?: SourceQuality;
  websiteStatus: WebsiteStatus;
  leadStatus: LeadStatus;
  opportunityScore: number;
  opportunityReason: string;
  isDemoData: boolean;
  isPossibleDuplicate?: boolean;
  duplicateNotes?: string;
  fieldProvenance?: {
    businessName?: FieldProvenance;
    website?: FieldProvenance;
    publicEmail?: FieldProvenance;
    publicPhone?: FieldProvenance;
    address?: FieldProvenance;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;

  contacts?: ContactData[];
  websites?: WebsiteData[];
  activities?: ActivityData[];
  consentRecords?: ConsentRecordData[];
  suppressionRecords?: SuppressionRecordData[];
  jobs?: JobData[];
  websiteDemos?: WebsiteDemoData[];
  notes?: LeadNoteData[];
  contactChannel?: Channel | null;
}

export interface LeadFilterParams {
  search?: string;
  profession?: string | 'ALL';
  city?: string | 'ALL';
  leadStatus?: LeadStatus | 'ALL';
  websiteStatus?: WebsiteStatus | 'ALL';
  source?: string | 'ALL';
  isDemoData?: boolean | 'ALL';
  verificationStatus?: WebsiteVerificationStatus | 'ALL';
  hasContact?: 'ANY' | 'EMAIL' | 'PHONE' | 'BOTH';
  channel?: Channel | 'ALL';
  minScore?: number;
  maxScore?: number;
  sortBy?: 'opportunityScore' | 'createdAt' | 'businessName' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedLeads {
  leads: LeadData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  demos: number;
  demosApproved: number;
  contacted: number;
  replies: number;
  interested: number;
  converted: number;
  customers: number;
  suppressionCount: number;
  activeJobsCount: number;
}

// Phase 6 — Sales Analytics & Funnel Intelligence Types
export type DateRangeOption =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'ALL_TIME'
  | 'CUSTOM';

export interface DateRangeFilter {
  preset: DateRangeOption;
  startDate?: string;
  endDate?: string;
}

export interface SalesFunnelStage {
  id: string;
  label: string;
  count: number;
  percentOfPrevious: number;
  percentOfTotal: number;
}

export interface SalesFunnelData {
  totalLeads: number;
  qualified: number;
  demosGenerated: number;
  demosApproved: number;
  contacted: number;
  responded: number;
  interested: number;
  converted: number;
  stages: SalesFunnelStage[];
}

export interface ConversionRates {
  qualificationRate: number;
  demoGenerationRate: number;
  demoApprovalRate: number;
  contactRate: number;
  responseRate: number;
  interestRate: number;
  conversionRate: number;
  overallLeadToCustomerRate: number;
}

export interface ActivityTrendPoint {
  period: string; // e.g. YYYY-MM-DD or Week label
  leadsAdded: number;
  qualified: number;
  demosGenerated: number;
  demosApproved: number;
  contacted: number;
  responded: number;
  interested: number;
  converted: number;
}

export interface BreakdownMetric {
  name: string;
  leads: number;
  qualified: number;
  demos: number;
  approved: number;
  contacted: number;
  responded: number;
  interested: number;
  converted: number;
}

export interface LeadAgingBucket {
  stage: LeadStatus;
  stageLabel: string;
  count: number;
  averageDaysInStage: number;
  staleCount: number; // Untouched in stage for 7+ days
  staleLeadIds: string[];
}

export type ActionQueueType =
  | 'NEED_DEMO_REVIEW'
  | 'APPROVED_NOT_CONTACTED'
  | 'CONTACTED_NO_RESPONSE'
  | 'INTERESTED_FOLLOWUP';

export interface ActionQueueItem {
  id: string;
  type: ActionQueueType;
  title: string;
  description: string;
  count: number;
  leadIds: string[];
  actionLabel: string;
  actionUrl: string;
}

export interface OperationalScoreRule {
  id: string;
  label: string;
  points: number;
  satisfied: boolean;
  explanation: string;
}

export interface OperationalLeadScore {
  score: number;
  maxScore: number;
  rules: OperationalScoreRule[];
  summary: string;
}

export interface SalesAnalyticsResponse {
  dateRange: DateRangeFilter;
  funnel: SalesFunnelData;
  rates: ConversionRates;
  trends: ActivityTrendPoint[];
  templates: BreakdownMetric[];
  themes: BreakdownMetric[];
  channels: BreakdownMetric[];
  sources: BreakdownMetric[];
  professions: BreakdownMetric[];
  geographies: BreakdownMetric[];
  aging: LeadAgingBucket[];
  actionQueue: ActionQueueItem[];
}
