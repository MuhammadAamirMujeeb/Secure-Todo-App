# AI Development Log

## Tool Used

**Claude Code** (Claude Sonnet 4.6) — invoked via the Claude Code CLI / IDE extension.

---

## Prompting Sequence

### Prompt 1 — Full Build Plan
A single comprehensive prompt was provided containing the complete step-by-step build plan and a reference to `rules.md`. The prompt specified all 9 steps, each with explicit file paths, implementation requirements, and commit messages.

**Produced:** The agent read `rules.md` in full, then executed all 9 steps sequentially, committing at each step boundary.

---

### Key Implementation Decisions Made by AI

| Decision | Outcome |
|----------|---------|
| Scaffolded Next.js in a temp `secure-todo/` subdirectory then `rsync`'d to project root to work around pnpm naming restrictions | Avoided re-running expensive install |
| Added `"pnpm": { "onlyBuiltDependencies": ["better-sqlite3", "esbuild"] }` to `package.json` | Allowed native bindings to build without interactive prompt |
| Fixed `.gitignore` — changed `db/` to `/db/` to prevent masking `server/db/` | Ensures schema/migrations are committed |
| Zod v4 uses `.issues` not `.errors` on `ZodError` | Fixed TypeScript error caught by `pnpm tsc --noEmit` |
| Used `color-mix()` for teal accent alpha variants instead of hardcoded rgba | Works with CSS variable-based color system |

---

## Where AI Suggestions Were Overridden

_None — the AI followed the build plan directly without requiring manual correction beyond the automated fixes above._

---

## Time Spent (approximate)

| Phase                     | Duration  |
|---------------------------|-----------|
| Scaffold + deps install   | ~20 min   |
| DB schema + migrations    | ~10 min   |
| Crypto utilities          | ~15 min   |
| BetterAuth setup          | ~25 min   |
| Server Actions (CRUD)     | ~20 min   |
| Dashboard UI components   | ~25 min   |
| Globals CSS + dark mode   | ~15 min   |
| Landing page              | ~10 min   |
| README + docs             | ~15 min   |
| TypeScript fixes + build  | ~15 min   |
| **Total**                 | **~2 hr 30 min** |

---

## Models Used

- **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — main coding agent for all file generation, debugging, and documentation.
- One sub-agent invocation (Explore type, also Sonnet 4.6) to research the BetterAuth v1.6.3 API before writing `server/auth.ts`.
