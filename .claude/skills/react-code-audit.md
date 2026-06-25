---
name: react-code-audit
description: "Trigger: react audit, audit components, code audit, component review, audit this, check react code. Audit a React/TypeScript/Tailwind codebase for best-practice violations and produce a prioritized findings report."
metadata:
  author: Carlos Tranquilino
  version: "1.0"
---

# Skill: React Code Audit

Audit a React / TypeScript / Tailwind codebase for best-practice violations and write a
prioritized findings report to `.claude/memory/audit-<YYYY-MM-DD>.md`. Nothing is modified.

---

## Preflight detection

Run these before the checks. Skip any check whose gate is not met.

| Gate | Command | Enables |
|---|---|---|
| React present | `rg "\"react\"" package.json` | All checks |
| TypeScript present | `fd -e ts -e tsx --max-results 1` | Checks 5, 6, 7, 10, 11 |
| Tailwind present | `fd tailwind.config --max-results 1` | Check 3 only |

If React is not detected, stop and report: "Not a React project — audit skipped."

---

## Steps

### 1. Run all 17 checks

Work through each check below. For every finding, record:

```
[Severity] Check name — file:line — one-line why — concrete fix
```

---

#### Check 1 — Duplicated logic
**What:** Repeated JSX blocks (≥ 5 lines, nearly identical) or copy-pasted event handlers / utility code.  
**Detect:** Read similar-looking files side by side; use `rg` to find identical string fragments across components.  
**Why:** Two copies diverge silently. One gets fixed, the other doesn't.  
**Fix:** Extract a shared component, custom hook, or utility function.  
**Severity:** Warning

---

#### Check 2 — Oversized components
**What:** A single component file that does too much — data fetching, business logic, rendering, and layout all at once.  
**Detect:** Files over ~250 lines, or components with more than 3 `useState` / `useReducer` calls and more than 1 `useEffect` alongside JSX.  
**Why:** Hard to test, hard to reason about, impossible to reuse sub-parts.  
**Fix:** Split into a container (data/logic) and one or more presentational components. Extract logic into a custom hook.  
**Severity:** Warning

---

#### Check 3 — Repeated Tailwind class strings *(Tailwind gate)*
**What:** The same long class string (≥ 4 utility classes) copy-pasted across ≥ 3 places.  
**Detect:** `rg "className=\"[^\"]{40,}\"" --type tsx` then compare hits for repetition.  
**Why:** A style change requires hunting down every copy.  
**Fix:** First choice — extract a shared React component or a typed `cn()` variant so the classes live in one place. Second choice (only for purely static, presentational markup with no interactivity or props) — `@apply` in a CSS file. Note: Tailwind authors discourage `@apply` as the default fix because it bypasses the utility model and hides what styles are applied; prefer component extraction.  
**Severity:** Suggestion

---

#### Check 4 — Prop drilling
**What:** A prop passed through ≥ 3 component levels without being consumed by the intermediate ones.  
**Detect:** Trace a prop that appears in a parent's JSX only to be forwarded; look for props in intermediate components that are never used locally.  
**Why:** Every intermediate component is now coupled to an unrelated concern.  
**Fix:** Lift the value into composition (render props / children), a Context, or a shared custom hook. Choose Context only when multiple unrelated subtrees need the value.  
**Severity:** Warning

---

#### Check 5 — Duplicate / similar TypeScript interfaces
**What:** Two or more interfaces/types with ≥ 70% field overlap that aren't related by inheritance or generic.  
**Detect:** `rg "^(export )?(interface|type) \w+" --type ts --type tsx` — list all, then compare shapes manually or by field names.  
**Why:** One gets updated, the other drifts. Casting between them becomes necessary.  
**Fix:** Consolidate with `extends`, `Pick`, `Omit`, or a generic base. Delete the duplicates.  
**Severity:** Suggestion

---

#### Check 6 — Effect misuse
**What:** `useEffect` used for derived state (value computable from existing state/props), or as an event handler response (something that runs in reaction to a user action, not an external sync).  
**Detect:** Look for `useEffect(() => { set*(compute(x)) }, [x])` — the setter fires in reaction to a dependency. Also look for effects that only run once and call a handler function.  
**Why:** Effects add a render cycle and make data flow harder to trace. Derived state should just be a variable; event responses belong in handlers.  
**Fix:** Derived state → compute inline or with `useMemo`. Event response → move logic into the event handler directly. Reserve `useEffect` for genuinely external synchronization (subscriptions, timers, DOM APIs).  
**Severity:** Warning

