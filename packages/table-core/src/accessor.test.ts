import { describe, expect, it } from 'vitest';
import { createAccessor, getRowKey, resolvePath } from './accessor';
import { cameras } from './table.fixtures';

describe('resolvePath', () => {
  const row = cameras[0];

  it('reads top-level and nested keys', () => {
    expect(resolvePath(row, 'name')).toBe('Camera 10');
    expect(resolvePath(row, 'location.route')).toBe('R2');
  });

  it('reads array indices', () => {
    expect(resolvePath({ tags: ['a', 'b'] }, 'tags.1')).toBe('b');
  });

  it('returns undefined for missing segments without throwing', () => {
    expect(resolvePath(row, 'location.missing.deeper')).toBeUndefined();
    expect(resolvePath(null, 'a')).toBeUndefined();
    expect(resolvePath('string', 'length')).toBeUndefined();
  });

  it('returns the value itself for an empty path', () => {
    expect(resolvePath(row, '')).toBe(row);
  });
});

describe('createAccessor', () => {
  it('produces the same results as resolvePath', () => {
    const km = createAccessor<(typeof cameras)[number]>('location.kmPost');
    expect(cameras.map(km)).toEqual([12.5, 3, null]);
  });
});

describe('getRowKey', () => {
  it('stringifies the resolved key', () => {
    expect(getRowKey(cameras[0], { rowKey: 'id' })).toBe('3');
    expect(getRowKey({ meta: { uuid: 'abc' } }, { rowKey: 'meta.uuid' })).toBe('abc');
  });

  it('throws when the key is missing rather than falling back to an index', () => {
    expect(() => getRowKey({}, { rowKey: 'id' })).toThrow(/missing a key at "id"/);
    expect(() => getRowKey({ id: '' }, { rowKey: 'id' })).toThrow();
  });
});
