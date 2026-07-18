# 🏠 Clipping House — Project Memory

> **Purpose:** This file is the single source of truth for any AI coding agent working on this project. Read it fully before making any changes.

---

## 📌 Project Overview

**Clipping House** is a personal productivity dashboard for managing video clipping campaigns. It helps content creators:
- Track campaigns (platform, niche, RPM, rules, results)
- Store viral content references ("Stored Contents")
- Maintain a categorized knowledge base ("Context")
- Generate AI-powered creative briefs for campaigns
- Track daily work time with a built-in timer

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16.2** (App Router) |
| Language | **TypeScript 5** |
| Database | **Neon (serverless PostgreSQL)** |
| ORM | **Prisma 6** (with `@prisma/adapter-neon` driver adapter) |
| AI | **OpenRouter API** (for creative brief generation) |
| Styling | **Vanilla CSS** (single `globals.css`, glassmorphic dark theme) |
| Deployment | **Render** (production) |
| Runtime | **Node.js** |

---

## 📁 File & Folder Structure

```
Clipping_house/
├── prisma/
│   └── schema.prisma          ← All database models
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← Root layout (title: "Clipping House")
│   │   ├── page.tsx            ← Home / Quick Actions dashboard (client component)
│   │   ├── globals.css         ← ALL styles live here (glassmorphic dark theme)
│   │   ├── actions.ts          ← ALL server actions (DB reads/writes via Prisma)
│   │   ├── components/
│   │   │   └── AppShell.tsx    ← Sidebar nav + layout shell (client component)
│   │   ├── campaigns/
│   │   │   ├── page.tsx        ← Server component: fetches data, renders CampaignsClient
│   │   │   └── CampaignsClient.tsx ← LARGE client component (~52kb) with full campaign UI
│   │   ├── context/
│   │   │   ├── page.tsx        ← Server component: fetches context categories
│   │   │   └── [client tsx]    ← Context management UI
│   │   ├── stored-contents/
│   │   │   ├── page.tsx        ← Server component: fetches stored content
│   │   │   └── [client tsx]    ← Stored content management UI
│   │   ├── statistics/
│   │   │   └── page.tsx        ← Statistics / analytics view
│   │   └── api/
│   │       ├── export/         ← POST endpoint: calls OpenRouter, returns AI brief
│   │       └── timer/          ← GET/POST endpoints: daily timer persistence
│   └── lib/
│       └── prisma.ts           ← Singleton Prisma client (uses Neon adapter)
├── .env                        ← Local secrets (NOT committed)
├── .env.example                ← Template for env variables
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

## 🗃️ Database Schema (Prisma)

### `Campaign`
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `name` | String | Campaign name |
| `rpm` | String? | Revenue per thousand views |
| `platform` | String? | e.g. TikTok, Instagram, YouTube |
| `sound` | String? | Sound/audio used |
| `niche` | String? | Content niche |
| `rules` | String? (Text) | Campaign rules/notes |
| `customFields` | Json? | Flexible key-value extras |
| `isCompleted` | Boolean | Default: false |
| `clips` | Int? | Number of clips produced |
| `earned` | Decimal? | ⚠️ Must convert to `Number()` before sending to client |
| `views` | String? | View count (stored as string, e.g. "17k") |
| `lastExport` | String? (Text) | Cached AI brief output |
| `contexts` | ContextItem[] | Many-to-many join |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### `ContextCategory`
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `name` | String | Category label |
| `description` | String? (Text) | Optional description |
| `items` | ContextItem[] | One-to-many |

### `ContextItem`
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `name` | String | Item label |
| `text` | String (Text) | Full content |
| `categoryId` | String | FK → ContextCategory (Cascade delete) |
| `campaigns` | Campaign[] | Many-to-many join |

### `StoredContent`
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `title` | String | |
| `body` | String (Text) | |

### `DailyTimer`
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `date` | String (unique) | Format: `YYYY-MM-DD` |
| `seconds` | Int | Accumulated seconds |
| `isRunning` | Boolean | Timer state |
| `lastStartedAt` | DateTime? | For calculating elapsed time |

---

## ⚙️ Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
OPENROUTER_API_KEY="sk-or-v1-..."
```

- `DATABASE_URL` → Neon PostgreSQL connection string (works locally and on Render)
- `OPENROUTER_API_KEY` → Used only in `src/app/api/export/` server route

