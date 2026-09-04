# Design ↔ Code Consolidation Log

Where the new kit's code and the existing Figma library ("SCORER - UI Kit Library") disagree.
Each row records what each side says, what we chose *for now*, and what the eventual single source
of truth should be. Review this list before promoting the new Figma file to a team library.

Started 2026-09-03 during the table's Figma track. Add a row whenever a new conflict surfaces.

| # | Topic | Code (`@future-standard-ui/theme` / table) | Figma library | Interim decision | To consolidate |
|---|---|---|---|---|---|
| 1 | Row density | compact 36 / normal 48 / comfortable 56 px | `Tables/cellHeight`: Ultra Compact 32 / Compact 40 / Default 56 / Large 72 | **Code wins.** New `Table` collection with Compact / Normal / Comfortable modes at 36 / 48 / 56. | Agree one density scale and mode names; decide whether Large (72) and Ultra Compact (32) survive. Update whichever side loses. |
| 2 | Cell horizontal padding | 12 px (`--_cell-padding-x`), 8 compact, 16 comfortable | `Tables/columnPadding` 16 in every mode | **Code wins.** | Designers may prefer 16 everywhere; confirm with real screens, then align. |
| 3 | UI font | `--font-ui: Monorale, …` | `Typography/fontUI`: Legacy Raleway, **Modern Noto Sans JP** | **Library (Modern) wins.** Figma text styles use Noto Sans JP; Monorale is legacy. | **Code change needed**: `packages/theme/src/components.css` `--font-ui` → Noto Sans JP stack; drop Monorale `@font-face` files from the theme. |
| 4 | Data font | `--font-data: Lato, …` | `Typography/fontBody` Lato | Agree. | — |
| 5 | Colour modes | `.light-theme` / `.dark-theme` (`[data-theme]`) | Colors collection: Dark, Light, **Light (High Contrast)** | New file aliases library colours; modes are the library's. | Decide whether code gains a high-contrast theme, or Figma drops the mode. |
| 6 | Responsive model | Table container breakpoints sm 480 / md 720 / lg 960 / xl 1200 (container queries) | `Layouts/breakpoint` + `Responsive Utils/showFromLG|XL|XXL` booleans (viewport-based) | New `Breakpoints` collection for the table's container breakpoints; library utilities untouched. | Reconcile naming (lg/xl/xxl vs sm–xl) and viewport vs container semantics across kits. |
| 7 | Border radius | 4 px (`--_radius`) | `General/borderRadius` 4 | Agree. Alias not needed yet. | — |
| 8 | Header height | Same as row height (`--_row-height`) | `Tables/headerHeight` separate variable, same values as cellHeight | Code wins (single variable). | Confirm designers never need header ≠ row height. |
| 9 | Table text styles | Header 13/700 UI, cell 14/500 data, low = italic, high = 700, group header 12/500, badge 12/600 | `Table/Cell Text/{Extra Small, Small, Normal}/{Default, Light, Bold}` | New styles named after the code contract (`Table/Header`, `Table/Cell/*`). | Map old style names to new; retire duplicates when the new library is published. |
| 10 | Variable scopes | — | Library colour variables are `ALL_SCOPES` | New variables get explicit scopes. | Tighten scopes in the old library when convenient. |
| 11 | Code syntax | CSS var names are the truth | Library colours carry `var(--grey-11)` etc. ✓; Tables/Typography/General have none | New variables all carry WEB code syntax. | Add code syntax to the old library's non-colour collections. |
