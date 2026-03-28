# File tree

```text
.
├── docs
│   ├── ARCHITECTURE.md
│   └── FILE_TREE.md
├── prisma
│   ├── schema.prisma
│   └── seed.ts
├── scripts
│   ├── change-password.ts
│   ├── import-file.ts
│   └── import-worker.ts
├── src
│   ├── app
│   │   ├── (app)
│   │   │   ├── imports
│   │   │   │   └── page.tsx
│   │   │   ├── leads
│   │   │   │   ├── [leadId]
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── queue
│   │   │   │   └── page.tsx
│   │   │   ├── settings
│   │   │   │   └── integrations
│   │   │   │       └── page.tsx
│   │   │   ├── actions.ts
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── (public)
│   │   │   ├── login
│   │   │   │   ├── actions.ts
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   └── [...nextauth]
│   │   │   │       └── route.ts
│   │   │   └── imports
│   │   │       ├── [jobId]
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── not-found.tsx
│   ├── components
│   │   ├── activity-timeline.tsx
│   │   ├── app-shell.tsx
│   │   ├── empty-state.tsx
│   │   ├── import-uploader.tsx
│   │   ├── lead-status-badge.tsx
│   │   ├── login-form.tsx
│   │   ├── page-header.tsx
│   │   ├── pagination-controls.tsx
│   │   ├── phone-link.tsx
│   │   ├── section-card.tsx
│   │   ├── sign-out-button.tsx
│   │   ├── stat-card.tsx
│   │   └── submit-button.tsx
│   ├── lib
│   │   ├── importer
│   │   │   ├── detect.ts
│   │   │   ├── parse.ts
│   │   │   ├── persist.ts
│   │   │   ├── process-import-job.ts
│   │   │   └── types.ts
│   │   ├── integrations
│   │   │   ├── email
│   │   │   │   ├── gmail.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── outlook.ts
│   │   │   │   └── types.ts
│   │   │   └── cloudtalk.ts
│   │   ├── activity.ts
│   │   ├── auth-helpers.ts
│   │   ├── constants.ts
│   │   ├── db.ts
│   │   ├── email.ts
│   │   ├── lead-queries.ts
│   │   ├── pagination.ts
│   │   ├── phone.ts
│   │   └── utils.ts
│   ├── types
│   │   └── next-auth.d.ts
│   ├── auth.ts
│   └── middleware.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```
