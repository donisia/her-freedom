import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.seed import seed_database

from .signer import TestSigner

READER = "rdr_test_reader_0001"


@pytest.fixture()
def app():
    app = create_app(TestConfig)
    with app.app_context():
        seed_database()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def reader_headers():
    return {"X-Reader-Id": READER}


@pytest.fixture()
def signer():
    return TestSigner("alice")
