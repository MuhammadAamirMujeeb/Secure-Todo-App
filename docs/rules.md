# Project Rules — Secure Todo App

> These rules govern all code generation, architecture decisions, and UI implementation for this project.
> Every AI agent (Cursor, Claude Code, etc.) MUST follow these rules without exception.

---

## 1. Stack & Versions (Strict — No Substitutions)

| Layer          | Technology                | Notes                                      |
|----------------|---------------------------|--------------------------------------------|
| Framework      | **Next.js 14+ (App Router)** | Use `app/` directory, Server Components by default |
| Language       | **TypeScript (strict mode)** | No `any` types. Enable `strict: true` in tsconfig |
| ORM            | **Drizzle ORM**           | Schema-first, type-safe queries only       |
| Database       | **SQLite** via `better-sqlite3` | Local file-based DB (`./db/sqlite.db`)     |
| Auth           | **BetterAuth**            | Or mock auth if BetterAuth setup is complex |
| Styling        | **Tailwind CSS 3.4+**     | No CSS modules, no styled-components       |
| Package Mgr    | **pnpm**                  | Lockfile must be committed                 |

### Banned Technologies
- No Prisma, no Mongoose, no Sequelize
- No Express (use Next.js API routes / Server Actions)
- No Redux, no Zustand (use React Server Components + minimal client state)
- No Firebase, no Supabase
- No CSS-in-JS libraries

---

## 2. Project Structure

```
secure-todo-app/
├── app/
│   ├── layout.tsx              # Root layout with auth provider
│   ├── page.tsx                # Landing / redirect
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx            # Main todo list (Server Component)
│   │   └── _components/        # Client components for this route
│   │       ├── todo-list.tsx
│   │       ├── todo-item.tsx
│   │       ├── create-todo.tsx
│   │       └── todo-filters.tsx
│   └── api/
│       └── auth/[...all]/route.ts  # BetterAuth catch-all
├── server/
│   ├── db/
│   │   ├── index.ts            # Drizzle client instance
│   │   ├── schema.ts           # All Drizzle table schemas
│   │   └── migrations/         # Drizzle-kit generated migrations
│   ├── auth.ts                 # BetterAuth server config
│   └── crypto.ts               # Encryption/decryption utilities
├── lib/
│   ├── auth-client.ts          # BetterAuth client config
│   ├── actions/
│   │   └── todo-actions.ts     # Server Actions for CRUD
│   └── validators.ts           # Zod schemas for input validation
├── components/
│   └── ui/                     # Shared UI primitives (button, input, etc.)
├── drizzle.config.ts
├── .env.local
├── .env.example
└── README.md
```

### Structure Rules
- **One concern per file.** No file should exceed 150 lines. Split if it does.
- **Co-locate route-specific components** inside `_components/` next to the page.
- **Shared components** go in root `components/`.
- **All DB logic** stays inside `server/`. No Drizzle imports in `app/` or `components/`.
- **Server Actions** are the ONLY bridge between UI and DB — defined in `lib/actions/`.

---

## 3. Architecture Principles

### 3.1 Server-First Rendering
- Default to **React Server Components**. Only add `"use client"` when the component needs interactivity (forms, click handlers, state).
- Fetch data in Server Components, pass as props to Client Components.
- Never call `fetch()` from client to an API route for CRUD — use **Server Actions** instead.

### 3.2 Data Flow
```
User Action → Server Action (lib/actions/) → DB Query (server/db/) → Revalidate Path
```
- Server Actions must call `revalidatePath("/dashboard")` after mutations.
- No client-side caching of todo data. The server is the source of truth.

### 3.3 Authentication Flow
- BetterAuth handles sessions via cookies.
- Every Server Action and protected page must validate the session.
- Unauthenticated users are redirected to `/sign-in`.
- Auth check pattern:
  ```ts
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");
  ```

### 3.4 Encryption Architecture
- **Algorithm:** AES-256-GCM (via Node.js `crypto` module).
- **Key:** Derived from `ENCRYPTION_KEY` env var (32-byte hex string).
- **IV:** Generate a unique random 12-byte IV per encryption.
- **Storage format:** `iv:authTag:ciphertext` (all hex-encoded, colon-separated).
- **Where:** Encrypt in Server Action before DB insert. Decrypt after DB read before sending to client.
- **NEVER** send encrypted data to the client. Decryption only happens server-side.

```ts
// server/crypto.ts — expected API
export function encrypt(plaintext: string): string;
export function decrypt(ciphertext: string): string;
```

---

## 4. Coding Standards

### 4.1 TypeScript
- `strict: true` in `tsconfig.json`. No escape hatches.
- Define explicit return types on all exported functions.
- Use Drizzle's inferred types for DB rows — do not duplicate type definitions.
- Zod for runtime validation of all user inputs (Server Action parameters).
- Prefer `const` over `let`. Never use `var`.

### 4.2 Naming Conventions
| Element         | Convention          | Example                    |
|-----------------|---------------------|----------------------------|
| Files           | kebab-case          | `todo-actions.ts`          |
| Components      | PascalCase          | `TodoItem`                 |
| Functions       | camelCase           | `createTodo`               |
| DB columns      | snake_case          | `created_at`               |
| Env vars        | SCREAMING_SNAKE     | `ENCRYPTION_KEY`           |
| Types/Interfaces| PascalCase          | `Todo`, `CreateTodoInput`  |