---

#### Check 7 — Re-render waste
**What:** (a) Inline object/array/function props that create new references every render; (b) missing `useMemo`/`useCallback` on expensive computations or stable callbacks passed to memoized children; (c) over-memoization — wrapping trivial values or non-memoized children in `memo`/`useMemo`.  
**Detect:** `rg "={{ \{" --type tsx` for inline objects; `rg "={\(\) =>" --type tsx` for inline functions; `rg "useMemo\|useCallback" --type tsx` to spot patterns.  
**Why:** (a,b) cause cascading re-renders that tank perceived performance. (c) adds maintenance cost and obscures intent with zero benefit.  
**Fix:** (a) Move stable objects/arrays outside the component or memoize them. (b) Wrap stable callbacks with `useCallback`, expensive derivations with `useMemo` only when profiling confirms cost. (c) Remove memoization from cheap values and components whose parent isn't memoized anyway.  
**Severity:** Warning

---

#### Check 8 — List & render anti-patterns
**What:** Index used as `key`, missing `key` entirely, `{count && <Component/>}` zero-render leak, or JSX ternary chains nested more than 2 levels deep.  
**Detect:** `rg "key=\{[^}]*index\}" --type tsx`; `rg "\{[a-zA-Z]+ &&" --type tsx`; scan lists for missing `key`; look for ternaries inside ternaries in render.  
**Why:** Index keys break reconciliation on reorder/insert. Zero-render leak renders `0` to the DOM when `count` is falsy. Deep ternaries become unreadable and error-prone.  
**Fix:** Use stable, unique IDs as keys. Replace `{count && <X/>}` with `{count > 0 && <X/>}` or `{count ? <X/> : null}`. Extract nested ternaries into a named variable, early-return, or sub-component.  
**Severity:** Critical (missing key / zero-leak), Warning (deep ternaries)

---

#### Check 9 — Hook extraction
**What:** Data-fetching logic, async state management, or multi-step side-effect orchestration living directly inside a component rather than in a `use*` hook.  
**Detect:** Components with more than one `useState` + `useEffect` combo that isn't rendering logic; `fetch`/`axios` calls directly in component bodies.  
**Why:** The component is untestable in isolation and can't share the logic with siblings.  
**Fix:** Move the state + effect block into a `use<Noun>` custom hook. The component receives data and handlers, not raw async machinery.  
**Severity:** Suggestion

---

#### Check 10 — Weak typing
**What:** `any` annotations, unsafe `as T` casts without a type guard, missing return types on exported functions, or implicit `any` inferred by the compiler.  
**Detect:** `rg ": any|as any| any\b" --type ts --type tsx`; `rg "as [A-Z][a-zA-Z]+" --type tsx` for unchecked casts; check exported functions for missing return type annotations.  
**Why:** `any` propagates silently. An unchecked cast hides real shape mismatches until runtime.  
**Fix:** Replace `any` with the narrowest correct type, `unknown` + a type guard, or a generic. Add explicit return types to exported functions.  
**Severity:** Warning

---

#### Check 11 — State mutation
**What:** Direct mutation of state or props — `state.items.push(x)`, `props.user.name = "..."`, array splice on a state reference.  
**Detect:** `rg "\.push\(|\.splice\(|\.pop\(|\.shift\(" --type tsx`; `rg "state\.[a-zA-Z]+ =" --type tsx`.  
**Why:** React's reconciler only re-renders when it detects a new reference. Mutation produces stale UI with no error.  
**Fix:** Return a new array/object: `setState(prev => [...prev, item])`, `setState(prev => ({ ...prev, field: value }))`.  
**Severity:** Critical

---

#### Check 12 — Magic values
**What:** Hardcoded numbers or strings that represent domain concepts — page sizes, status codes, role names, URL segments — appearing more than once or without obvious meaning.  
**Detect:** `rg "\b(100|200|404|500|\"admin\"|\"active\"|\"pending\")" --type tsx` — adapt to the actual codebase.  
**Why:** The meaning is invisible and every usage must be found when the value changes.  
**Fix:** Extract to a named constant or enum at the module or constants file level.  
**Severity:** Suggestion

---

#### Check 13 — Missing async states
**What:** A component that fetches data but renders nothing (or crashes) when loading, erroring, or receiving an empty result.  
**Detect:** Find data-fetching components; check whether they handle all of: `isLoading`, `isError`/`error`, and empty `data`.  
**Why:** Users see blank screens, runtime errors, or confusing empty states with no feedback.  
**Fix:** Add explicit branches: a `<Loader/>` or skeleton for loading, an error message/retry for errors, an empty-state illustration or message for zero results.  
**Severity:** Warning

