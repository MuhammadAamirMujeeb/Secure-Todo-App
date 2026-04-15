# Prompt: Build the Secure Todo App

> Copy this entire prompt into Cursor Composer (or Claude Code) along with the `rules.md` file.
> Reference: "Follow every rule in `rules.md` without deviation."

---

## The Prompt

```
You are building a Secure Todo App as a technical assessment. Follow every rule defined in the attached `rules.md` file strictly — no substitutions for stack, structure, or conventions.

## Project Overview

Build a full-stack Todo application where task titles are encrypted at rest in the database using AES-256-GCM, with BetterAuth handling user authentication. The app uses Next.js 14+ App Router, TypeScript (strict), Drizzle ORM, and SQLite.

## Step-by-Step Build Plan

Execute these steps in order. After each step, commit with the specified message.

---

### Step 1 — Project Scaffold
Commit: `chore(init): scaffold Next.js project with TypeScript and Tailwind`

1. Initialize a new Next.js 14+ project with App Router, TypeScript, Tailwind CSS, and ESLint.
2. Use pnpm as the package manager.
3. Set up path aliases in tsconfig.json: `"@/*": ["./*"]`.
4. Enable `strict: true` in tsconfig.json.
5. Install dependencies:
   - `drizzle-orm better-sqlite3 better-auth nanoid zod`
   - `drizzle-kit @types/better-sqlite3 -D`
6. Create the folder structure exactly as defined in rules.md Section 2.
7. Create `.env.example` with all variables from rules.md Section 8.
8. Create `.env.local` with working default values (generate a random ENCRYPTION_KEY and BETTER_AUTH_SECRET).
9. Add `.env.local` to `.gitignore`.

---

### Step 2 — Database & Schema
Commit: `feat(db): configure Drizzle ORM with SQLite and schema`

1. Create `server/db/schema.ts` with the exact schema from rules.md Section 5 (users, sessions, accounts, verifications, todos tables).
2. Create `server/db/index.ts` — initialize better-sqlite3 and Drizzle client. Export `db` instance.
3. Create `drizzle.config.ts` pointing to the schema and SQLite database file.
4. Generate and run the initial migration with `drizzle-kit generate` and `drizzle-kit migrate`.
5. Verify the database file is created and tables exist.

---

### Step 3 — Encryption Utilities
Commit: `feat(crypto): implement AES-256-GCM encrypt/decrypt utilities`

1. Create `server/crypto.ts` with two exported functions:
   - `encrypt(plaintext: string): string` — generates random 12-byte IV, encrypts with AES-256-GCM using ENCRYPTION_KEY from env, returns `iv:authTag:ciphertext` (all hex-encoded).
   - `decrypt(encrypted: string): string` — splits the stored format, decrypts, returns plaintext.
2. Handle edge cases: empty strings, malformed input (throw descriptive errors).
3. Read the key from `process.env.ENCRYPTION_KEY` and validate it is a 64-char hex string on startup.
4. Add a brief JSDoc comment explaining the approach on each function.

---

### Step 4 — Authentication
Commit: `feat(auth): set up BetterAuth with email/password`

1. Create `server/auth.ts` — configure BetterAuth with:
   - SQLite database (using the same better-sqlite3 instance from Step 2)
   - Email + password authentication (with Drizzle adapter)
   - Session management via cookies
2. Create `app/api/auth/[...all]/route.ts` — BetterAuth API catch-all handler.
3. Create `lib/auth-client.ts` — BetterAuth client instance for use in client components.
4. Create `app/(auth)/sign-in/page.tsx` — sign-in form with email and password fields. Client component.
5. Create `app/(auth)/sign-up/page.tsx` — sign-up form with name, email, password fields. Client component.
6. Create middleware or layout-level auth check: redirect unauthenticated users from `/dashboard` to `/sign-in`.
7. Style the auth pages: centered card layout, clean typography, visible validation errors.

---

### Step 5 — Todo CRUD Server Actions
Commit: `feat(todos): implement CRUD Server Actions with encryption`

1. Create `lib/validators.ts` with Zod schemas:
   - `createTodoSchema`: title is string, min 1 char, max 500 chars, trimmed.
   - `todoIdSchema`: id is string, non-empty.
2. Create `lib/actions/todo-actions.ts` with these Server Actions:
   - `createTodo(formData: FormData)` — validate input with Zod, check auth session, encrypt title, insert into DB with nanoid as ID, revalidatePath.
   - `getTodos()` — check auth session, query all todos for current user ordered by createdAt desc, decrypt each title, return array.
   - `toggleTodo(id: string)` — validate ID, check auth session, verify todo belongs to user, toggle completed boolean, revalidatePath.
   - `deleteTodo(id: string)` — validate ID, check auth session, verify todo belongs to user, delete from DB, revalidatePath.
3. Every action must:
   - Return `{ success: boolean; error?: string; data?: T }`.
   - Never throw — catch all errors and return structured responses.
   - Re-verify the session and that the todo belongs to the user.

---

### Step 6 — Todo Dashboard UI
Commit: `feat(ui): build todo dashboard with create/complete/delete`

1. Create `app/dashboard/page.tsx` as a Server Component:
   - Call `getTodos()` to fetch decrypted todos.
   - Pass todos as props to client components.
   - Include a sign-out button that calls BetterAuth sign-out.
   - Wrap the todo list in a Suspense boundary with a skeleton loader.

2. Create client components in `app/dashboard/_components/`:

   **`create-todo.tsx`** (Client Component):
   - Form with a single text input + submit button.
   - Use `useActionState` (React 19) or `useTransition` to handle the Server Action.
   - Clear input after successful creation.
   - Show inline error if validation fails.

   **`todo-list.tsx`** (Client Component):
   - Receives todos array as prop.
   - Maps over todos, renders `TodoItem` for each.
   - Shows an empty state message when list is empty ("No tasks yet. Add one above!").

   **`todo-item.tsx`** (Client Component):
   - Checkbox to toggle complete/incomplete (calls `toggleTodo` action).
   - Title text with strikethrough + muted color when completed.
   - Delete button (icon-only with aria-label) that calls `deleteTodo` action.
   - Use `useTransition` for optimistic-feeling updates.

3. Layout and styling:
   - Max width `max-w-2xl`, centered horizontally, generous vertical padding.
   - Header with app name and user's name + sign-out button.
   - Card-style container for the todo list with subtle border/shadow.
   - Responsive: works beautifully on 360px mobile up to desktop.

---

### Step 7 — UI Polish & Dark Mode
Commit: `style(ui): polish layout, dark mode, responsive design`

1. Add dark mode support using Tailwind `dark:` variants and `prefers-color-scheme`.
2. Choose a distinctive Google Font for headings (load via `next/font/google`). Use a clean sans-serif for body.
3. Define a color palette as CSS variables in `globals.css`:
   - Primary accent color (not purple/blue gradient — try teal, amber, rose, or slate).
   - Background, surface, border, text-primary, text-muted colors for light and dark.
4. Add micro-interactions: button hover/press transitions, checkbox animation, smooth input focus ring.
5. Add a proper favicon and page title via metadata.
6. Ensure touch targets are at least 44px.
7. Test accessibility: keyboard tab navigation, color contrast, screen reader labels.

---

### Step 8 — Landing Page
Commit: `feat(ui): add landing page with redirect logic`

1. Update `app/page.tsx`:
   - If user is authenticated, redirect to `/dashboard`.
   - If not, show a simple landing page with the app name, a one-line description, and sign-in/sign-up buttons.

---

### Step 9 — Documentation
Commit: `docs(readme): add setup, architecture, and trade-offs`

1. Write `README.md` following rules.md Section 9:
   - Project title: "Secure Todo App"
   - One-line description: "An encrypted task manager built with Next.js, Drizzle, and BetterAuth."
   - Tech stack with versions
   - Setup instructions (clone, pnpm install, configure .env.local, generate and run migrations, pnpm dev)
   - Architecture overview explaining: why Server Components + Server Actions, why Drizzle over Prisma, why SQLite for simplicity
   - Encryption deep-dive: algorithm (AES-256-GCM), IV per record, storage format, why GCM over CBC (authenticated encryption), where encryption/decryption happens in the data flow
   - Trade-offs section:
     * Single app-wide key vs per-user keys (would use per-user derived keys in production)
     * No key rotation mechanism (would add versioned keys in production)
     * SQLite vs PostgreSQL (chose SQLite per requirements; would use PG in production)
     * Mock vs full OAuth (scope limitation)
   - Screenshot(s) of the dashboard

2. Create `AI_DEVELOPMENT_LOG.md` with placeholder structure for the developer to fill in their tool usage, prompts, and timing.

---

## Critical Reminders

- NEVER use `any` type. If you're tempted, define a proper type.
- NEVER import from `server/` in client components. Data flows through Server Actions only.
- NEVER send encrypted data to the client. Decrypt server-side before returning.
- NEVER hardcode the encryption key or auth secret.
- Every Server Action MUST check auth and ownership before acting.
- Use `nanoid` for generating todo IDs (not auto-increment, not uuid).
- All dates stored as Unix timestamps (integer) in SQLite.
- Test the full flow manually: sign up → sign in → create todo → verify it's encrypted in DB → complete it → delete it → sign out.
```

---

## How to Use This Prompt

### With Cursor Composer
1. Open your project directory in Cursor.
2. Place `rules.md` in the project root.
3. Open Composer (Cmd+I / Ctrl+I).
4. Add `rules.md` as context (drag into Composer or @-mention it).
5. Paste the entire prompt above into Composer.
6. Let it execute step by step. Review each step before accepting.
7. Make commits after each step as specified.

### With Claude Code
1. Place `rules.md` in the project root.
2. Start Claude Code in your terminal.
3. Feed the prompt and reference rules.md: `Follow rules.md strictly. Here is the build plan: [paste prompt]`
4. Claude Code will create files and run commands. Review the output.
5. Commit after each logical step.

### Tips for Best Results
- **Don't rush.** Execute one step at a time and verify before moving on.
- **Check the DB.** After Step 5, open the SQLite database and confirm task titles are actually encrypted gibberish.
- **Override when needed.** If the AI generates something that conflicts with rules.md, correct it. Document the override in AI_DEVELOPMENT_LOG.md — this is what the evaluators want to see.
- **Test edge cases:** Empty title, very long title, XSS in title (`<script>alert('xss')</script>`), deleting another user's todo.
