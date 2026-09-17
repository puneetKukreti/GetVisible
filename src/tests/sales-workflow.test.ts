import { describe, it, expect, beforeEach } from 'vitest';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { validateStatusTransition, canPrepareOutreach, getNextActionRecommendation } from '@/lib/sales/lifecycle';
import { OutreachGeneratorService, validateOutreachClaims, generateDeterministicOutreach } from '@/lib/sales/outreach';
import { LeadData, WebsiteDemoData } from '@/types';

describe('Phase 5 — Human-in-the-Loop Sales Workflow', () => {
  const testOrg = 'org-sales-workflow-test';

  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  describe('1. Sales Lifecycle & Status Transitions', () => {
    it('allows valid progressive transitions', () => {
      expect(validateStatusTransition('NEW', 'QUALIFIED').valid).toBe(true);
      expect(validateStatusTransition('QUALIFIED', 'DEMO_GENERATED').valid).toBe(true);
      expect(validateStatusTransition('DEMO_GENERATED', 'UNDER_REVIEW').valid).toBe(true);
      expect(validateStatusTransition('UNDER_REVIEW', 'APPROVED').valid).toBe(true);
      expect(validateStatusTransition('UNDER_REVIEW', 'REJECTED').valid).toBe(true);
      expect(validateStatusTransition('APPROVED', 'CONTACTED').valid).toBe(true);
      expect(validateStatusTransition('CONTACTED', 'RESPONDED').valid).toBe(true);
      expect(validateStatusTransition('RESPONDED', 'INTERESTED').valid).toBe(true);
      expect(validateStatusTransition('INTERESTED', 'CONVERTED').valid).toBe(true);
    });

    it('allows suppression and rejection terminal states from any active stage', () => {
      expect(validateStatusTransition('NEW', 'DO_NOT_CONTACT').valid).toBe(true);
      expect(validateStatusTransition('QUALIFIED', 'NOT_INTERESTED').valid).toBe(true);
      expect(validateStatusTransition('CONTACTED', 'DO_NOT_CONTACT').valid).toBe(true);
      expect(validateStatusTransition('RESPONDED', 'NOT_INTERESTED').valid).toBe(true);
    });

    it('blocks invalid transitions (e.g. jumping directly from NEW to CONTACTED)', () => {
      const result = validateStatusTransition('NEW', 'CONTACTED');
      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();

      const invalidSkip = validateStatusTransition('REJECTED', 'CONTACTED');
      expect(invalidSkip.valid).toBe(false);
    });

    it('enforces transitions and records timeline in LeadRepository', async () => {
      const lead = await LeadRepository.createLead(
        {
          businessName: 'Transition Test CA',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'Golf Course Road, Gurgaon',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'NEW',
        },
        testOrg,
        'Test Suite'
      );

      // Transition to QUALIFIED
      const updated = await LeadRepository.updateLeadStatus(lead.id, 'QUALIFIED', testOrg, 'Sales Lead');
      expect(updated.leadStatus).toBe('QUALIFIED');

      // Verify activity was recorded
      const retrieved = await LeadRepository.getLeadById(lead.id, testOrg);
      const transitionActivity = retrieved?.activities?.find((a) => a.type === 'STATUS_CHANGE');
      expect(transitionActivity).toBeDefined();
      expect(transitionActivity?.metadata).toMatchObject({ from: 'NEW', to: 'QUALIFIED' });
    });
  });

  describe('2. Approved-Demo Gate for Outreach', () => {
    const baseLead: LeadData = {
      id: 'lead-gate-1',
      businessName: 'Gate Test CA',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Cyber City, Gurgaon',
      websiteStatus: 'NO_WEBSITE',
      leadStatus: 'NEW',
      opportunityScore: 80,
      opportunityReason: 'High potential',
      isDemoData: false,
      organizationId: testOrg,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'Test',
    };

    it('blocks outreach if qualification is not NO_WEBSITE', () => {
      const leadWithSite = { ...baseLead, websiteStatus: 'WEBSITE_EXISTS' as const };
      const gate = canPrepareOutreach(leadWithSite, undefined);
      expect(gate.allowed).toBe(false);
      expect(gate.reason).toContain('No Website');
    });

    it('blocks outreach if no website demo has been generated', () => {
      const gate = canPrepareOutreach(baseLead, undefined);
      expect(gate.allowed).toBe(false);
      expect(gate.reason).toContain('No website concept demo');
    });

    it('blocks outreach if demo is PENDING_REVIEW', () => {
      const pendingDemo: WebsiteDemoData = {
        id: 'demo-gate-pending',
        leadId: baseLead.id,
        organizationId: testOrg,
        version: 1,
        templateId: 'CA_ACCOUNTING_PROFESSIONAL',
        generationStatus: 'COMPLETED',
        theme: { primaryColor: '#000', secondaryColor: '#fff', accentColor: '#333', fontFamily: 'sans', style: 'corporate', borderRadius: 'md' },
        content: {} as any,
        approvalStatus: 'PENDING_REVIEW',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const gate = canPrepareOutreach(baseLead, pendingDemo);
      expect(gate.allowed).toBe(false);
      expect(gate.reason).toContain('pending review');
    });

    it('blocks outreach if demo is REJECTED', () => {
      const rejectedDemo: WebsiteDemoData = {
        id: 'demo-gate-rejected',
        leadId: baseLead.id,
        organizationId: testOrg,
        version: 1,
        templateId: 'CA_ACCOUNTING_PROFESSIONAL',
        generationStatus: 'COMPLETED',
        theme: { primaryColor: '#000', secondaryColor: '#fff', accentColor: '#333', fontFamily: 'sans', style: 'corporate', borderRadius: 'md' },
        content: {} as any,
        approvalStatus: 'REJECTED',
        rejectionReason: 'Colors do not fit corporate client',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const gate = canPrepareOutreach(baseLead, rejectedDemo);
      expect(gate.allowed).toBe(false);
      expect(gate.reason).toContain('rejected');
    });

    it('allows outreach strictly when lead is NO_WEBSITE and demo is APPROVED', () => {
      const approvedDemo: WebsiteDemoData = {
        id: 'demo-gate-approved',
        leadId: baseLead.id,
        organizationId: testOrg,
        version: 1,
        templateId: 'CA_ACCOUNTING_PROFESSIONAL',
        generationStatus: 'COMPLETED',
        theme: { primaryColor: '#000', secondaryColor: '#fff', accentColor: '#333', fontFamily: 'sans', style: 'corporate', borderRadius: 'md' },
        content: {} as any,
        approvalStatus: 'APPROVED',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const gate = canPrepareOutreach(baseLead, approvedDemo);
      expect(gate.allowed).toBe(true);
      expect(gate.reason).toBeUndefined();
    });
  });

  describe('3. Demo Approval & Rejection Persistence (Audit Trail)', () => {
    it('approving a demo updates approvalStatus and promotes lead status', async () => {
      const lead = await LeadRepository.createLead(
        {
          businessName: 'Approval Test CA',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'Sector 29, Gurgaon',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'DEMO_GENERATED',
        },
        testOrg,
        'Tester'
      );

      const demo = await WebsiteDemoGeneratorService.generateDemo(lead);
      const saved = await WebsiteDemoRepository.saveDemo(testOrg, demo, 'Tester');

      const result = await WebsiteDemoRepository.approveDemo(testOrg, saved.id, 'Senior Reviewer');
      expect(result.demo.approvalStatus).toBe('APPROVED');
      expect(result.demo.reviewedBy).toBe('Senior Reviewer');
      expect(result.demo.reviewedAt).toBeDefined();

      // Lead status should be promoted to APPROVED
      const updatedLead = await LeadRepository.getLeadById(lead.id, testOrg);
      expect(updatedLead?.leadStatus).toBe('APPROVED');
    });

    it('rejecting a demo preserves the demo record for history and sets reason', async () => {
      const lead = await LeadRepository.createLead(
        {
          businessName: 'Rejection Test CA',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'Udyog Vihar, Gurgaon',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'DEMO_GENERATED',
        },
        testOrg,
        'Tester'
      );

      const demo = await WebsiteDemoGeneratorService.generateDemo(lead);
      const saved = await WebsiteDemoRepository.saveDemo(testOrg, demo, 'Tester');

      const result = await WebsiteDemoRepository.rejectDemo(
        testOrg,
        saved.id,
        'Typography and hero headline need revision',
        'Reviewer'
      );

      expect(result.demo.approvalStatus).toBe('REJECTED');
      expect(result.demo.rejectionReason).toBe('Typography and hero headline need revision');

      // Demo is preserved in the database (never deleted)
      const listAfter = await WebsiteDemoRepository.listDemos(testOrg, lead.id);
      expect(listAfter.length).toBe(1);
      expect(listAfter[0].id).toBe(saved.id);
      expect(listAfter[0].approvalStatus).toBe('REJECTED');

      // Lead status reflects REJECTED
      const updatedLead = await LeadRepository.getLeadById(lead.id, testOrg);
      expect(updatedLead?.leadStatus).toBe('REJECTED');
    });
  });

  describe('4. Deterministic Outreach Generation & Claims Validation', () => {
    it('generates outreach copy strictly containing recipient business and exact demo URL', () => {
      const outreach = generateDeterministicOutreach({
        businessName: 'Sharma & Associates CA',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        contactName: 'Mr. Sharma',
        demoUrl: 'http://localhost:3000/demo/lead-sharma-123',
      });

      expect(outreach.subject).toContain('Sharma & Associates CA');
      expect(outreach.message).toContain('Sharma & Associates CA');
      expect(outreach.message).toContain('Gurgaon');
      expect(outreach.message).toContain('http://localhost:3000/demo/lead-sharma-123');
      expect(outreach.personalizationReason).toBeDefined();
    });

    it('validates claim safety to prevent unsubstantiated marketing statements', () => {
      const unsafeMessage = {
        subject: 'We guarantee #1 Google ranking in 7 days!',
        message: 'Hello, our proprietary SEO guarantees 100x traffic and 100% revenue boost.',
        personalizationReason: 'Aggressive claim test',
      };

      const result = validateOutreachClaims(unsafeMessage);
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);

      const safeMessage = {
        subject: 'Concept Website for Your CA Practice',
        message: 'Hello, we prepared a modern preview of a digital practice website for your review.',
        personalizationReason: 'Compliant factual preview',
      };

      expect(validateOutreachClaims(safeMessage).valid).toBe(true);
    });
  });

  describe('5. Cross-Lead & Cross-Demo Isolation', () => {
    it('ensures Lead A and Lead B generate distinct outreach linked strictly to their own demos', async () => {
      // 1. Create Lead A and Lead B
      const leadA = await LeadRepository.createLead(
        {
          businessName: 'Apex Tax Partners CA',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'Golf Course Extension, Gurgaon',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'QUALIFIED',
        },
        testOrg,
        'Test Suite'
      );

      const leadB = await LeadRepository.createLead(
        {
          businessName: 'Zenith Advisory CA',
          profession: 'Chartered Accountant',
          city: 'Noida',
          address: 'Sector 18, Noida',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'QUALIFIED',
        },
        testOrg,
        'Test Suite'
      );

      // 2. Generate demos
      const demoA = await WebsiteDemoGeneratorService.generateDemo(leadA);
      const savedDemoA = await WebsiteDemoRepository.saveDemo(testOrg, demoA, 'Test Suite');
      await WebsiteDemoRepository.approveDemo(testOrg, savedDemoA.id, 'Admin');

      const demoB = await WebsiteDemoGeneratorService.generateDemo(leadB);
      const savedDemoB = await WebsiteDemoRepository.saveDemo(testOrg, demoB, 'Test Suite');
      await WebsiteDemoRepository.approveDemo(testOrg, savedDemoB.id, 'Admin');

      // Refresh leads to ensure websiteDemos are attached
      const freshLeadA = (await LeadRepository.getLeadById(leadA.id, testOrg))!;
      const freshLeadB = (await LeadRepository.getLeadById(leadB.id, testOrg))!;

      // 3. Generate outreach for each
      const outreachService = new OutreachGeneratorService();
      const resA = await outreachService.generateOutreach(freshLeadA, savedDemoA);
      const resB = await outreachService.generateOutreach(freshLeadB, savedDemoB);

      expect(resA.success).toBe(true);
      expect(resB.success).toBe(true);

      // Verify Lead A outreach
      expect(resA.outreach.message).toContain('Apex Tax Partners CA');
      expect(resA.outreach.message).toContain(`/demo/${leadA.id}`);
      expect(resA.outreach.message).not.toContain('Zenith Advisory CA');
      expect(resA.outreach.message).not.toContain(`/demo/${leadB.id}`);

      // Verify Lead B outreach
      expect(resB.outreach.message).toContain('Zenith Advisory CA');
      expect(resB.outreach.message).toContain(`/demo/${leadB.id}`);
      expect(resB.outreach.message).not.toContain('Apex Tax Partners CA');
      expect(resB.outreach.message).not.toContain(`/demo/${leadA.id}`);
    });
  });

  describe('6. Sales Notes & Manual Contact Tracking', () => {
    it('attaches sales notes to lead record and records timeline activity', async () => {
      const lead = await LeadRepository.createLead(
        {
          businessName: 'Notes Test CA',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'Sohna Road, Gurgaon',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'NEW',
        },
        testOrg,
        'Sales Lead'
      );

      const note = await LeadRepository.addNote(
        testOrg,
        lead.id,
        'Spoke with receptionist. Managing partner is available on Tuesdays.',
        'Sales Rep A'
      );

      expect(note.text).toContain('Managing partner is available');
      expect(note.createdBy).toBe('Sales Rep A');

      // Lead now contains note
      const retrieved = await LeadRepository.getLeadById(lead.id, testOrg);
      expect(retrieved?.notes).toHaveLength(1);
      expect(retrieved?.notes?.[0].text).toBe(note.text);

      // Activity timeline recorded
      const noteActivity = retrieved?.activities?.find((a) => a.type === 'NOTE_ADDED');
      expect(noteActivity).toBeDefined();
    });

    it('marking lead as contacted manually updates status and creates timeline entry', async () => {
      const lead = await LeadRepository.createLead(
        {
          businessName: 'Contacted Test CA',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'MG Road, Gurgaon',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'APPROVED',
        },
        testOrg,
        'Sales Lead'
      );

      const updated = await LeadRepository.updateLeadStatus(
        lead.id,
        'CONTACTED',
        testOrg,
        'Sales Rep A',
        'Sent personalized pitch email manually via Outlook'
      );

      expect(updated.leadStatus).toBe('CONTACTED');

      const retrieved = await LeadRepository.getLeadById(lead.id, testOrg);
      const contactActivity = retrieved?.activities?.find(
        (a) => a.type === 'STATUS_CHANGE' && (a.metadata as any)?.to === 'CONTACTED'
      );
      expect(contactActivity).toBeDefined();
    });
  });
});
