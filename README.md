# CloudDance CRM v1

Local-first brokerage outreach CRM for Clouddance.

This branch replaces the static calculator app with a full internal CRM built for:

- brokerage-first lead records
- multiple contacts per brokerage
- lead assignment
- caller queue / next lead workflow
- click-to-call CloudTalk placeholder links
- call logging, dispositions, recordings, notes, tasks, and follow-ups
- placeholder Gmail + Outlook mailbox sync and send/reply flows
- brokerage-first CSV/XLSX imports with raw row traceability and dedupe

---

## What ships in this V1

### Core CRM
- Lead list with server-side search and filters
- Lead detail page with brokerage enrichment fields
- Contact panel for multiple points of contact
- Role-based auth with `ADMIN` and `SDR`
- Lead assignment history
- Activity timeline by user
- Tags
- Notes, tasks, follow-ups, and call logs
- Queue page for “open next lead” workflow

### Imports
- CSV + XLSX support
- Brokerage-first parsing:
  - non-empty `Company name Latin alphabet` starts a new lead
  - blank `Company name Latin alphabet` rows continue the previous brokerage as contact/enrichment rows
- Preflight validation for wrong exports
- Clean rejection of search-summary files like `USA Brokers 4(Search summary).csv`
- Encoding fallback for:
  - UTF-8
  - UTF-8 with BOM
  - Latin-1 / ISO-8859-1
  - CP1252 / Win-1252
- Dedupe using normalized brokerage name plus best-effort domain / website / phone matching
- Raw import row storage in `ImportRow` for traceability
- Background-style UI import jobs plus CLI import path for larger files

### Integrations
- CloudTalk placeholder click-to-call URLs
- Call recording placeholder metadata / URLs
- Placeholder Gmail and Outlook mailbox connections
- Placeholder mailbox sync
- Placeholder send/reply from inside the CRM
- Clean seams for swapping in real credentials later

---

## Stack

- Next.js App Router + TypeScript
- PostgreSQL
- Prisma
- Auth.js (credentials auth for local V1)
- Tailwind CSS
- Docker Compose

---

## Quick start (host machine)

### 1) Clone the repo and create the target branch

```bash
git clone https://github.com/mormorunni2002/CloudDance.git
cd CloudDance
git checkout -b feature/clouddance-crm-v1
```

### 2) Copy this codebase into the repo root

Replace the existing files in the repo root with the files from this bundle.

### 3) Create your environment file

```bash
cp .env.example .env
```

Update `AUTH_SECRET` to a long random string.

### 4) Start Postgres

```bash
docker compose up -d db
```

### 5) Install dependencies

```bash
npm install
```

### 6) Generate Prisma client and sync schema

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 7) Run the app

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Quick start (Docker Compose app + db)

This is the zero-ceremony option for local development.

```bash
cp .env.example .env
docker compose up --build
```

The app container runs:

- `npm install`
- `npm run db:generate`
- `npm run db:push`
- `npm run db:seed`
- `npm run dev`

---

## Seed users

Default dev credentials come from `.env`.

- Admin: `alex@clouddance.insure` / `ChangeMe-Admin123!`
- SDR: `partnerships@clouddance.insure` / `ChangeMe-SDR123!`

Change a password later with:

```bash
npm run user:password -- alex@clouddance.insure NewPassword123!
```

---

## Import usage

### UI import
Go to:

```text
/imports
```

Upload a CSV or XLSX broker results export.

### CLI import
For larger files, use the same importer directly:

```bash
npm run import:file -- "./imports/USA Brokers Results.csv" alex@clouddance.insure
```

The CLI and UI both use the same:

- schema detection
- search-summary rejection
- encoding fallback
- brokerage-first parsing
- dedupe logic
- raw row storage

---

## Data mapping

Expected source columns include:

- `Company name Latin alphabet`
- `Trade description (English)`
- `Operating revenue (Turnover)\nth USD Last avail. yr`
- `P/L before tax\nth USD Last avail. yr`
- `Total assets\nth USD Last avail. yr`
- `Shareholders funds\nth USD Last avail. yr`
- `DME-mail address`
- `DMFirst name`
- `DMLast name`
- `Domain`
- `Website address`
- `E-mail address`
- `Telephone number`

Primary mappings:

- `Company name Latin alphabet` → lead brokerage name
- `Trade description (English)` → line of business / trade description
- `Telephone number` → lead main phone
- `Domain` → domain
- `Website address` → website
- `DME-mail address` → contact email
- `DMFirst name` + `DMLast name` → contact name
- `E-mail address` → fallback email
- financial columns → lead `rawMetadata`

---

## Placeholder integration notes

### CloudTalk
Phone links use:

```env
CLOUDTALK_CLICK_TO_CALL_URL_TEMPLATE=tel:{phone}
```

You can later swap this for:

```env
cloudtalk://call?number={phone}
```

or your own internal proxy URL.

### Gmail / Outlook
Mailbox connections are placeholder records right now. The UI, models, and workflows are already in place so you can later wire in:

- real Google OAuth + Gmail API
- real Microsoft OAuth + Graph API

without changing the page structure or core data model.

---

## Architecture snapshot

### UI
- `/` → dashboard
- `/queue` → current user assigned-lead queue
- `/leads` → lead list with server-side filters
- `/leads/[leadId]` → lead workspace
- `/imports` → admin import jobs
- `/settings/integrations` → CloudTalk / mailbox setup

### Backend shape
- server components for page queries
- server actions for CRM mutations
- route handlers for Auth.js and import job upload/status
- Prisma ORM for all persistence
- background-style import worker via `tsx scripts/import-worker.ts`

### Import pipeline
1. Save upload to `tmp/`
2. Create `ImportJob`
3. Detect file type
4. Reject wrong export types early
5. Parse CSV/XLSX with encoding fallback
6. Group rows brokerage-first
7. Dedupe + create/update leads
8. Dedupe + create/update contacts
9. Store `ImportRow` records
10. Update `ImportJob` counters and status

---

## Git commands to commit and push

Once you have copied this code into the repo:

```bash
git status
git add .
git commit -m "Build CloudDance CRM v1"
git push -u origin feature/clouddance-crm-v1
```

---

## File tree

See:

```text
docs/FILE_TREE.md
```

and:

```text
docs/ARCHITECTURE.md
```
