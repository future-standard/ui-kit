# Playbook — Building Tables in Figma (with an agent)

Status: **decided 2026-09-04, not yet built.** Tables are classically hard to assemble in Figma:
instances cannot gain or lose columns, and column widths must be edited cell by cell. We solve
this with a workflow rather than a cleverer component. The table components in the Figma file
are the vocabulary; an agent, guided by a person, does the assembly from the same JSON schema
that drives the code.

Related: [table plan](../plans/table.md) (Figma track), [schema quickstart](../components/table/schema-quickstart.md),
[Figma build state](../figma/table-build-state.json), [consolidation log](../plans/design-code-consolidation.md).

## The workflow

```
Designer                          Agent                                   Outputs
────────                          ─────                                   ───────
1. Rough mockup: places            2. Reads the mockup frame (get_metadata/  • Full Table frame in Figma,
   Cell Content/* components          get_design_context): which cell types,   built from the real components,
   in one or two example rows,        in what order, any labels/widths.        widths/alignment/emphasis set,
   optionally a header row.        3. Asks the designer: what data is this?    populated with sample data
   Or: describes the table in         Which product (cameras, clips, roads…)?  • The JSON TableSchema (optional)
   words.                             Any specific values to show?             • Both stay in sync because the
                                   4. Builds the TableSchema JSON (validated     schema is the single input
                                      against table.schema.json).
                                   5. Generates the Figma table from schema
                                      + sample data (starting-frame pattern).
                                   6. Screenshots, checks, hands back.
```

The mockup is an *input*, never the deliverable. The generated frame is the deliverable.

## What the agent needs (to be built)

1. **Starting-frame pattern.** The `Table` component becomes a template *frame* designers copy;
   header cells and cells stay instances so tokens, density, theme and states keep working, while
   rows are plain auto-layout frames the designer (or agent) owns. Documented on the Table page.
2. **Column-width variables.** Collection `Table Columns` with `column/1..8/width`. Every header
   cell and body cell in a column binds its width to the column's variable, so a column is resized
   with one edit. The schema's `width` maps onto these.
3. **Schema → Figma generator.** A `use_figma` script (later a plugin) that takes a `TableSchema`
   and rows and assembles the table: per column a Header Cell instance (label, align, sortable,
   sort state) and per row a Cell instance (align, emphasis, custom content swapped to the cell
   type's component, values filled), plus utility columns for selection/expansion, pinned-edge
   effect styles on pinned columns, group rows when grouping is set. Uses the IDs in
   `docs/figma/table-build-state.json`.
4. **Standard sample data.** See below.
5. **Agent guide.** This page plus the schema quickstart are what an agent is given. Keep both
   short, exact, and copy-paste ready.

## Standard sample data (task)

Our products are consistent: cameras, clips and snapshots, recording nodes, roads and kilometre
posts, offices and routes, users. A shared, realistic sample dataset makes every table demo,
Storybook story, Figma frame and test speak the same language. Decide and record:

- Entities and fields: cameras (id, name, route, km post, office, status, PTZ, storage, counts,
  last seen), clips (name, camera, start/created, duration, size, status, thumbnail), snapshots,
  recording nodes, users. Start from `apps/dev/src/examples/table/data.ts`, which already mirrors
  mlit-cctv shapes.
- Japanese and English variants of names, offices and routes.
- Edge cases every table must show: long text, empty values, thresholds, mixed statuses.
- One home for it consumed by dev app, tests, Figma generator and Storybook (a small package,
  e.g. `@future-standard-ui/sample-data`, JSON with a generator for volume).

Owner and timing: after the generator prototype proves what shape it needs; treat as a
standing asset from then on.

## Prompts

**For the agent, when a designer hands over a mockup:**
> Here is a rough row mockup in Figma: <node URL>. Read which cell components it uses and in what
> order, ask me what the data is and which product it belongs to, then produce the TableSchema
> JSON (validate it) and build the full table in Figma from the kit components with realistic
> sample data. Follow docs/playbooks/figma-table-workflow.md and docs/components/table/schema-quickstart.md.

**For the agent, from a description only:**
> Build a table for <purpose> showing <fields>. Produce the TableSchema JSON first, then the Figma
> table from the kit components with sample data, then tell me what you assumed.

## Principles

- The JSON schema is the contract between design, code and agents. If the generator needs
  something the schema cannot say, change the schema, not the generator.
- Components hold the design tokens and states; the workflow holds the layout. Do not fight
  Figma's instance model.
- Every generated table is a frame the designer can edit by hand afterwards.
