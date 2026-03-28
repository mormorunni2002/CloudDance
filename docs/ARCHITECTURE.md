# CloudDance CRM v1 Architecture

## Design goals
- Local-first setup
- Clean internal-tool UI
- Large-lead-list safe patterns
- Brokerage-first data model
- Integration seams for CloudTalk + Gmail + Outlook
- Good enough V1 decisions without overbuilding

## Why brokerage-first?
Your source exports are brokerage-centric. Each new non-empty `Company name Latin alphabet` row is the start of a brokerage record, and blank company-name rows continue the most recent brokerage with additional contact data. Modeling brokerages as the lead primitive keeps imports sane and lets enrichment layer in multiple contacts naturally.

## Main entities

### Auth / users
- `User`
- `Account`
- `Session`
- `VerificationToken`

### Outreach CRM
- `Lead`
- `Contact`
- `LeadAssignment`
- `Activity`
- `Disposition`
- `Call`
- `Recording`
- `Note`
- `Task`
- `FollowUp`
- `Tag`
- `LeadTag`

### Imports
- `ImportJob`
- `ImportRow`

### Email + placeholders
- `OAuthConnection`
- `EmailAccount`
- `EmailThread`
- `EmailMessage`

## Query strategy
For lead list performance, the app uses:
- server-side pagination
- indexed lead fields
- filtered Prisma queries
- no loading of all leads into the browser

The list page is intentionally narrow:
- brokerage
- status
- assignee
- primary contact
- phone
- state
- agency size
- last contacted
- tags

That keeps the row payload light.

## Queue strategy
The queue is based on current assignments:
- only `LeadAssignment.isCurrent = true`
- exclude terminal lead statuses
- order oldest-touch first

This makes the SDR queue behave like a focused dial list instead of a random walk through the database.

## Import strategy
The importer is intentionally shared across UI and CLI so large-file behavior and validation rules stay consistent.

### Preflight rules
- detect true broker results export
- reject search-summary exports
- detect unknown formats with a clear human message

### Row parsing
- lead header rows create new `ParsedLeadInput`
- continuation rows append contacts / enrichment
- contacts are merged within a brokerage using normalized full name / email / phone keys

### Persistence
For each parsed brokerage:
- try to find an existing lead via normalized brokerage + domain/website/phone
- update missing fields when an existing lead is found
- otherwise create a new lead
- upsert contacts on the matched lead
- record raw source rows in `ImportRow`

## Placeholder integrations
The current build deliberately avoids pretending placeholders are real syncs.

### CloudTalk
- phone links are generated from `CLOUDTALK_CLICK_TO_CALL_URL_TEMPLATE`
- calls are logged in CRM manually after click-to-call
- recordings are stored as metadata / URL placeholders

### Gmail / Outlook
- connect actions create placeholder `OAuthConnection` + `EmailAccount`
- send/reply stores outbound mail in local `EmailThread` / `EmailMessage`
- manual sync updates sync timestamps and statuses
- swapping to real provider clients later should only touch the integration layer

## Security / permissions
- `ADMIN` can access imports and lead reassignment
- `SDR` can work assigned leads, log calls, add notes, create tasks, schedule follow-ups, and use mailbox features
- pages are protected with Auth.js middleware
- route handlers also check the session

## Why this shape for V1?
Because V1 should be useful, not philosophical.
