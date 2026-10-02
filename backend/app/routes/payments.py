"""Lightning invoices and reader entitlements."""

from datetime import timedelta

from flask import current_app, jsonify, request

from . import api
from ..extensions import db
from ..lightning import get_provider
from ..models import Chapter, Invoice, Unlock, utcnow
from ..security import ApiError, reader_id, require_demo_mode
from ..serializers import invoice_json


def _chapter_or_404(book_id, chapter_slug):
    chapter = Chapter.query.filter_by(book_id=book_id, slug=chapter_slug).first()
    if not chapter:
        raise ApiError("Chapter not found.", 404, "not_found")
    return chapter


def _invoice_for_reader(payment_hash, reader):
    invoice = db.session.get(Invoice, payment_hash)
    if not invoice or invoice.reader_id != reader:
        raise ApiError("Invoice not found.", 404, "not_found")
    return invoice


def _settle(invoice):
    """Mark an invoice paid and grant the chapter to its reader (idempotent)."""
    invoice.status = "paid"
    invoice.paid_at = utcnow()
    if not Unlock.query.filter_by(reader_id=invoice.reader_id, chapter_id=invoice.chapter_id).first():
        db.session.add(
            Unlock(reader_id=invoice.reader_id, chapter_id=invoice.chapter_id, invoice_hash=invoice.payment_hash)
        )


def _refresh(invoice):
    if invoice.status != "pending":
        return
    if get_provider(current_app.config["LIGHTNING_PROVIDER"]).is_paid(invoice.payment_hash):
        _settle(invoice)
    elif utcnow() >= invoice.expires_at:
        invoice.status = "expired"


@api.post("/invoices")
def create_invoice():
    reader = reader_id()
    body = request.get_json(silent=True) or {}
    chapter = _chapter_or_404(body.get("bookId"), body.get("chapterId"))

    if chapter.is_free:
        raise ApiError("This chapter is free — no payment needed.", 400, "chapter_free")
    if Unlock.query.filter_by(reader_id=reader, chapter_id=chapter.id).first():
        raise ApiError("You already own this chapter.", 409, "already_unlocked")

    provider = get_provider(current_app.config["LIGHTNING_PROVIDER"])
    created = provider.create_invoice(chapter.price_sats, f"{chapter.book.title} · Chapter {chapter.number}")
    now = utcnow()
    invoice = Invoice(
        payment_hash=created["payment_hash"],
        bolt11=created["bolt11"],
        chapter_id=chapter.id,
        reader_id=reader,
        amount_sats=chapter.price_sats,
        status="pending",
        created_at=now,
        expires_at=now + timedelta(seconds=current_app.config["INVOICE_TTL_SECONDS"]),
    )
    db.session.add(invoice)
    db.session.commit()
    return jsonify(invoice=invoice_json(invoice)), 201


@api.get("/invoices/<payment_hash>")
def get_invoice(payment_hash):
    invoice = _invoice_for_reader(payment_hash, reader_id())
    _refresh(invoice)
    db.session.commit()
    return jsonify(invoice=invoice_json(invoice))


@api.post("/invoices/<payment_hash>/simulate")
def simulate_invoice(payment_hash):
    """Demo-only: settle or fail a mock invoice."""
    require_demo_mode()
    if not get_provider(current_app.config["LIGHTNING_PROVIDER"]).supports_simulation:
        raise ApiError("The configured Lightning provider can't be simulated.", 400, "simulation_unsupported")

    invoice = _invoice_for_reader(payment_hash, reader_id())
    _refresh(invoice)
    if invoice.status != "pending":
        raise ApiError(f"Invoice is already {invoice.status}.", 409, "invoice_not_pending")

    outcome = (request.get_json(silent=True) or {}).get("outcome")
    if outcome == "paid":
        _settle(invoice)
    elif outcome == "failed":
        invoice.status = "failed"
    else:
        raise ApiError("outcome must be 'paid' or 'failed'.", 400, "invalid_outcome")

    db.session.commit()
    return jsonify(invoice=invoice_json(invoice))


@api.get("/readers/me/unlocks")
def list_unlocks():
    unlocks = Unlock.query.filter_by(reader_id=reader_id()).all()
    return jsonify(unlocks=[f"{u.chapter.book_id}:{u.chapter.slug}" for u in unlocks])


@api.put("/readers/me/unlocks/<book_id>/<chapter_slug>")
def demo_unlock(book_id, chapter_slug):
    """Demo-only toggle: grant a chapter without paying."""
    require_demo_mode()
    reader = reader_id()
    chapter = _chapter_or_404(book_id, chapter_slug)
    if not Unlock.query.filter_by(reader_id=reader, chapter_id=chapter.id).first():
        db.session.add(Unlock(reader_id=reader, chapter_id=chapter.id))
        db.session.commit()
    return jsonify(unlocked=True)


@api.delete("/readers/me/unlocks/<book_id>/<chapter_slug>")
def demo_lock(book_id, chapter_slug):
    """Demo-only toggle: revoke a chapter so the paywall can be tested again."""
    require_demo_mode()
    reader = reader_id()
    chapter = _chapter_or_404(book_id, chapter_slug)
    Unlock.query.filter_by(reader_id=reader, chapter_id=chapter.id).delete()
    db.session.commit()
    return jsonify(unlocked=False)
