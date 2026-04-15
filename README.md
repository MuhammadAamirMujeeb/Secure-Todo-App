# Secure Todo App

An encrypted task manager built with Next.js, Drizzle, and BetterAuth.

---

## Reference Documents

| File | Description |
|------|-------------|
| [`docs/rules.md`](docs/rules.md) | Project rules — stack, architecture, coding standards, and quality checklist enforced during development |
| [`docs/prompt.md`](docs/prompt.md) | Original build prompt — step-by-step plan used to generate this application |

---

## Tech Stack

| Layer       | Technology              | Version   |
|-------------|-------------------------|-----------|
| Framework   | Next.js (App Router)    | 16.2.3    |
| Language    | TypeScript (strict)     | ^5        |
| ORM         | Drizzle ORM             | ^0.45.2   |
| Database    | SQLite via better-sqlite3 | ^12.9.0  |
| Auth        | BetterAuth              | ^1.6.3    |
| Styling     | Tailwind CSS            | ^4        |
| Runtime     | Node.js                 | 20+       |
| Package Mgr | pnpm                    | —         |

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd secure-todo-app
```

### 2. Install dependencies

```bash
pnpm install
pnpm rebuild better-sqlite3   # build native bindings
pnpm rebuild esbuild           # build esbuild (needed by drizzle-kit)
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=./db/sqlite.db
ENCRYPTION_KEY=<64-char hex string>   # openssl rand -hex 32
BETTER_AUTH_SECRET=<base64 secret>    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Generate and run database migrations

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 5. Run the development server

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## Architecture Overview

### Why Server Components + Server Actions

The App Router default (Server Components) means data fetching happens on the server — there is no client-side API call for reading todos. This eliminates a whole class of client-side data exposure bugs. Server Actions replace API routes for mutations, giving built-in CSRF protection and type-safe calls from client components without a fetch layer.

### Why Drizzle over Prisma

Drizzle is schema-first and generates zero runtime overhead — it compiles queries to raw SQL with full TypeScript inference. Prisma generates a heavyweight client and abstracts SQL in ways that make raw control harder. For a security-sensitive app where you want to audit exactly what hits the database, Drizzle's explicitness is an advantage.

### Why SQLite for this project

SQLite requires no server process, no connection pool, and produces a single file that is easy to inspect and back up. For a local-first or single-instance deployment this is ideal. For production at scale, the same Drizzle schema would migrate to PostgreSQL by changing the driver and `dialect`.

### Data Flow

```
User Action
  → Client Component (form submit / button click)
  → Server Action (lib/actions/todo-actions.ts)
    → Validate input (Zod)
    → Auth check (BetterAuth session)
    → Encrypt / Decrypt (server/crypto.ts)
    → DB query (Drizzle → SQLite)
  → revalidatePath("/dashboard")
  → Server Component re-renders with fresh data
```

Encrypted data never leaves the server. Decryption happens in Server Actions before the result is serialized as props.

---

## Encryption Deep-Dive

### Algorithm: AES-256-GCM

- **AES-256**: 256-bit key (32 bytes, stored as a 64-char hex string in `ENCRYPTION_KEY`).
- **GCM mode**: Galois/Counter Mode provides *authenticated encryption* — the ciphertext includes an authentication tag that detects tampering. This is why GCM was chosen over CBC: CBC only encrypts, it does not authenticate. A tampered CBC ciphertext decrypts silently to garbage; a tampered GCM ciphertext throws an authentication error.

### Per-Record IV

A unique random 12-byte IV is generated for every encryption call using `crypto.randomBytes(12)`. Reusing an IV with the same key under GCM is catastrophic (it leaks the key stream), so per-record IVs are non-negotiable.

### Storage Format

```
iv:authTag:ciphertext
```

All three segments are hex-encoded and stored as a single string in the `encrypted_title` column. The IV and auth tag are needed for decryption and are not secret — only the key is.

### Key Management

