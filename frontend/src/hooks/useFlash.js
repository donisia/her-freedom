import { useContext } from 'react';
import { FlashActionsContext, FlashStateContext } from '../context/FlashContext';

/** Trigger flash messages: flash.success('Saved'), flash.error(...), etc. */
export function useFlash() {
  const ctx = useContext(FlashActionsContext);
  if (!ctx) throw new Error('useFlash must be used inside <FlashProvider>');
  return ctx;
}

/** Read the current message queue (used by the FlashMessage renderer). */
export function useFlashMessages() {
  const ctx = useContext(FlashStateContext);
  if (!ctx) throw new Error('useFlashMessages must be used inside <FlashProvider>');
  return ctx;
}
