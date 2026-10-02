"""
Nostr primitives: NIP-19 npub encoding, NIP-01 event ids, BIP-340 Schnorr
verification and NIP-98 HTTP auth. Pure Python, no native dependencies.

The server only ever verifies signatures. It never sees or handles private keys.
"""

import base64
import hashlib
import json
import time
from urllib.parse import urlparse

# ----------------------------------------------------------------- bech32 --

_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
_GENERATOR = [0x3B6A57B2, 0x26508E6D, 0x1EA119FA, 0x3D4233DD, 0x2A1462B3]


def _polymod(values):
    chk = 1
    for value in values:
        top = chk >> 25
        chk = ((chk & 0x1FFFFFF) << 5) ^ value
        for i in range(5):
            if (top >> i) & 1:
                chk ^= _GENERATOR[i]
    return chk


def _hrp_expand(hrp):
    return [ord(c) >> 5 for c in hrp] + [0] + [ord(c) & 31 for c in hrp]


def _convert_bits(data, from_bits, to_bits):
    acc, bits, out = 0, 0, []
    max_value = (1 << to_bits) - 1
    for value in data:
        acc = (acc << from_bits) | value
        bits += from_bits
        while bits >= to_bits:
            bits -= to_bits
            out.append((acc >> bits) & max_value)
    if bits:
        out.append((acc << (to_bits - bits)) & max_value)
    return out


def hex_to_npub(pubkey_hex):
    words = _convert_bits(bytes.fromhex(pubkey_hex), 8, 5)
    polymod = _polymod(_hrp_expand("npub") + words + [0] * 6) ^ 1
    checksum = [(polymod >> 5 * (5 - i)) & 31 for i in range(6)]
    return "npub1" + "".join(_CHARSET[w] for w in words + checksum)


# ----------------------------------------------------------------- events --


def compute_event_id(event):
    serialized = json.dumps(
        [0, event["pubkey"], event["created_at"], event["kind"], event["tags"], event["content"]],
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------- BIP-340 --

_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
_G = (
    0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,
    0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8,
)


def _point_add(p1, p2):
    if p1 is None:
        return p2
    if p2 is None:
        return p1
    if p1[0] == p2[0] and p1[1] != p2[1]:
        return None
    if p1 == p2:
        lam = (3 * p1[0] * p1[0] * pow(2 * p1[1], _P - 2, _P)) % _P
    else:
        lam = ((p2[1] - p1[1]) * pow(p2[0] - p1[0], _P - 2, _P)) % _P
    x3 = (lam * lam - p1[0] - p2[0]) % _P
    return x3, (lam * (p1[0] - x3) - p1[1]) % _P


def _point_mul(point, scalar):
    result = None
    for i in range(256):
        if (scalar >> i) & 1:
            result = _point_add(result, point)
        point = _point_add(point, point)
    return result


def _lift_x(x):
    if x >= _P:
        return None
    y_sq = (pow(x, 3, _P) + 7) % _P
    y = pow(y_sq, (_P + 1) // 4, _P)
    if pow(y, 2, _P) != y_sq:
        return None
    return x, y if y % 2 == 0 else _P - y


def tagged_hash(tag, message):
    tag_hash = hashlib.sha256(tag.encode()).digest()
    return hashlib.sha256(tag_hash + tag_hash + message).digest()


def schnorr_verify(pubkey: bytes, message: bytes, signature: bytes) -> bool:
    if len(pubkey) != 32 or len(message) != 32 or len(signature) != 64:
        return False
    point = _lift_x(int.from_bytes(pubkey, "big"))
    r = int.from_bytes(signature[:32], "big")
    s = int.from_bytes(signature[32:], "big")
    if point is None or r >= _P or s >= _N:
        return False
    e = int.from_bytes(tagged_hash("BIP0340/challenge", signature[:32] + pubkey + message), "big") % _N
    R = _point_add(_point_mul(_G, s), _point_mul(point, _N - e))
    return R is not None and R[1] % 2 == 0 and R[0] == r


def verify_event_signature(event) -> bool:
    try:
        return schnorr_verify(bytes.fromhex(event["pubkey"]), bytes.fromhex(event["id"]), bytes.fromhex(event["sig"]))
    except (KeyError, ValueError, TypeError):
        return False


# ----------------------------------------------------------------- NIP-98 --

KIND_HTTP_AUTH = 27235


class NostrAuthError(Exception):
    def __init__(self, message, status=401):
        super().__init__(message)
        self.message = message
        self.status = status


def _tag(event, name):
    for tag in event.get("tags", []):
        if isinstance(tag, list) and len(tag) >= 2 and tag[0] == name:
            return tag[1]
    return None


def verify_http_auth(header, method, path, max_age, demo_pubkey=None):
    """
    Validate a NIP-98 `Authorization: Nostr <base64 event>` header and return
    the signer's hex pubkey.

    The `u` tag is compared on path + query only, so requests that pass through
    the Vite dev proxy (different host/port) still validate.

    `demo_pubkey`: when set, an event flagged `"simulated": true` with an
    invalid signature is accepted *only* if it comes from that exact pubkey.
    """
    if not header or not header.startswith("Nostr "):
        raise NostrAuthError("Missing Nostr authorization. Connect your signer and try again.")

    try:
        event = json.loads(base64.b64decode(header[6:].strip()).decode("utf-8"))
        pubkey = event["pubkey"]
        created_at = int(event["created_at"])
    except (ValueError, KeyError, TypeError, UnicodeDecodeError):
        raise NostrAuthError("Malformed Nostr authorization event.")

    if event.get("kind") != KIND_HTTP_AUTH:
        raise NostrAuthError("Authorization event must be kind 27235 (NIP-98).")
    if abs(time.time() - created_at) > max_age:
        raise NostrAuthError("Authorization event has expired. Please retry.")

    url_tag = _tag(event, "u")
    if not url_tag:
        raise NostrAuthError("Authorization event is missing its 'u' tag.")
    parsed = urlparse(url_tag)
    signed_path = parsed.path + (f"?{parsed.query}" if parsed.query else "")
    if signed_path != path:
        raise NostrAuthError("Authorization event was signed for a different URL.")
    if (_tag(event, "method") or "").upper() != method.upper():
        raise NostrAuthError("Authorization event was signed for a different HTTP method.")

    try:
        if compute_event_id(event) != event.get("id"):
            raise NostrAuthError("Authorization event id does not match its contents.")
    except (KeyError, TypeError):
        raise NostrAuthError("Malformed Nostr authorization event.")

    if verify_event_signature(event):
        return pubkey
    if demo_pubkey and event.get("simulated") is True and pubkey == demo_pubkey:
        return pubkey
    raise NostrAuthError("Invalid Nostr signature.")