---

## 🔑 Key Conventions & Patterns

### 1. Server Actions (`actions.ts`)
- **All DB calls live in `src/app/actions.ts`** — do not scatter Prisma queries elsewhere.
- Every action uses `revalidatePath("/route")` to bust the Next.js cache after mutations.
- `"use server"` directive at the top of the file.

### 2. Decimal → Number Serialization
- Prisma's `Decimal` type **cannot cross the Server → Client boundary** in Next.js.
- ⚠️ **Always convert** `campaign.earned` with `Number(c.earned)` before returning from any server action.

### 3. Page Architecture (Server + Client Split)
- Every page route has a **thin `page.tsx` server component** that fetches data via server actions.
- The actual UI lives in a **`*Client.tsx` client component** that receives data as props.
- Example: `campaigns/page.tsx` → imports `CampaignsClient.tsx`

### 4. Styling
- **All CSS is in `globals.css`** (29kb). No CSS modules, no Tailwind.
- Theme: Dark glassmorphic aesthetic with color accents (pink, orange, teal, golden).
- CSS classes follow a BEM-like naming: `action-card`, `action-card-top`, `hero-section`, etc.

### 5. AppShell
- `AppShell.tsx` wraps every page with the sidebar navigation.
- Sidebar links: Home (`/`), Campaigns (`/campaigns`), Context (`/context`), Stored Contents (`/stored-contents`), Statistics (`/statistics`).

### 6. Prisma Client Singleton
- `src/lib/prisma.ts` exports a singleton Prisma instance using the Neon serverless adapter.
- Import it as: `import prisma from "@/lib/prisma";`

---

## 🤖 AI / Export Feature

- **Route:** `POST /api/export`
- **Flow:** Client sends `campaignId` → server fetches campaign + linked contexts → calls OpenRouter API → returns creative brief text → client calls `saveExport()` action to cache it in `campaign.lastExport`.
- **Model used:** Configured in the export API route (check `src/app/api/export/`).

---

## 📅 Timer Feature

- **Routes:** `GET /api/timer?date=YYYY-MM-DD`, `POST /api/timer`
- Persists daily work time in the `DailyTimer` table.
- The timer UI is embedded in `AppShell.tsx`.

---

## 🚚 Deployment

- **Platform:** Render
- **Build command:** `npm run build` (runs `prisma generate` via `postinstall` script automatically)
- **Start command:** `npm start`
- **Environment:** Set `DATABASE_URL` and `OPENROUTER_API_KEY` in Render dashboard.

---

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# → http://localhost:3000

# Push schema changes to DB
npx prisma db push

# Open Prisma Studio (DB GUI)
npx prisma studio
```

---

## ⚠️ Known Gotchas & Decisions

1. **`views` column is a `String`**, not a number — it stores values like `"17k"`, `"1.2M"`. Use a formatting function to display properly; do NOT parse to `parseInt` blindly.
2. **`earned` is a Prisma `Decimal`** — always `Number(c.earned)` before returning from server actions.
3. **Next.js 16 App Router** — This is NOT Next.js 13/14. Use the App Router conventions (not Pages Router). Check `node_modules/next/dist/docs/` if unsure.
4. **`customFields` is a `Json` field** — defaults to `[]`, stores arbitrary key-value pairs per campaign.
5. **Context deletion cascades** — Deleting a `ContextCategory` will cascade-delete all its `ContextItem`s (via `onDelete: Cascade` in Prisma).
6. **Many-to-many (Campaign ↔ ContextItem)** — Managed via Prisma's implicit join table. Use `connect` / `disconnect` in Prisma updates, not manual join table manipulation.

---

## 📝 Recent Feature History

| Feature | Status |
|---|---|
| Campaign CRUD (create, complete, delete) | ✅ Done |
| Context category + item management | ✅ Done |
| Delete context categories & items | ✅ Done |
| Stored content CRUD | ✅ Done |
| Link/unlink context items to campaigns | ✅ Done |
| AI export (OpenRouter creative brief) | ✅ Done |
| Export caching in DB (`lastExport`) | ✅ Done |
| Campaign filtering (all fields) | ✅ Done |
| View count formatting fix (`17k` display) | ✅ Done |
| Daily timer with DB persistence | ✅ Done |
| Deployed to Render | ✅ Done |

---

*Last updated: 2026-07-17*
