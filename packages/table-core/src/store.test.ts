import { describe, expect, it, vi } from 'vitest';
import { createStore } from './store';

describe('createStore', () => {
  it('holds state and applies value or function updaters', () => {
    const store = createStore({ count: 0 });
    store.setState({ count: 1 });
    expect(store.getState()).toEqual({ count: 1 });
    store.setState((s) => ({ count: s.count + 1 }));
    expect(store.getState()).toEqual({ count: 2 });
  });

  it('notifies listeners with next and previous state', () => {
    const store = createStore(0);
    const listener = vi.fn();
    store.subscribe(listener);
    store.setState(5);
    expect(listener).toHaveBeenCalledWith(5, 0);
  });

  it('skips notification when the value is identical', () => {
    const state = { a: 1 };
    const store = createStore(state);
    const listener = vi.fn();
    store.subscribe(listener);
    store.setState(state);
    store.setState((s) => s);
    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribes', () => {
    const store = createStore(0);
    const listener = vi.fn();
    const off = store.subscribe(listener);
    off();
    store.setState(1);
    expect(listener).not.toHaveBeenCalled();
  });
});
