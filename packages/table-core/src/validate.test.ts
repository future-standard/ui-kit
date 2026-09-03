import { describe, expect, it } from 'vitest';
import { cameraSchema } from './table.fixtures';
import { assertSchema, SchemaError, validateSchema } from './validate';

// Column 0 is pinned in the fixture; unpin it so pin-specific rules do not interfere.
const withColumn = (patch: Record<string, unknown>) => ({
  ...cameraSchema,
  columns: [
    { ...cameraSchema.columns[0], pin: undefined, ...patch },
    ...cameraSchema.columns.slice(1),
  ],
});

const paths = (schema: unknown) => validateSchema(schema).map((issue) => issue.path);

describe('validateSchema', () => {
  it('accepts the fixture schema', () => {
    expect(validateSchema(cameraSchema)).toEqual([]);
    expect(JSON.parse(JSON.stringify(cameraSchema))).toEqual(cameraSchema);
  });

  it('rejects non-objects', () => {
    expect(paths(null)).toEqual(['']);
    expect(paths('table')).toEqual(['']);
  });

  it('requires rowKey and a non-empty column list', () => {
    expect(paths({ columns: [] })).toEqual(['rowKey', 'columns']);
  });

  it('requires unique, non-empty column ids', () => {
    const schema = {
      rowKey: 'id',
      columns: [
        { id: 'a', header: 'A' },
        { id: 'a', header: 'A again' },
        { id: '', header: 'blank' },
      ],
    };
    expect(paths(schema)).toEqual(['columns[1].id', 'columns[2].id']);
  });

  it('checks enumerated column properties', () => {
    expect(paths(withColumn({ align: 'left' }))).toEqual(['columns[0].align']);
    expect(paths(withColumn({ emphasis: 'bold' }))).toEqual(['columns[0].emphasis']);
    expect(paths(withColumn({ pin: 'left' }))).toEqual(['columns[0].pin']);
    expect(paths(withColumn({ visibleFrom: 'xs' }))).toEqual(['columns[0].visibleFrom']);
  });

  it('requires CSS length strings for widths', () => {
    expect(paths(withColumn({ width: 200 }))).toEqual(['columns[0].width']);
    expect(paths(withColumn({ width: '200px', minWidth: '10%', maxWidth: '12rem' }))).toEqual([]);
  });

  it('requires visibleUntil to be larger than visibleFrom', () => {
    expect(paths(withColumn({ visibleFrom: 'lg', visibleUntil: 'md' }))).toEqual([
      'columns[0].visibleUntil',
    ]);
    expect(paths(withColumn({ visibleFrom: 'sm', visibleUntil: 'md' }))).toEqual([]);
  });

  it('requires cell.type when a cell is given', () => {
    expect(paths(withColumn({ cell: {} }))).toEqual(['columns[0].cell.type']);
    expect(paths(withColumn({ cell: { type: 'text', options: 'x' } }))).toEqual([
      'columns[0].cell.options',
    ]);
  });

  it('requires grouped columns to share breakpoint visibility', () => {
    const schema = {
      rowKey: 'id',
      columns: [
        { id: 'a', header: 'A', group: 'G' },
        { id: 'b', header: 'B', group: 'G', visibleFrom: 'lg' },
        { id: 'c', header: 'C', group: 'H', visibleFrom: 'md' },
        { id: 'd', header: 'D', group: 'H', visibleFrom: 'md' },
      ],
    };
    expect(paths(schema)).toEqual(['columns[1].group']);
  });

  it('checks feature flags', () => {
    const bad = {
      ...cameraSchema,
      features: { selection: 'many', density: 'tight', zebra: 'yes', grouping: { by: 'nope' } },
    };
    expect(paths(bad)).toEqual([
      'features.selection',
      'features.density',
      'features.zebra',
      'features.grouping.by',
    ]);
  });

  it('ignores unknown properties for forward compatibility', () => {
    expect(paths({ ...cameraSchema, future: true })).toEqual([]);
  });
});

describe('assertSchema', () => {
  it('throws a SchemaError listing every issue', () => {
    expect(() => assertSchema({ columns: [] })).toThrow(SchemaError);
    try {
      assertSchema({ columns: [] });
    } catch (error) {
      expect((error as SchemaError).issues).toHaveLength(2);
      expect((error as SchemaError).message).toContain('rowKey');
    }
  });

  it('passes silently for a valid schema', () => {
    expect(() => assertSchema(cameraSchema)).not.toThrow();
  });
});
