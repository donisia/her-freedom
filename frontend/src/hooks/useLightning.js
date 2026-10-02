import { useContext } from 'react';
import { LightningContext } from '../context/LightningContext';

/** Access Lightning payments: { openPayment, isUnlocked, simulateSuccess, ... } */
export function useLightning() {
  const ctx = useContext(LightningContext);
  if (!ctx) throw new Error('useLightning must be used inside <LightningProvider>');
  return ctx;
}
