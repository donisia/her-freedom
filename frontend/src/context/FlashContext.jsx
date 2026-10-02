import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Two contexts so that components which only *trigger* messages (most of the
 * app) don't re-render every time a message appears or disappears.
 */
export const FlashActionsContext = createContext(null);
export const FlashStateContext = createContext(null);

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 4;

let nextId = 0;

export function FlashProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setMessages((current) => current.filter((m) => m.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  /**
   * Show a flash message.
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} text
   * @param {{ title?: string, duration?: number }} options  duration 0 = sticky
   */
  const show = useCallback(
    (type, text, { title, duration = DEFAULT_DURATION } = {}) => {
      nextId += 1;
      const id = nextId;
      setMessages((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, type, text, title, duration }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const actions = useMemo(
    () => ({
      show,
      dismiss,
      success: (text, options) => show('success', text, options),
      error: (text, options) => show('error', text, options),
      warning: (text, options) => show('warning', text, options),
      info: (text, options) => show('info', text, options),
    }),
    [show, dismiss],
  );

  const state = useMemo(() => ({ messages, dismiss }), [messages, dismiss]);

  return (
    <FlashActionsContext.Provider value={actions}>
      <FlashStateContext.Provider value={state}>{children}</FlashStateContext.Provider>
    </FlashActionsContext.Provider>
  );
}
