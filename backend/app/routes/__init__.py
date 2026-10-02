from flask import Blueprint

api = Blueprint("api", __name__, url_prefix="/api")

from . import catalogue, payments, authoring  # noqa: E402,F401  (register routes)
