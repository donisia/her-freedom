/**
 * Minimal, dependency-free Nostr helpers.
 *
 * The app never handles private keys: signing is delegated to a NIP-07
 * browser extension (window.nostr) or, in demo mode, simulated entirely.
 */

export const DEFAULT_RELAYS = [
  { url: 'wss://relay.damus.io', name: 'Damus', region: 'Global · Anycast' },
  { url: 'wss://nos.lol', name: 'nos.lol', region: 'Europe' },
  { url: 'wss://relay.nostr.band', name: 'Nostr.Band', region: 'Europe · Indexer' },
  { url: 'wss://relay.snort.social', name: 'Snort', region: 'Global' },
  { url: 'wss://relay.primal.net', name: 'Primal', region: 'North America' },
  { url: 'wss://nostr.wine', name: 'nostr.wine', region: 'North America · Paid' },
];

/** Fallback identity used when no NIP-07 signer is installed. */
export const SIMULATED_IDENTITY = {
  npub: 'npub17x8qmw3vfz0r5n4t2l6h9e8ycjdk5a3sgu7p4wxe2hqz6m9tlv0rfuak9p',
  pubkey: 'a7c19e4f3b2d8e6015f9c4a7b3e2d1f08c6a5b4e3d2c1f0e9d8c7b6a5f4e3d2c',
};

/** Book & chapter metadata is published as NIP-23 parameterized long-form events. */
export const KIND_LONG_FORM = 30023;

/** NIP-98 HTTP auth events, used to authenticate author API calls. */
export const KIND_HTTP_AUTH = 27235;

export function shortenKey(key, head = 8, tail = 3) {
  if (!key) return '';
  if (key.length <= head + tail + 3) return key;
  return `${key.slice(0, head)}...${key.slice(-tail)}`;
}

/* ----------------------------- bech32 (NIP-19) ---------------------------- */

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values) {
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) chk ^= GENERATOR[i];
    }
  }
  return chk;
}

function hrpExpand(hrp) {
  const out = [];
  for (const ch of hrp) out.push(ch.charCodeAt(0) >> 5);
  out.push(0);
  for (const ch of hrp) out.push(ch.charCodeAt(0) & 31);
  return out;
}

function createChecksum(hrp, data) {
  const values = [...hrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const mod = polymod(values) ^ 1;
  return Array.from({ length: 6 }, (_, p) => (mod >> (5 * (5 - p))) & 31);
}

function convertBits(data, fromBits, toBits) {
  let acc = 0;
  let bits = 0;
  const out = [];
  const maxValue = (1 << toBits) - 1;
  const maxAcc = (1 << (fromBits + toBits - 1)) - 1;
  for (const value of data) {
    acc = ((acc << fromBits) | value) & maxAcc;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      out.push((acc >> bits) & maxValue);
    }
  }
  if (bits > 0) out.push((acc << (toBits - bits)) & maxValue);
  return out;
}

/** Encode a 32-byte hex public key as an npub (NIP-19). */
export function hexToNpub(hex) {
  const bytes = hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16));
  const words = convertBits(bytes, 8, 5);
  const checksum = createChecksum('npub', words);
  return `npub1${[...words, ...checksum].map((w) => CHARSET[w]).join('')}`;
}

/* ------------------------------ crypto utils ------------------------------ */

export function randomHex(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(text) {
  if (!crypto?.subtle) return randomHex(32);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** NIP-01 event id serialization. */
export function serializeEvent(event) {
  return JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
}

/* ------------------------------ relay network ----------------------------- */

/** Send a signed event to a single relay and wait for its NIP-20 "OK" reply. */
export function publishToRelay(url, event, timeoutMs = 7000) {
  return new Promise((resolve) => {
    let socket;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket?.close();
      } catch {
        /* noop */
      }
      resolve(result);
    };

    const timer = setTimeout(() => finish({ ok: false, message: 'timeout' }), timeoutMs);

    try {
      socket = new WebSocket(url);
    } catch {
      finish({ ok: false, message: 'invalid-url' });
      return;
    }

    socket.onopen = () => socket.send(JSON.stringify(['EVENT', event]));
    socket.onerror = () => finish({ ok: false, message: 'unreachable' });
    socket.onmessage = (msg) => {
      try {
        const [type, id, accepted, message] = JSON.parse(msg.data);
        if (type === 'OK' && id === event.id) finish({ ok: Boolean(accepted), message: message || '' });
      } catch {
        /* ignore non-JSON frames */
      }
    };
  });
}