### 4.3 Error Handling
- Server Actions return `{ success: boolean; error?: string; data?: T }`.
- Never throw raw errors from Server Actions — catch and return structured responses.
- Display user-friendly error messages in the UI via toast or inline error.
- Log detailed errors server-side with `console.error`.

### 4.4 Security Rules
- **Input Validation:** Every Server Action validates input with Zod before touching DB.
- **SQL Injection:** Drizzle's parameterized queries handle this — never use raw SQL.
- **XSS:** React's default escaping + no `dangerouslySetInnerHTML`.
- **CSRF:** Server Actions have built-in CSRF protection in Next.js.
- **Secrets:** All keys in `.env.local`, never hardcoded. Provide `.env.example`.
- **Auth on every mutation:** Every Server Action re-checks `session.user.id`.

### 4.5 Imports
- Use path aliases: `@/server/...`, `@/lib/...`, `@/components/...`.
- Configured in `tsconfig.json`:
  ```json
  { "paths": { "@/*": ["./*"] } }
  ```

---

## 5. Database Schema

```ts
// server/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),          // nanoid
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  encryptedTitle: text("encrypted_title").notNull(), // AES-256-GCM encrypted
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

---

## 6. UI / UX Rules

### 6.1 Design Direction
- **Aesthetic:** Clean, modern, slightly editorial. Not generic SaaS. Not Material UI defaults.
- **Color palette:** Use a strong primary accent (not purple-gradient-on-white). Define as CSS vars.
- **Typography:** Use one distinctive Google Font for headings + a clean sans-serif for body.
- **Spacing:** Generous whitespace. Let elements breathe.
- **Dark mode:** Support `prefers-color-scheme` via Tailwind `dark:` variants.

### 6.2 Component Patterns
- Buttons: Clear hover/active/disabled states with transitions.
- Inputs: Visible focus rings, proper labels, placeholder text.
- Todo items: Checkbox + title + delete action. Completed items get strikethrough + muted color.
- Loading: Use skeleton loaders or `Suspense` boundaries, not spinners.
- Empty state: Show a helpful message when no todos exist.
- Transitions: Subtle fade/slide for adding/removing todos (CSS transitions, not heavy libraries).

### 6.3 Responsiveness
- Mobile-first design. The todo list must be usable on 360px width.
- Max container width: `max-w-2xl` centered.
- Touch-friendly: tap targets minimum 44px.

### 6.4 Accessibility
- Semantic HTML (`<main>`, `<section>`, `<form>`, `<button>`, `<label>`).
- Keyboard navigation: Tab through all interactive elements.
- `aria-label` on icon-only buttons (delete).
- Color contrast ratio: minimum 4.5:1.

---

## 7. Git & Commit Rules

### 7.1 Commit Message Format
```
type(scope): description

# Examples:
feat(auth): add BetterAuth sign-in/sign-up flow
feat(todos): implement encrypted CRUD with Server Actions
fix(crypto): handle empty string edge case in encrypt()
style(ui): add dark mode support and polish todo list
chore(db): add drizzle migration for todos table
docs(readme): add setup instructions and architecture notes
```

### 7.2 Commit Cadence
Make small, logical commits. Suggested sequence:
1. `chore(init): scaffold Next.js project with TypeScript and Tailwind`
2. `feat(db): configure Drizzle ORM with SQLite and schema`
3. `feat(crypto): implement AES-256-GCM encrypt/decrypt utilities`
4. `feat(auth): set up BetterAuth with email/password`
5. `feat(todos): implement CRUD Server Actions with encryption`
6. `feat(ui): build todo dashboard with create/complete/delete`
7. `style(ui): polish layout, dark mode, responsive design`
8. `docs(readme): add setup, architecture, and trade-offs`

---

## 8. Environment Variables

```env
# .env.example
DATABASE_URL=./db/sqlite.db
ENCRYPTION_KEY=           # 64-char hex string (32 bytes). Generate: openssl rand -hex 32
BETTER_AUTH_SECRET=       # Random secret for BetterAuth. Generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 9. README Requirements

The README.md must contain:
1. **Project title and one-line description**
2. **Tech stack** (with versions)
3. **Setup instructions** (clone, install, env vars, migrate, run)
4. **Architecture overview** — why App Router, why Server Actions, why Drizzle
5. **Encryption explanation** — algorithm, key management, storage format, threat model
6. **Trade-offs** — what you'd do differently in production (KMS, per-user keys, etc.)
7. **Screenshots** (at least 1 of the dashboard)

---

## 10. AI Tool Usage Documentation

Create a file `AI_DEVELOPMENT_LOG.md` at the project root containing:
1. **Tool used** (e.g., Cursor + Claude Sonnet 4)
2. **Prompting sequence** — each major prompt and what it produced
3. **Where you overrode AI suggestions** — and why
4. **Time spent** — total and per phase (setup, auth, CRUD, encryption, UI, polish)
5. **Model(s) used** — specific model names and versions

---

## 11. Quality Checklist (Pre-Submission)

Before submitting, verify every item:

- [ ] `pnpm install && pnpm dev` works from clean clone
- [ ] Sign-up and sign-in work correctly
- [ ] Can create, view, complete, and delete todos
- [ ] Database stores task titles encrypted (verify with DB viewer)
- [ ] Decrypted titles display correctly in UI
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] No `any` types in codebase
- [ ] `.env.example` is present with all required vars
- [ ] README has setup instructions, architecture, encryption explanation
- [ ] AI_DEVELOPMENT_LOG.md is filled out
- [ ] Git history has clean, logical commits
- [ ] App is responsive on mobile
- [ ] Dark mode works
