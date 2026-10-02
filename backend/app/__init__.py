from pathlib import Path

import click
from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from .config import BASE_DIR, Config
from .extensions import cors, db
from .security import ApiError


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    Path(BASE_DIR / "instance").mkdir(exist_ok=True)
    db.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        allow_headers=["Content-Type", "Authorization", "X-Reader-Id"],
    )

    from . import models  # noqa: F401  (register tables)
    from .routes import api

    app.register_blueprint(api)
    _register_errors(app)
    _register_commands(app)

    with app.app_context():
        db.create_all()
        if app.config["SEED_ON_START"] and not db.session.query(models.Author).first():
            from .seed import seed_database

            seed_database()

    return app


def _register_errors(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error):
        payload = {"error": {"code": error.code, "message": error.message}}
        if error.details:
            payload["error"]["fields"] = error.details
        return jsonify(payload), error.status

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        return jsonify(error={"code": error.name.lower().replace(" ", "_"), "message": error.description}), error.code


def _register_commands(app):
    @app.cli.command("seed")
    @click.option("--reset", is_flag=True, help="Drop all tables before seeding.")
    def seed_command(reset):
        """Load the demo catalogue into the database."""
        from .models import Author
        from .seed import seed_database

        if reset:
            db.drop_all()
            db.create_all()
        elif Author.query.first():
            raise click.ClickException("Database already has data. Use --reset to start over.")
        click.echo(f"Seeded: {seed_database()}")
