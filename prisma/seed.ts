import { PrismaClient, WebsiteStatus, LeadStatus } from '@prisma/client';
import { INITIAL_DEMO_LEADS, INITIAL_DEMO_JOBS, DEMO_ORGANIZATION_ID } from '../src/lib/db/demo-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PostgreSQL database with LeadForge AI Phase 1 data...');

  // 1. Create Demo Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'gurgaon-ca-agency' },
    update: {},
    create: {
      id: DEMO_ORGANIZATION_ID,
      name: 'Gurgaon CA Agency HQ',
      slug: 'gurgaon-ca-agency',
      domain: 'leadforge.example',
    },
  });

  console.log(`Organization ready: ${org.name} (${org.id})`);

  // 2. Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@leadforge.example' },
    update: {},
    create: {
      id: 'demo-user-admin',
      name: 'Demo Admin',
      email: 'admin@leadforge.example',
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  console.log(`Admin user ready: ${adminUser.email}`);

  // 3. Seed Clearly Fictional Demo Leads
  for (const leadData of INITIAL_DEMO_LEADS) {
    const lead = await prisma.lead.upsert({
      where: { id: leadData.id },
      update: {},
      create: {
        id: leadData.id,
        businessName: leadData.businessName,
        profession: leadData.profession,
        city: leadData.city,
        address: leadData.address,
        website: leadData.website,
        publicEmail: leadData.publicEmail,
        publicPhone: leadData.publicPhone,
        source: leadData.source,
        sourceUrl: leadData.sourceUrl,
        websiteStatus: leadData.websiteStatus as WebsiteStatus,
        leadStatus: leadData.leadStatus as LeadStatus,
        opportunityScore: leadData.opportunityScore,
        opportunityReason: leadData.opportunityReason,
        isDemoData: true,
        organizationId: org.id,
      },
    });

    // Contacts
    if (leadData.contacts && leadData.contacts.length > 0) {
      for (const contact of leadData.contacts) {
        await prisma.contact.create({
          data: {
            id: contact.id,
            name: contact.name,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            isPrimary: contact.isPrimary,
            linkedinUrl: contact.linkedinUrl,
            leadId: lead.id,
            organizationId: org.id,
          },
        });
      }
    }

    // Websites
    if (leadData.websites && leadData.websites.length > 0) {
      for (const web of leadData.websites) {
        await prisma.website.create({
          data: {
            id: web.id,
            url: web.url,
            status: web.status as WebsiteStatus,
            cms: web.cms,
            speedScore: web.speedScore,
            mobileFriendly: web.mobileFriendly,
            hasSsl: web.hasSsl,
            auditNotes: web.auditNotes,
            leadId: lead.id,
            organizationId: org.id,
          },
        });
      }
    }

    // Activities
    if (leadData.activities && leadData.activities.length > 0) {
      for (const act of leadData.activities) {
        await prisma.activity.create({
          data: {
            id: act.id,
            type: act.type,
            title: act.title,
            description: act.description,
            leadId: lead.id,
            userId: adminUser.id,
            organizationId: org.id,
          },
        });
      }
    }

    // Suppressions
    if (leadData.suppressionRecords && leadData.suppressionRecords.length > 0) {
      for (const supp of leadData.suppressionRecords) {
        await prisma.suppressionRecord.create({
          data: {
            id: supp.id,
            channel: supp.channel,
            reason: supp.reason,
            createdBy: supp.createdBy,
            leadId: lead.id,
            organizationId: org.id,
          },
        });
      }
    }
  }

  // 4. Seed Background Jobs
  for (const job of INITIAL_DEMO_JOBS) {
    await prisma.job.upsert({
      where: { id: job.id },
      update: {},
      create: {
        id: job.id,
        organizationId: org.id,
        type: job.type,
        status: job.status,
        leadId: job.leadId,
        progress: job.progress,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
