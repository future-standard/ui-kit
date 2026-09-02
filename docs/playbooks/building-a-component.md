# Playbook — Building a Component

Status: **draft, being written while building the table.** Each phase of
[the table plan](../plans/table.md) adds to this document. When the table ships, this becomes the
process every component follows, for humans and agents alike.

The goal is one loop: **research → decide → design the API → build the core → render → style →
exemplify → test → document → connect to Figma → release.** A component is done when every step
has an artefact.

---

## 0. Research before code

Do this before touching a file. Write findings down; they justify decisions later.

- **Read the spec** (Notion feature page) and the **strategy docs** (Foundations, Pitch, CSS pattern).
- **Read the old implementation** (`../scorer-ui-kit`): props, types, features, and especially
  hacks, TODOs and `biome-ignore` comments. They are the debt list.
- **Read real usage** (`../mlit-cctv`): every call site, what cell/content kinds are actually used,
  what consumers fake or override (`nth-child` selectors, `key=` remounts, wrapper components).
  Real usage beats the spec when they disagree.
- **Check for hidden work**: remote branches, draft PRs, stale scaffolds.
- **Ask the strategic questions** as a short list with a recommended answer each. Record the
  answers as locked decisions with a one-line *why*.

Table example: 12 call sites in mlit-cctv, 13 distinct cell kinds, 3 screens remounting the table
to work around mount-time state. Those three facts shaped the whole API.

## 1. Write the plan as a repo document

`docs/plans/<component>.md` with: locked decisions (table with *why*), research summary and its
design consequences, architecture, first-draft API/schema, phases with exit criteria, out-of-scope,
and open decisions with a recommendation and the phase that resolves them. Update it as you go; it
is the changelog of thinking.

## 2. Check co-existence and clashes

The new kit runs alongside the old one. Before naming anything:

- Grep the old kit for the CSS variable prefix you intend to use (`--table-*`). New component
  aliases must be names the old kit does not define. Shared *scale* tokens are fine.
- Remember unlayered CSS beats `@layer component`. Set every property your module relies on
  explicitly on your own elements.
- No global JS state; registries are instance-scoped.

## 3. Housekeeping (Phase 0)

- Branch from the branch that carries the pattern you depend on (here `feature/css-pattern`),
  merge `main` early.
- Test runner in place before writing logic. Tests are the spec for headless code.
- Commit the plan first so the first code commit is clean.

## 4. Design the API schema-first

- **Start from the data the consumer already has**, not from the DOM. The schema names the
  fields (`accessor` paths) and the intent (`cell.type`, `emphasis`, `align`); the renderer owns the
  markup.
- **Everything in the schema must survive `JSON.stringify`.** String accessors, type names, CSS
  lengths. If you need a function, it belongs in runtime options (a registry, `accessors`,
  `comparators`), never in the schema. Test this: `JSON.parse(JSON.stringify(schema))` must equal
  the schema.
- **Key by id, never by index.** Every column has an `id`; every row resolves a `rowKey`. Positional
  coupling was the single largest source of bugs in the old kit.
- **Controlled-first.** Every state slice can be owned by the consumer (`state.x` + `onXChange`) or
  left to the instance. Never copy props into state at mount and forget them.
- **Model state as small, replaceable slices** (`sorting`, `rowSelection`, `expanded`, …), each a
  plain JSON value, so they can be persisted and shared with sibling components later.
- **Write the schema reference (`docs/components/<name>/schema.md`) as you design**, with defaults
  and the runtime-only options listed separately. Validate the schema at runtime with issues that
  name the exact path.

## 5. Build the headless core

- **No framework imports.** Build with `createLibraryConfig({ react: false })`; the package has no
  peer dependencies.
- **One write path.** All state changes go through a single `updateSlice` that reports to the
  consumer and updates internal state only for uncontrolled slices. This is where controlled /
  uncontrolled semantics live, once.
- **Pure derivations, memoised on input identity.** `buildRowModel` and `getVisibleColumns` are
  pure functions; the instance caches them on the identity of their inputs. New data or new state
  invalidates; repeated reads are free.
- **Never mutate consumer data.** Sorting returns copies. Test it with a JSON snapshot.
- **The DOM contract is part of the core.** Attribute helpers live next to the state so every
  renderer emits identical `data-ui` / `data-*` / `aria-*` attributes. Document it in
  `docs/components/<name>/dom-contract.md`.
- **Tests are the spec.** One test file per module plus one for the instance covering
  uncontrolled, controlled, mixed, and memoisation. Use fixtures shaped like real consumer data
  (`*.fixtures.ts`, excluded from declaration emit).
- **Exit criteria:** `pnpm check`, `typecheck`, `test`, `build` green; schema and DOM contract
  docs written; changeset added.

## 6. Render (React first, contract for others)

_To be written during Phase 2 and 5._

## 7. Style on the CSS-modules pattern

_To be written during Phase 2._ See the styling contract in the table plan.

## 8. Examples

_To be written during Phase 2._

## 9. Document

_To be written during Phase 7._ Target format: install, import, props/schema table, variants,
code snippets, composition, override recipes, migration notes.

## 10. Figma and Code Connect

_To be written during the Figma track._ Colours from the old library's variables, everything else
fresh; Code Connect files live next to the component.

## 11. Release

_To be written._ Changeset per package, meta-package update, README/CLAUDE.md updates.

---

## Lessons log

Short, dated notes on what we learned the hard way, to feed back into the steps above.

- **2026-09-02** — A stale Storybook scaffold existed on a remote branch. Always list remote
  branches during research.
- **2026-09-02** — Merging a formatter upgrade (Biome 2) produced conflicts only in files the
  feature branch had rewritten. Resolve with the feature branch's content, then re-run the formatter.
- **2026-09-02** — Sorting descending flipped empty values to the top because the emptiness rank
  was negated with the direction. Handle "empties last" *outside* the direction flip.
- **2026-09-02** — `Array.prototype.sort` never passes `undefined` to a comparator; it moves those
  elements to the end itself. Test comparators on `undefined` directly, not through `sort`.
- **2026-09-02** — Turbo can report a transient failure when a formatter rewrite invalidates a
  build mid-pipeline. Re-run with `--force` before hunting a phantom error.