---

#### Check 14 — Accessibility
**What:** (a) `<img>` without `alt`; (b) interactive `<div>`/`<span>` instead of `<button>` or `<a>`; (c) form inputs without an associated `<label>`; (d) icon buttons with no accessible name (`aria-label`).  
**Detect:**  
- `rg "<img " --type tsx` → check each for `alt`  
- `rg "onClick.*<div|<span.*onClick" --type tsx` for clickable non-semantic elements  
- `rg "<input " --type tsx` → check each for `id` paired with a `<label htmlFor=...>`  
- `rg "<button" --type tsx` without visible text or `aria-label`  
**Why:** Screen reader users can't navigate or understand the UI. Keyboard-only users can't interact with `div` click handlers.  
**Fix:** (a) Add descriptive `alt`; decorative images use `alt=""`. (b) Replace with `<button type="button">`. (c) Add `<label htmlFor="...">` or `aria-label`. (d) Add `aria-label` to icon-only buttons.  
**Severity:** Critical

---

#### Check 15 — Dead code
**What:** Unused imports, unexported/unreferenced components, commented-out blocks left in place, unreachable branches.  
**Detect:** `rg "^import " --type tsx` and cross-check usage; `rg "\/\/.*<[A-Z]" --type tsx` for commented JSX; TypeScript compiler errors `is declared but its value is never read`.  
**Why:** Dead code is read and maintained for no benefit. It misleads new contributors.  
**Fix:** Delete it. If it might be needed, it belongs in version control history — not as a comment.  
**Severity:** Suggestion

---

#### Check 16 — Context overuse / underuse
**What:** (a) A Context whose value changes frequently, causing all consumers to re-render even when they only need a stable part; (b) prop drilling 4+ levels where a Context would be the correct solution.  
**Detect:** (a) `rg "createContext\|Provider" --type tsx` — inspect what's in the value and how often it changes; (b) revisit Check 4 findings for 4+ level chains.  
**Why:** (a) Over-broad Context turns every consumer into a performance bottleneck. (b) Under-using Context when it's appropriate leads to the same prop-drilling problem caught in Check 4.  
**Fix:** (a) Split Context into stable (identity) and volatile (state) parts. Provide them separately. Memoize the stable part. (b) Introduce a narrow Context scoped to the subtree that needs the value.  
**Severity:** Warning

---

#### Check 17 — File organization
**What:** Multiple unrelated components exported from one file, file names that don't match the default export, or files clearly drifted from the project's directory convention.  
**Detect:** `rg "^export (default |const [A-Z])" --type tsx` — files with more than one top-level component export; `fd --type f -e tsx` to spot `index.tsx` files that export a grab-bag of components.  
**Why:** Discovery is hard. A file named `utils.tsx` containing three unrelated components is unmaintainable.  
**Fix:** One component per file, named to match the component. Shared sub-components can live in the same file only if they are not exported and not reused elsewhere.  
**Severity:** Suggestion

---

### 2. Write the report

Save the full report to `.claude/memory/audit-<YYYY-MM-DD>.md` (overwrite if the file for today already exists). Print the path when done.

**Report structure:**

```markdown
# React Code Audit — <YYYY-MM-DD>

> No source files were modified. This report is read-only.

## Summary

| Severity | Count |
|----------|-------|
| Critical | N |
| Warning  | N |
| Suggestion | N |

| Category | Count |
|----------|-------|
| React | N |
| Architecture | N |
| TypeScript | N |
| Reuse | N |
| Style | N |
| Perf | N |
| A11y | N |
| UX | N |
| Hygiene | N |

## Top 5 fixes by impact / effort

1. ...
2. ...
3. ...
4. ...
5. ...

---

## Critical

### [Check name]
- `file:line` — why — fix

...

## Warning

...

## Suggestion

...
```

---

## Before you report

- [ ] Preflight ran — checks gated on TypeScript/Tailwind were skipped when those tools are absent
- [ ] Every finding has a `file:line` reference (not just a file name)
- [ ] Severity is not inflated — Suggestion findings are not promoted to Warning without clear reasoning
- [ ] No source file was created, edited, or deleted
- [ ] Report was saved to `.claude/memory/audit-<date>.md` and the path was printed

---

## Rule

An audit reports and recommends; it never edits. Reuse-by-component beats `@apply`. Correctness and accessibility findings outrank style.
