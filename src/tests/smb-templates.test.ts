import { describe, it, expect } from 'vitest';
import { getTemplate, CLINIC_HEALTHCARE_TEMPLATE, INTERIOR_ARCHITECTURE_TEMPLATE, LeadFacts } from '@/lib/demos/templates';
import { selectWebsiteDesign } from '@/lib/demos/personalization';
import { WebsiteContentSchema } from '@/lib/demos/schema';
import { ALLOWED_TRANSITIONS, validateStatusTransition, getNextActionRecommendation } from '@/lib/sales/lifecycle';
import { LeadData, WebsiteDemoData } from '@/types';

describe('Task 5 & 6: Solo-Operator Lifecycle & SMB Templates', () => {
  describe('SMB Templates & Auto-detection', () => {
    it('auto-detects CLINIC_HEALTHCARE template when profession or business name matches medical/dental keywords', () => {
      const dentalLead: LeadFacts = {
        businessName: 'Apex Dental & Maxillofacial Clinic',
        profession: 'Dentist',
        city: 'Gurgaon',
        address: 'Sector 43, Golf Course Road',
      };
      const tmpl = getTemplate(undefined, undefined, dentalLead);
      expect(tmpl.id).toBe('CLINIC_HEALTHCARE');

      const content = tmpl.buildContent(dentalLead);
      const validation = WebsiteContentSchema.safeParse(content);
      expect(validation.success).toBe(true);
      expect(content.hero.badge).toBe('Modern Healthcare & Dental Clinic');
    });

    it('auto-detects INTERIOR_ARCHITECTURE template when profession or business name matches architecture/design keywords', () => {
      const interiorLead: LeadFacts = {
        businessName: 'Studio Matrix Architects & Interior Decorators',
        profession: 'Architect',
        city: 'Gurgaon',
        address: 'DLF Phase 5, Gurgaon',
      };
      const tmpl = getTemplate(undefined, undefined, interiorLead);
      expect(tmpl.id).toBe('INTERIOR_ARCHITECTURE');

      const content = tmpl.buildContent(interiorLead);
      const validation = WebsiteContentSchema.safeParse(content);
      expect(validation.success).toBe(true);
      expect(content.hero.badge).toBe('Interior Architecture & Design Studio');
    });

    it('falls back to CA archetypes when profession is financial/accounting or general', () => {
      const caLead: LeadFacts = {
        businessName: 'Jain & Associates Chartered Accountants',
        profession: 'Chartered Accountant',
        city: 'Delhi',
        address: 'Connaught Place, New Delhi',
      };
      const tmpl = getTemplate(undefined, undefined, caLead);
      expect(tmpl.id).toBe('design-1-premium');
    });

    it('selectWebsiteDesign auto-selects CLINIC_HEALTHCARE for healthcare and dental leads', () => {
      const design = selectWebsiteDesign({
        id: 'lead-clinic-101',
        businessName: 'Dr. Smile Dental Clinic',
        profession: 'Dentist',
        city: 'Gurgaon',
      });
      expect(design.layout).toBe('CLINIC_HEALTHCARE');
      expect(design.template).toBe('CLINIC_HEALTHCARE');
    });

    it('selectWebsiteDesign auto-selects INTERIOR_ARCHITECTURE for interior and architecture leads', () => {
      const design = selectWebsiteDesign({
        id: 'lead-interior-102',
        businessName: 'Apex Interior & Architecture Studio',
        profession: 'Architect',
        city: 'Noida',
      });
      expect(design.layout).toBe('INTERIOR_ARCHITECTURE');
      expect(design.template).toBe('INTERIOR_ARCHITECTURE');
    });
  });

  describe('Lifecycle State Transitions & Recommendation Ordering', () => {
    it('allows NEW status to transition directly to APPROVED, INTERESTED, PROPOSAL, and CONTACTED', () => {
      expect(ALLOWED_TRANSITIONS.NEW).toContain('APPROVED');
      expect(ALLOWED_TRANSITIONS.NEW).toContain('INTERESTED');
      expect(ALLOWED_TRANSITIONS.NEW).toContain('PROPOSAL');
      expect(ALLOWED_TRANSITIONS.NEW).toContain('CONTACTED');

      expect(validateStatusTransition('NEW', 'APPROVED').valid).toBe(true);
      expect(validateStatusTransition('NEW', 'INTERESTED').valid).toBe(true);
      expect(validateStatusTransition('NEW', 'PROPOSAL').valid).toBe(true);
      expect(validateStatusTransition('NEW', 'CONTACTED').valid).toBe(true);
    });

    it('allows PROPOSAL status to transition to INTERESTED and CONTACTED', () => {
      expect(ALLOWED_TRANSITIONS.PROPOSAL).toContain('INTERESTED');
      expect(ALLOWED_TRANSITIONS.PROPOSAL).toContain('CONTACTED');

      expect(validateStatusTransition('PROPOSAL', 'INTERESTED').valid).toBe(true);
      expect(validateStatusTransition('PROPOSAL', 'CONTACTED').valid).toBe(true);
    });

    it('evaluates post-contact statuses above approvalStatus === APPROVED in getNextActionRecommendation', () => {
      const dummyDemo = {
        id: 'demo-1',
        leadId: 'lead-test-rec-1',
        organizationId: 'demo-org',
        version: 1,
        approvalStatus: 'APPROVED',
        content: {},
        theme: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as WebsiteDemoData;

      const dummyLead = {
        id: 'lead-test-rec-1',
        organizationId: 'demo-org',
        businessName: 'Sample Firm',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: 'Sector 14',
        websiteStatus: 'NO_WEBSITE',
        leadStatus: 'CONTACTED',
        source: 'Manual',
        opportunityScore: 80,
        opportunityReason: 'Test',
        isDemoData: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as LeadData;

      // Even if approvalStatus is APPROVED, leadStatus is CONTACTED so stage should be Step 4 (Awaiting Response)
      const recContacted = getNextActionRecommendation(dummyLead, dummyDemo);
      expect(recContacted.stepNumber).toBe(4);
      expect(recContacted.stageTitle).toBe('Awaiting Response');

      // When lead is INTERESTED
      dummyLead.leadStatus = 'INTERESTED';
      const recInterested = getNextActionRecommendation(dummyLead, dummyDemo);
      expect(recInterested.stepNumber).toBe(6);
      expect(recInterested.stageTitle).toBe('Sales Opportunity / Consultation');

      // When lead is PROPOSAL
      dummyLead.leadStatus = 'PROPOSAL';
      const recProposal = getNextActionRecommendation(dummyLead, dummyDemo);
      expect(recProposal.stepNumber).toBe(6);
      expect(recProposal.stageTitle).toBe('Proposal Delivered');

      // When lead is CONVERTED
      dummyLead.leadStatus = 'CONVERTED';
      const recConverted = getNextActionRecommendation(dummyLead, dummyDemo);
      expect(recConverted.stepNumber).toBe(7);
      expect(recConverted.stageTitle).toBe('Converted Customer');
    });
  });
});
