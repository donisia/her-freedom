import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useFlash } from '../hooks/useFlash';
import {
  DEFAULT_RELAYS,
  SIMULATED_IDENTITY,
  hexToNpub,
  publishToRelay,
  randomHex,
  serializeEvent,
  sha256Hex,
} from '../utils/nostr';

/**
 * Nostr identity & signing.
 *
 * SECURITY: this provider never asks for, stores, or derives a private key
 * (nsec). Real signing is delegated to a NIP-07 extension (Alby, nos2x,
 * Keys.band…). Without one, a clearly-labelled simulated identity is used.
 */
export const NostrContext = createContext(null);

const STORAGE_KEY = 'sp:nostr-session';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function NostrProvider({ children }) {
  const flash = useFlash();
  /** session: { pubkey: hex, npub, mode: 'nip07' | 'simulated' } | null */
  const [session, setSession] = useState(readSession);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasExtension, setHasExtension] = useState(() => typeof window !== 'undefined' && Boolean(window.nostr));

  // Extensions inject window.nostr asynchronously, so poll briefly after mount.
  useEffect(() => {
    if (window.nostr) return undefined;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (window.nostr) {
        setHasExtension(true);
        clearInterval(interval);
      } else if (attempts > 12) {
        clearInterval(interval);
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (window.nostr?.getPublicKey) {
        const pubkey = await window.nostr.getPublicKey();
        const next = { pubkey, npub: hexToNpub(pubkey), mode: 'nip07' };
        setSession(next);
        flash.success('Your NIP-07 signer shared your public key. Your private key never left the extension.', {
          title: 'Nostr identity connected',
        });
        return next;
      }

      await wait(500);
      const next = { ...SIMULATED_IDENTITY, mode: 'simulated' };
      setSession(next);
      flash.warning('No NIP-07 extension found, so a simulated demo identity is being used.', {
        title: 'Demo identity active',
        duration: 6500,
      });
      return next;
    } catch (error) {
      flash.error(error?.message || 'The signer declined the request.', { title: 'Connection failed' });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [flash]);

  const disconnect = useCallback(() => {
    setSession(null);
    flash.info('Your session was cleared from this browser.', { title: 'Disconnected' });
  }, [flash]);

  /**
   * Sign an event template ({ kind, tags, content }).
   * Uses window.nostr.signEvent when available; otherwise returns a
   * structurally valid event with a computed id and a placeholder signature.
   */
  const signEvent = useCallback(
    async (template) => {
      if (!session) throw new Error('Connect a Nostr identity before signing.');
      const unsigned = {
        kind: template.kind ?? 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: template.tags ?? [],
        content: template.content ?? '',
        pubkey: session.pubkey,
      };

      if (session.mode === 'nip07' && window.nostr?.signEvent) {
        return window.nostr.signEvent(unsigned);
      }

      await wait(350);
      const id = await sha256Hex(serializeEvent(unsigned));
      return { ...unsigned, id, sig: randomHex(64), simulated: true };
    },
    [session],
  );

  /** Broadcast a signed event. Simulated events never touch the network. */
  const publishEvent = useCallback(async (event, relayUrls = DEFAULT_RELAYS.map((r) => r.url)) => {
    if (event.simulated) {
      await wait(800);
      return relayUrls.map((url) => ({ url, ok: true, simulated: true, message: 'simulated' }));
    }
    return Promise.all(relayUrls.map((url) => publishToRelay(url, event).then((result) => ({ url, ...result }))));
  }, []);

  const signAndPublish = useCallback(
    async (template) => {
      const event = await signEvent(template);
      const results = await publishEvent(event);
      return { event, results, accepted: results.filter((r) => r.ok).length };
    },
    [signEvent, publishEvent],
  );

  const value = useMemo(
    () => ({
      isConnected: Boolean(session),
      pubkey: session?.pubkey ?? null,
      npub: session?.npub ?? null,
      mode: session?.mode ?? null,
      isSimulated: session?.mode === 'simulated',
      hasExtension,
      isConnecting,
      relays: DEFAULT_RELAYS,
      connect,
      disconnect,
      signEvent,
      publishEvent,
      signAndPublish,
    }),
    [session, hasExtension, isConnecting, connect, disconnect, signEvent, publishEvent, signAndPublish],
  );

  return <NostrContext.Provider value={value}>{children}</NostrContext.Provider>;
}
