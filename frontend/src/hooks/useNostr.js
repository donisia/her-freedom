import { useContext } from 'react';
import { NostrContext } from '../context/NostrContext';

/** Access the Nostr identity: { isConnected, npub, connect, signEvent, ... } */
export function useNostr() {
  const ctx = useContext(NostrContext);
  if (!ctx) throw new Error('useNostr must be used inside <NostrProvider>');
  return ctx;
}