The key is read from `process.env.ENCRYPTION_KEY` and validated at call time. The function `getKey()` in `server/crypto.ts` throws with a descriptive message if the key is absent or not a 64-char hex string, so misconfiguration is caught at startup rather than silently producing wrong results.

### Threat Model

- **At-rest confidentiality**: If the SQLite file is exfiltrated, task titles are unreadable without `ENCRYPTION_KEY`.
- **Integrity**: GCM auth tags prevent undetected modification of ciphertext in the database.
- **Limitation**: The key is app-wide. A compromise of the server environment exposes all records. See Trade-offs below.

---

## Trade-offs

### Single app-wide key vs. per-user derived keys

In production I would derive a unique encryption key per user from a master key using HKDF: `HKDF(masterKey, userId, "todo-encryption")`. This way a leaked record for one user does not compromise all users. For this assessment, a single key was used per the SQLite/simplicity constraint.

### No key rotation mechanism

A production system would version keys (e.g., store `v1:iv:tag:ciphertext`) and re-encrypt records in a background job when the key is rotated. Without versioning, changing `ENCRYPTION_KEY` breaks all existing records.

### SQLite vs. PostgreSQL

SQLite was required by the spec. For a multi-user production deployment I would use PostgreSQL with connection pooling (PgBouncer). The Drizzle schema requires only a dialect change — all query code stays identical.

### No email verification / OAuth

BetterAuth supports email verification and social OAuth providers. These were out of scope for this assessment. In production, email verification prevents account enumeration and OAuth reduces password-related risk surface.

---

## Screenshots

> Run `pnpm dev`, sign up, and add a few tasks to see the dashboard.
>
> The `db/sqlite.db` file stores task titles as `iv:authTag:ciphertext` — open it with any SQLite viewer to verify encryption.

---

## Project Structure

```
├── app/
│   ├── (auth)/                     # Auth route group
│   │   ├── layout.tsx              # Centered card layout for auth pages
│   │   ├── sign-in/page.tsx        # Sign-in form (Client Component)
│   │   └── sign-up/page.tsx        # Sign-up form (Client Component)
│   ├── api/auth/[...all]/route.ts  # BetterAuth catch-all handler
│   ├── dashboard/
│   │   ├── _components/            # Route-scoped Client Components
│   │   │   ├── create-todo.tsx     # Add task form with useTransition
│   │   │   ├── todo-list.tsx       # Renders todo items or empty state
│   │   │   ├── todo-item.tsx       # Checkbox + title + delete button
│   │   │   ├── todo-skeleton.tsx   # Suspense skeleton loader
│   │   │   └── sign-out-button.tsx # BetterAuth sign-out trigger
│   │   └── page.tsx                # Dashboard (Server Component)
│   ├── globals.css                 # Design tokens, component classes, dark mode
│   ├── layout.tsx                  # Root layout with fonts and metadata
│   └── page.tsx                    # Landing page / auth redirect
├── server/
│   ├── auth.ts                     # BetterAuth server config + drizzle adapter
│   ├── crypto.ts                   # AES-256-GCM encrypt/decrypt utilities
│   └── db/
│       ├── index.ts                # Drizzle client (better-sqlite3)
│       ├── schema.ts               # All table schemas (users, sessions, todos…)
│       └── migrations/             # Drizzle-kit generated SQL migrations
├── lib/
│   ├── auth-client.ts              # BetterAuth browser client
│   ├── validators.ts               # Zod schemas for Server Action inputs
│   └── actions/
│       └── todo-actions.ts         # createTodo / getTodos / toggleTodo / deleteTodo
├── components/
│   └── ui/                         # Shared UI primitives (reserved for future use)
├── docs/
│   ├── rules.md                    # Project rules and coding standards
│   └── prompt.md                   # Original build prompt / specification
├── middleware.ts                   # Cookie-based route protection for /dashboard
├── drizzle.config.ts               # Drizzle-kit config (schema path, DB dialect)
├── AI_DEVELOPMENT_LOG.md           # Tool usage, prompts, and time log
└── README.md
```
