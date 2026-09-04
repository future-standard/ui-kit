import { describe, expect, it } from 'vitest';
import {
  getSelectedKeys,
  getSelectionSummary,
  setSelectionForKeys,
  toggleRowSelection,
} from './selection';

describe('toggleRowSelection', () => {
  it('adds and removes keys, never storing false', () => {
    const on = toggleRowSelection({}, 'a');
    expect(on).toEqual({ a: true });
    const off = toggleRowSelection(on, 'a');
    expect(off).toEqual({});
  });

  it('returns the same reference when nothing changes', () => {
    const selection = { a: true };
    expect(toggleRowSelection(selection, 'a', true)).toBe(selection);
    expect(toggleRowSelection({}, 'a', false)).toEqual({});
  });

  it('replaces the selection in single mode', () => {
    expect(toggleRowSelection({ a: true }, 'b', true, 'single')).toEqual({ b: true });
  });

  it('is a no-op in none mode', () => {
    const selection = {};
    expect(toggleRowSelection(selection, 'a', true, 'none')).toBe(selection);
  });
});

describe('setSelectionForKeys', () => {
  it('only touches the given keys', () => {
    const selection = { keep: true, drop: true };
    expect(setSelectionForKeys(selection, ['drop', 'x'], false)).toEqual({ keep: true });
    expect(setSelectionForKeys(selection, ['a'], true)).toEqual({
      keep: true,
      drop: true,
      a: true,
    });
  });
});

describe('getSelectionSummary', () => {
  it('reports none, some and all against the given keys', () => {
    expect(getSelectionSummary([], {})).toBe('none');
    expect(getSelectionSummary(['a', 'b'], {})).toBe('none');
    expect(getSelectionSummary(['a', 'b'], { a: true })).toBe('some');
    expect(getSelectionSummary(['a', 'b'], { a: true, b: true, other: true })).toBe('all');
  });
});

describe('getSelectedKeys', () => {
  it('lists selected keys only', () => {
    expect(getSelectedKeys({ a: true, b: false })).toEqual(['a']);
  });
});
