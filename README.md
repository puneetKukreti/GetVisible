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
NEXTAUTH_SECRET="generate-a-strong-secret-here"
ADMIN_PASSWORD="choose-a-strong-owner-password"
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

### 4. Production Deployment (Vercel + Postgres)

The deployed app must not rely on the in-memory sandbox store: on serverless hosts that
memory is per-instance and resets on every cold start, so uploaded leads and generated
demo links would silently disappear. Production therefore runs with `DEMO_MODE=false`
against a real database.

1. Create a Postgres database (Vercel Postgres / Neon) and connect it to the project.
   The integration injects:
   - `DATABASE_URL` — pooled connection, used by the app at runtime.
   - `DATABASE_URL_UNPOOLED` — direct connection, used for migrations.
2. Set these **Production** environment variables:
   ```env
   DEMO_MODE=false
   NEXT_PUBLIC_DEMO_MODE=false
   ADMIN_PASSWORD="<strong owner password>"
   NEXTAUTH_SECRET="<32+ character secret>"
   CRON_SECRET="<random secret>"   # protects the retention cron endpoint
   ```
3. Deploy. `npm run vercel-build` runs automatically and executes:
   ```
   prisma generate && node scripts/migrate-deploy.mjs && next build
   ```
   `scripts/migrate-deploy.mjs` applies the committed Prisma migrations against
   `DATABASE_URL_UNPOOLED`, because Neon's pooled endpoint cannot run `prisma migrate`.

### Demo link retention

Public demo links are per-prospect and time-limited:

- A link keeps working across refreshes and redeployments. It is removed only when an
  operator deletes it, or **3 days after the demo was created**
  (`DEMO_PUBLIC_TTL_DAYS=3`, overridable).
- Expired demos are pruned opportunistically when a link is opened, and by the daily
  Vercel Cron job declared in `vercel.json` → `/api/cron/prune-demos`.
- Pruning deletes only the demo row. The underlying lead record is never deleted, so
  the pipeline history is preserved.

### Default WhatsApp message

Step-1 outreach uses the copy below. WhatsApp bold is `*text*`. The message is written for
a **phone-sized chat window first** (where most WhatsApp traffic is), so it leads with a
one-line hook, a four-point benefit checklist, and a single tappable demo link.

```text
👋 *Want to Attract More Clients to Your Business?*

Did you know that having a professional website can help potential clients find you online and build trust in your services?

🌐 *Get Your Own FREE Website!* 🎉

✅ Showcase your services professionally
✅ Make it easier for potential clients to contact you
✅ Build trust and stand out from competitors
✅ Help more people discover your business online

👀 *See what your website could look like!*

👉 *View Your Website Demo:*
https://get-visible-web.vercel.app/demo/{token}

🎁 Get started with your free website today!

📩 Interested? Click the link above to explore your demo and learn more.

— Puneet | GetVisible
```

Implemented in `src/lib/sales/outreach.ts` (`generateDeterministicOutreach`) and
mirrored client-side for the campaigns workspace in
`src/app/(dashboard)/campaigns/page.tsx` (`getMeaningfulWhatsAppMessage`).

### Demo preview screenshot

The screenshot attached to WhatsApp/email must always show the **prospect's own name**,
never a shared sample. `GET /api/demos/[id]/screenshot?format=image` therefore returns a
self-contained, website-styled **SVG concept card** that leads with the prospect's name,
city and profession (the campaigns workspace rasterizes it to PNG in the browser for the
clipboard, "Copy Image", and the preview).

Two attachment shapes are available and can be toggled in the campaigns panel:

- `viewport=mobile` (default) — a tall **1080×1350 portrait card** that looks like a phone
  screen. Type is sized so the firm name, headline and CTA stay legible once WhatsApp scales
  the image down to a chat bubble (a landscape card renders most of its copy illegibly).
- `viewport=desktop` — a wide browser-window card. When a local Chrome is available (local
  dev / VPS) this one is a real pixel capture of the personalized page at 1280×800; otherwise
  it is a 1024×640 mock card.

The portrait variant is always the designed card, never a live capture: headless Chrome
enforces a ~500px minimum window width, so a `--window-size=390` capture is laid out wide and
then sliced mid-word.

Email clients cannot render SVG, so `POST /api/outreach/send-email` resolves the inline
image to the bundled raster template art for the prospect's chosen layout (with a live
screenshot service as a last resort). The bundled `public/demo-templates/<id>/hero.png`
files are neutral template thumbnails only — they intentionally contain a generic sample
business, not any real prospect. See `src/lib/providers/screenshot.provider.ts`
(`generateHeroMockupSvg` / `generateMobileHeroMockupSvg`) and
`src/app/api/demos/[id]/screenshot/route.ts`.

### Phone-width rendering of the live demo

The demo link is opened on phones, so the Stitch shells are hardened for narrow viewports in
two places:

- `src/lib/demos/stitch-personalizer.ts` — CA templates. Below 1024px the desktop nav is
  already hidden, but the fixed-width brand block plus the in-header "Request a
  Consultation" button used to overflow a 360-390px screen and push that button completely
  off-canvas. The duplicate header CTA is now dropped on phones (the hero CTA and the
  floating WhatsApp bar are already visible there), the brand name is stepped down and
  allowed to ellipsize, and the whole firm name stays on screen.
- `src/lib/demos/profession-stitch-renderer.ts` — non-CA profession templates get the same
  treatment below 620px in `buildStyles()`.

### 5. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**Owner access:**
- The workbench at `/login` is unlocked with `ADMIN_PASSWORD`. There is no
  default password; login fails closed (HTTP 503) when it is not configured.
- Optional NextAuth demo login uses `DEMO_ADMIN_PASSWORD` (only when `DEMO_MODE=true`).
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
