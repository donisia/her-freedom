"""Test-only BIP-340 signer that stands in for a NIP-07 browser extension."""

import base64
import hashlib
import json
import time

from app.nostr import _G, _N, _point_mul, compute_event_id, tagged_hash


def _xonly(point):
    return point[0].to_bytes(32, "big")


def schnorr_sign(secret: int, message: bytes, aux: bytes = bytes(32)) -> bytes:
    point = _point_mul(_G, secret)
    d = secret if point[1] % 2 == 0 else _N - secret
    t = (d ^ int.from_bytes(tagged_hash("BIP0340/aux", aux), "big")).to_bytes(32, "big")
    k0 = int.from_bytes(tagged_hash("BIP0340/nonce", t + _xonly(point) + message), "big") % _N
    R = _point_mul(_G, k0)
    k = k0 if R[1] % 2 == 0 else _N - k0
    e = int.from_bytes(tagged_hash("BIP0340/challenge", _xonly(R) + _xonly(point) + message), "big") % _N
    return _xonly(R) + ((k + e * d) % _N).to_bytes(32, "big")


class TestSigner:
    __test__ = False

    def __init__(self, seed: str):
        self.secret = int.from_bytes(hashlib.sha256(seed.encode()).digest(), "big") % _N
        self.pubkey = _xonly(_point_mul(_G, self.secret)).hex()

    def sign(self, kind, tags, content="", created_at=None):
        event = {
            "pubkey": self.pubkey,
            "created_at": created_at or int(time.time()),
            "kind": kind,
            "tags": tags,
            "content": content,
        }
        event["id"] = compute_event_id(event)
        event["sig"] = schnorr_sign(self.secret, bytes.fromhex(event["id"])).hex()
        return event

    def auth_header(self, method, url, **overrides):
        event = self.sign(27235, [["u", url], ["method", method]], **overrides)
        return "Nostr " + base64.b64encode(json.dumps(event).encode()).decode()


def encode_event(event):
    return "Nostr " + base64.b64encode(json.dumps(event).encode()).decode()
