import re
from functools import wraps

from flask import current_app, g, request

from .nostr import NostrAuthError, verify_http_auth

_READER_ID = re.compile(r"^[A-Za-z0-9_-]{16,64}$")


class ApiError(Exception):
    def __init__(self, message, status=400, code="bad_request", details=None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.details = details


def reader_id():
    """
    Anonymous reader identity from the `X-Reader-Id` header. Readers don't need
    an account to buy chapters; entitlements are bound to this random id.
    """
    value = request.headers.get("X-Reader-Id", "")
    if not _READER_ID.match(value):
        raise ApiError("Missing or invalid X-Reader-Id header.", 400, "invalid_reader")
    return value


def require_nostr_auth(view):
    """Require a valid NIP-98 header; exposes the signer as `g.pubkey`."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        config = current_app.config
        path = request.full_path.rstrip("?")
        try:
            g.pubkey = verify_http_auth(
                request.headers.get("Authorization"),
                request.method,
                path,
                config["AUTH_MAX_AGE_SECONDS"],
                demo_pubkey=config["DEMO_PUBKEY"] if config["DEMO_MODE"] else None,
            )
        except NostrAuthError as error:
            raise ApiError(error.message, error.status, "unauthorized")
        return view(*args, **kwargs)

    return wrapper


def require_demo_mode():
    if not current_app.config["DEMO_MODE"]:
        raise ApiError("This endpoint is only available in demo mode.", 403, "demo_disabled")
