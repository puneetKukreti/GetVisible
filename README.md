# LeadForge AI - Phase 1

A production-grade B2B SaaS platform engineered for website agencies to discover legitimate business leads, analyze digital presence, generate tailored demo websites, and manage the sales pipeline with uncompromising anti-spam and privacy compliance safeguards.

**Target MVP Niche:** Chartered Accountants (CA firms)  
**Target MVP Location:** Gurgaon / Delhi NCR  

---

## Key Principles & Architectural Guarantees

1. **Explicit Demo Mode (`DEMO_MODE=true`):**
   - No silent fallback to mock data. If `DATABASE_URL` is configured in production but PostgreSQL is unreachable, an explicit database connection error is surfaced.
   - Demo records are clearly fictional (`"Demo CA Firm 01"`, `demo-ca-01.example`, `@example.com`), stamped with `isDemoData: true`, and prominently displayed with `DEMO DATA` badges.
2. **Multi-Tenant Server-Level Isolation:**
   - All entities (`Lead`, `Contact`, `Website`, `Activity`, `AuditLog`, `ConsentRecord`, `SuppressionRecord`, `Job`) are partitioned by `organizationId`. Cross-tenant queries are blocked at the server repository layer.
3. **Zero-Spam Compliance & Suppression Engine:**
   - Automated bulk broadcasting is architecturally disabled.
   - Every outbound communication requires explicit human review and approval.
   - `DO_NOT_CONTACT` immediately triggers global multi-channel suppression.
4. **Deterministic Core (No AI in Basic DB Ops):**
   - Database searching, filtering, sorting, pagination, and metric counting run strictly deterministically.
   - AI (Google Gemini) is reserved exclusively for semantic tasks: technical audit synthesis and individualized value proposition drafting.
5. **Decoupled Provider Layer:**
   - Modular interfaces (`IAIProvider`, `ILeadSourceProvider`, `IWebsiteAnalyzerProvider`, `IEmailProvider`, `IDeploymentProvider`).
   - Unconfigured providers report `"Provider not configured"`, never simulating false success.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, Server Actions, API Routes)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS, CSS variables, Dark/Light mode
- **UI Components:** Inspired by shadcn/ui, Lucide React, Framer Motion
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Validation:** Zod
- **AI Engine:** Google Gemini API (structured REST abstraction, LangGraph ready)
- **Authentication:** NextAuth / Auth.js with JWT session strategy & organization context
- **Testing:** Vitest & React Testing Library

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v24.15.0)
- npm 9+

### 2. Installation
```bash
npm install
npx prisma generate
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

To run in explicit Sandbox Demo Mode (no local PostgreSQL server required):
```env
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/leadforge_ai?schema=public"
NEXTAUTH_SECRET="leadforge-production-demo-secret-key-development"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY=""
```

To run with live PostgreSQL:
```env
DEMO_MODE=false
DATABASE_URL="postgresql://user:password@localhost:5432/your_database?schema=public"
NEXTAUTH_SECRET="your-32-char-secret"
GEMINI_API_KEY="your-gemini-key"
```

Then run migrations and seed:
```bash
npm run prisma:migrate
npm run db:seed
```

### 4. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**Sandbox Credentials:**
- Email: `admin@leadforge.example`
- Password: `demo123`
- Organization: `Gurgaon CA Agency HQ` (`org-demo-gurgaon`)

---

## Verification & Quality Assurance

Run the test suite:
```bash
npm test
```

Run TypeScript verification:
```bash
npm run typecheck
```

Run linter:
```bash
npm run lint
```

Run production build:
```bash
npm run build
```

---

## Phase 2 Roadmap

- Automated ICAI and MCA public registry scheduled crawling.
- Live Google Lighthouse & PageSpeed Insights API diagnostics.
- Multi-agent LangGraph workflow for automated opportunity reasoning.
- Interactive Next.js website demo generator with Vercel preview deployment.
- Resend webhook integration for 1-to-1 reply tracking and intent classification.
