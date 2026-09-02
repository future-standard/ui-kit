export type Updater<T> = T | ((previous: T) => T);
export type Listener<T> = (state: T, previous: T) => void;

export type Store<T> = {
  getState: () => T;
  /** Replace the state. Listeners are not called when the new value is identical (`Object.is`). */
  setState: (updater: Updater<T>) => void;
  /** Returns an unsubscribe function. */
  subscribe: (listener: Listener<T>) => () => void;
};

export function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function' ? (updater as (previous: T) => T)(previous) : updater;
}

/**
 * The smallest observable container that does the job. No selectors, no middleware: the table
 * instance is the only thing that talks to it, and React binds through `subscribe`.
 */
export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener<T>>();

  return {
    getState: () => state,
    setState: (updater) => {
      const previous = state;
      const next = resolveUpdater(updater, previous);
      if (Object.is(next, previous)) return;
      state = next;
      for (const listener of listeners) {
        listener(next, previous);
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
