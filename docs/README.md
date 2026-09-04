# Documentation

Everything a human or an agent needs to use, extend, or design against this kit. The code is the
source of truth; these pages explain it.

## Start here

| I want to… | Read |
|---|---|
| Understand how this kit is built and why | [Building a Component playbook](./playbooks/building-a-component.md) |
| Use the table | [Table guide](./components/table/README.md) |
| Generate a table schema fast (agents start here) | [Schema quickstart](./components/table/schema-quickstart.md) · [JSON Schema](../packages/table-core/schema/table.schema.json) |
| Look up every schema property | [Schema reference](./components/table/schema.md) |
| Configure cells from JSON | [Standard cells](./components/table/cells.md) |
| Style or override a table, or render it without React | [DOM contract](./components/table/dom-contract.md) |
| Build a table in Figma with an agent | [Figma table workflow](./playbooks/figma-table-workflow.md) · [Figma build state](./figma/table-build-state.json) |
| Reconcile design and code values | [Consolidation log](./plans/design-code-consolidation.md) |
| See the plan and the decisions behind it | [Table plan](./plans/table.md) |
| Add a package or meta-package | [Meta-package strategy](./META_PACKAGES.md) |

## Layout

```
docs/
  README.md                  ← this index
  META_PACKAGES.md           package grouping rules
  playbooks/                 how we build (process, lessons)
  plans/                     one plan per initiative, with decisions and phases
  components/<name>/         per-component: README (guide), schema, dom-contract, cells, …
  figma/                     Figma build state (node/variable IDs) for agents resuming Figma work
```

## Conventions

- **Guides follow one format**: installation, import, usage, props, primitives, overrides,
  accessibility, known limits, migration. The table guide is the template.
- **Decisions live in plans**, with a *why* per row. When a decision changes, the plan changes.
- **Lessons live in the playbook** with a date. If something bit us, it is written down.
- **Schemas are JSON**. Anything documented under "runtime options" is code; everything else
  should round-trip through `JSON.stringify`.
- **Examples live in `apps/dev`**, one hash route per example (`pnpm build && pnpm dev`).

## Coming next

Storybook (light setup, pages generated from these docs), Figma library + Code Connect per
component, Filters and Pagination against the list-view state contract in the table plan.
`llms.txt` at the repo root points agents here.
