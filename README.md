# GetVisible

*Get your business seen online.*

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
- Email: `admin@getvisible.example` (or legacy `admin@leadforge.example`)
- Password: `demo123`
- Organization: `Gurgaon CA Agency HQ` (`org-demo-gurgaon`)

---

---

## Universal Business Lead Extractor (Leads Discovery)

The application includes **Business Lead Extractor** at `/discovery`, providing universal multi-industry lead discovery, automated contact cleansing, duplicate detection, and professional Excel/CSV export.

### Supported Industries & Categories
Users can extract leads for any commercial category or free-form keyword without modifying source code:
- Lawyers & Law Firms
- Doctors, Dentists & Medical Clinics
- Real Estate Agents & Brokers
- Restaurants, Cafes & Bakeries
- Gyms & Fitness Centers
- Manufacturers & Wholesalers
- Importers & Exporters
- Digital Marketing Agencies
- Hotels, Resorts & Travel Agencies
- Salons & Beauty Centers
- Contractors & Repair Services
- Chartered Accountants & Tax Consultants
- Architects & Interior Designers
- *Any custom business category or niche entered by the user*

### Data Sources & Provider Adapters
1. **Google Places API (`google-places`):**
   - Direct integration with Google Places API (Places Text Search & Place Details).
   - Retrieves verified place names, physical addresses, ratings, review counts, and international phone numbers.
   - Configure in `.env`: `GOOGLE_PLACES_API_KEY=your_google_cloud_api_key`.
2. **Live Web & Directory Search Engine (`live-search`):**
   - Discovers live business websites and public directory records.
   - Crawls homepages and `/contact` pages for authenticated public phone numbers and emails.
   - Supports optional SerpAPI, Google CSE, and Tavily AI accelerators.
3. **Licensed Public Business Registry (`public-registry`):**
   - Authoritative professional directories (ICAI, Bar Council, DCI, COA).
4. **Spreadsheet Import Engine (CSV / XLSX):**
   - Drag-and-drop or upload `.csv`, `.xlsx`, or `.xls` spreadsheets.
   - Normalizes columns, cleans emails, formats phone numbers, and flags duplicates.

### Data Cleansing & Anti-Injection Defense
- Normalizes phone numbers with country prefixes, formats standard text, and extracts canonical website domains.
- Multi-signal duplicate detection (canonical domain match, phone match, business email, and name similarity).
- **Formula Injection Defense (CWE-1236):** Escapes values starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a leading `'` to protect spreadsheets against CSV/XLSX formula execution.

### Excel (.xlsx) & CSV Export
- **Sheet 1 (Business Leads):** Formatted lead records, styled column widths, AutoFilter enabled, frozen header row.
- **Sheet 2 (Export Summary):** Search keyword, location, data provider, record counts, and coverage metrics.
- Export history logged with re-download capabilities.

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
