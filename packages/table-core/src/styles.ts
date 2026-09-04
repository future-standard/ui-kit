import classes from './Table.module.css';

/**
 * The shared CSS module. Importing `table-core` injects the stylesheet; renderers read the hashed
 * class names from here so React, vanilla DOM and anything else style identically. Class names
 * mirror the DOM-contract parts (`root`, `scroll`, `table`, `headerCell`, `row`, `cell`, …).
 */
export const tableClasses: Record<string, string> = classes;
