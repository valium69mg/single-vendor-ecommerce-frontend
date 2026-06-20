# Skill: After git pull

Run this after every `git pull` to check whether the intelligence layer needs updating.

## Step 1 — See what changed
```bash
git diff HEAD@{1} HEAD --name-only
```

## Step 2 — Map changed files to intelligence files

| Changed file pattern | Intelligence file to review |
|---|---|
| `src/api/api.ts` | `.claude/CODEBASE.md` — routes table, data model, API endpoint table |
| `src/api/apiFetch.ts` | `.claude/memory/gotchas.md` — new error codes or behaviors |
| `src/App.tsx` | `.claude/CODEBASE.md` — routes section |
| `src/i18n/index.ts` | No update needed (auto-derivable) |
| `src/components/auth/*.schema.ts` | `.claude/memory/conventions.md` if validation approach changed |
| `src/components/common/*` | `.claude/memory/conventions.md` or `.claude/patterns/` if a component's API changed |
| `src/pages/Admin*Page.tsx` (new file) | `.claude/CODEBASE.md` — routes section |
| `src/hooks/use*Columns.tsx` (new file) | `.claude/CODEBASE.md` — directory tree |
| `vite.config.ts` / `tailwind.config.ts` | `CLAUDE.md` — stack or path alias changes |
| `.env.example` | `CLAUDE.md` and `.claude/CODEBASE.md` — environment variables section |
| `Dockerfile` / `entrypoint.sh` / `nginx.conf.template` | `CLAUDE.md` — deployment section |

## Step 3 — Specific checks per category

**API changes (`api.ts`):**
- New interface? → add to data model section in `CODEBASE.md`
- New function? → add to API endpoint table in `CODEBASE.md`
- Changed response shape? → check if any gotcha or convention references old field names

**New page or route:**
- Add to routes section in `CODEBASE.md`
- Add page file to directory tree

**New common component:**
- Add to the common components table in `CLAUDE.md`

**Schema changes:**
- If validation rules changed (min/max lengths), update `conventions.md`

## Rule
A stale intelligence file is worse than none. Claude will work confidently from wrong context.
If you're unsure whether something changed meaningfully, update the relevant file.
