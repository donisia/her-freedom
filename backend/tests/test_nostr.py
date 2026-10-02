import time

import pytest

from app.nostr import NostrAuthError, hex_to_npub, schnorr_verify, verify_http_auth

from .signer import TestSigner, encode_event


def test_bip340_official_vector_0():
    pubkey = bytes.fromhex("F9308A019258C31049344F85F89D5229B531C845836F99B08601F113BCE036F9")
    sig = bytes.fromhex(
        "E907831F80848D1069A5371B402410364BDF1C5F8307B0084C55F1CE2DCA8215"
        "25F66A4A85EA8B71E482A74F382D2CE5EBEEE8FDB2172F477DF4900D310536C0"
    )
    assert schnorr_verify(pubkey, bytes(32), sig)
    assert not schnorr_verify(pubkey, b"\x01" + bytes(31), sig)


def test_npub_encoding_known_value():
    # Example from NIP-19.
    assert (
        hex_to_npub("7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e")
        == "npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptg"
    )


def test_valid_http_auth_returns_pubkey():
    signer = TestSigner("bob")
    header = signer.auth_header("POST", "http://localhost:5173/api/books")
    assert verify_http_auth(header, "POST", "/api/books", 60) == signer.pubkey


@pytest.mark.parametrize(
    "method,path,message",
    [("GET", "/api/books", "method"), ("POST", "/api/other", "URL")],
)
def test_http_auth_rejects_wrong_method_or_url(method, path, message):
    header = TestSigner("bob").auth_header("POST", "http://localhost/api/books")
    with pytest.raises(NostrAuthError, match=message):
        verify_http_auth(header, method, path, 60)


def test_http_auth_rejects_stale_event():
    header = TestSigner("bob").auth_header("POST", "http://x/api/books", created_at=int(time.time()) - 3600)
    with pytest.raises(NostrAuthError, match="expired"):
        verify_http_auth(header, "POST", "/api/books", 60)


def test_http_auth_rejects_tampered_signature():
    event = TestSigner("bob").sign(27235, [["u", "http://x/api/books"], ["method", "POST"]])
    event["sig"] = "00" * 64
    with pytest.raises(NostrAuthError, match="Invalid Nostr signature"):
        verify_http_auth(encode_event(event), "POST", "/api/books", 60)


def test_simulated_events_only_accepted_for_demo_pubkey():
    signer = TestSigner("mallory")
    event = signer.sign(27235, [["u", "http://x/api/books"], ["method", "POST"]])
    event["sig"] = "00" * 64
    event["simulated"] = True

    with pytest.raises(NostrAuthError):
        verify_http_auth(encode_event(event), "POST", "/api/books", 60, demo_pubkey="ab" * 32)
    assert verify_http_auth(encode_event(event), "POST", "/api/books", 60, demo_pubkey=signer.pubkey) == signer.pubkey
