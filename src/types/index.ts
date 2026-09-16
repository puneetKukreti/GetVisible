export type LeadStatus =
  | 'NEW'
  | 'RESEARCHING'
  | 'QUALIFIED'
  | 'DEMO_GENERATED'
  | 'OUTREACH_PENDING'
  | 'CONTACTED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'NOT_INTERESTED'
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

export interface WebsiteDemoData {
  id: string;
  leadId: string;
  organizationId: string;
  templateId: string;
  version: number;
  generationStatus: 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  content: WebsiteContent;
  theme: WebsiteTheme;
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
  minScore?: number;
  maxScore?: number;
  sortBy?: 'opportunityScore' | 'createdAt' | 'businessName';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
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
  contacted: number;
  replies: number;
  interested: number;
  customers: number;
  suppressionCount: number;
  activeJobsCount: number;
}
