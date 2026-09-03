import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALIGNMENTS, BREAKPOINTS, DENSITIES, EMPHASES, PIN_SIDES, SELECTION_MODES } from './schema';
import { cameraSchema } from './table.fixtures';
import { validateSchema } from './validate';

/**
 * The published JSON Schema (schema/table.schema.json) is hand-written for agents and editors.
 * These tests keep it honest against the TypeScript source of truth.
 */
const json = JSON.parse(
  readFileSync(new URL('../schema/table.schema.json', import.meta.url), 'utf8')
) as {
  required: string[];
  properties: Record<string, unknown>;
  $defs: Record<string, { properties: Record<string, { enum?: string[] }>; enum?: string[] }>;
};

describe('table.schema.json', () => {
  it('lists the same enumerations as the TypeScript constants', () => {
    expect(json.$defs.Breakpoint.enum).toEqual([...BREAKPOINTS]);
    expect(json.$defs.Column.properties.align.enum).toEqual([...ALIGNMENTS]);
    expect(json.$defs.Column.properties.emphasis.enum).toEqual([...EMPHASES]);
    expect(json.$defs.Column.properties.pin.enum).toEqual([...PIN_SIDES]);
    expect(json.$defs.Features.properties.selection.enum).toEqual([...SELECTION_MODES]);
    expect(json.$defs.Features.properties.density.enum).toEqual([...DENSITIES]);
  });

  it('knows every column and feature property the validator knows', () => {
    const columnKeys = Object.keys(json.$defs.Column.properties).sort();
    expect(columnKeys).toEqual(
      [
        'id',
        'header',
        'accessor',
        'cell',
        'sortable',
        'align',
        'emphasis',
        'width',
        'minWidth',
        'maxWidth',
        'pin',
        'visibleFrom',
        'visibleUntil',
        'group',
      ].sort()
    );
    expect(Object.keys(json.$defs.Features.properties).sort()).toEqual(
      ['selection', 'expandable', 'stickyHeader', 'zebra', 'density', 'grouping', 'stacked'].sort()
    );
    expect(json.required).toEqual(['rowKey', 'columns']);
  });

  it('describes a schema the runtime validator accepts', () => {
    // Round-trip the fixture through JSON to make sure nothing non-serialisable crept in.
    expect(validateSchema(JSON.parse(JSON.stringify(cameraSchema)))).toEqual([]);
  });
});
