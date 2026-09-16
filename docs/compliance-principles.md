# Anti-Spam & Ethical Compliance Framework

LeadForge AI is engineered from the ground up as an ethical sales intelligence and pipeline system. It is strictly **not a spam platform**.

## Core Principles

### 1. Zero Bulk Automated Outreach
- The platform strictly rejects mass automated blasting, indiscriminate email scraping, and robot dialing.
- Outreach is restricted to research-backed, individualized communications directed to legitimate public business representatives.

### 2. Mandatory Human Approval Before Outbound Actions
- Outbound communications require an explicit sign-off from an authorized agency specialist.
- Irreversible actions—including preview domain purchases, production website hosting provisioning, and commercial email dispatch—are architecturally blocked without explicit human confirmation.

### 3. Legitimate Public Information Only
- Discovery algorithms strictly use publicly accessible registries (such as the Institute of Chartered Accountants of India - ICAI member registry or Ministry of Corporate Affairs).
- The platform enforces:
  - Strict adherence to `robots.txt` directives.
  - Respect for rate limits and server hygiene.
  - Zero bypass of CAPTCHA, firewalls, authentication screens, or paywalls.
  - Zero collection of unnecessary private personal data.

### 4. Suppression & Do-Not-Contact Engine
- **`ConsentRecord`**: Tracks explicit consent per communication channel (`EMAIL`, `WHATSAPP`, `SMS`, `VOICE`) and lifecycle state (`UNKNOWN`, `PENDING`, `OPTED_IN`, `OPTED_OUT`, `EXPIRED`).
- **`SuppressionRecord`**: Immediate block applied per channel or globally across all channels.
- Transitioning any lead to `DO_NOT_CONTACT` immediately writes global suppression records to the database and halts all active pipeline stages.

### 5. Full Audit Trail
Every compliance-sensitive event is captured in the immutable `AuditLog`:
- Lead creation and updates
- Status transitions
- `DO_NOT_CONTACT` activations
- Contact detail modifications
- Outreach approvals or rejections
