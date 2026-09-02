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

_To be written during Phase 1._ Principles fixed so far: JSON-serialisable schema, string
accessors, cell type names, functions only via runtime registry, controlled-first state.

## 5. Build the headless core

_To be written during Phase 1._

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
