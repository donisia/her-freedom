"""
Lightning invoice providers.

Only a mock provider ships today: it issues BOLT11-shaped invoices that are
settled through the demo simulator endpoint. A real provider (LNbits, LND,
Alby…) needs to implement the same two methods.
"""

import hashlib
import secrets

_BECH32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"


class MockLightningProvider:
    name = "mock"
    supports_simulation = True

    def create_invoice(self, amount_sats, memo):
        preimage = secrets.token_bytes(32)
        payment_hash = hashlib.sha256(preimage).hexdigest()
        body = "".join(_BECH32[b % 32] for b in secrets.token_bytes(190))
        # 1 sat = 10 nano-BTC, hence the "n" multiplier.
        return {"payment_hash": payment_hash, "bolt11": f"lnbc{amount_sats * 10}n1p{body}"}

    def is_paid(self, payment_hash):
        # Mock invoices are only settled via the simulator.
        return False


_PROVIDERS = {"mock": MockLightningProvider}


def get_provider(name):
    try:
        return _PROVIDERS[name]()
    except KeyError:
        raise RuntimeError(f"Unknown LIGHTNING_PROVIDER '{name}'. Available: {', '.join(_PROVIDERS)}")
