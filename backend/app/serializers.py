"""JSON shapes returned by the API (camelCase, matching the React frontend)."""

from sqlalchemy import func

from .extensions import db
from .models import Chapter, Invoice

PREVIEW_PARAGRAPHS = 2


def iso(dt):
    return dt.isoformat() + "Z" if dt else None


def author_summary(author):
    return {
        "npub": author.npub,
        "pubkey": author.pubkey,
        "name": author.name,
        "initials": author.initials,
        "avatarHue": author.avatar_hue,
        "lightningAddress": author.lightning_address,
    }


def author_stats(author):
    chapter_ids = [c.id for b in author.books for c in b.chapters]
    paid = (
        db.session.query(func.count(func.distinct(Invoice.reader_id)), func.coalesce(func.sum(Invoice.amount_sats), 0))
        .filter(Invoice.chapter_id.in_(chapter_ids), Invoice.status == "paid")
        .one()
        if chapter_ids
        else (0, 0)
    )
    return {
        "books": len(author.books),
        "chapters": len(chapter_ids),
        "paidReaders": paid[0],
        "satsEarned": int(paid[1]),
    }


def author_full(author):
    return {
        **author_summary(author),
        "bio": author.bio,
        "location": author.location,
        "joined": iso(author.joined_at),
        "stats": author_stats(author),
    }


def chapter_meta(chapter):
    return {
        "id": chapter.slug,
        "number": chapter.number,
        "title": chapter.title,
        "isFree": chapter.is_free,
        "priceSats": chapter.price_sats,
        "readingMinutes": chapter.reading_minutes,
        "publishedAt": iso(chapter.published_at),
    }


def book_summary(book):
    paid_prices = [c.price_sats for c in book.chapters if not c.is_free]
    return {
        "id": book.id,
        "title": book.title,
        "subtitle": book.subtitle,
        "category": book.category,
        "language": book.language,
        "format": book.format,
        "description": book.description,
        "tags": book.tags or [],
        "cover": book.cover,
        "coverUrl": book.cover_url,
        "featured": book.featured,
        "nostrEventId": book.nostr_event_id,
        "publishedAt": iso(book.published_at),
        "author": author_summary(book.author),
        "chapterCount": len(book.chapters),
        "freeCount": sum(1 for c in book.chapters if c.is_free),
        "paidCount": len(paid_prices),
        "startingPrice": min(paid_prices) if paid_prices else 0,
        "fullPrice": sum(paid_prices),
    }


def book_detail(book):
    return {
        **book_summary(book),
        "author": author_full(book.author),
        "chapters": [chapter_meta(c) for c in book.chapters],
    }


def chapter_read(chapter: Chapter, unlocked: bool):
    """Paid, locked chapters only ever expose their preview paragraphs."""
    book = chapter.book
    paragraphs = chapter.content or []
    return {
        "book": {
            "id": book.id,
            "title": book.title,
            "format": book.format,
            "author": author_summary(book.author),
            "chapters": [chapter_meta(c) for c in book.chapters],
        },
        "chapter": chapter_meta(chapter),
        "unlocked": unlocked,
        "paragraphs": paragraphs if unlocked else paragraphs[:PREVIEW_PARAGRAPHS],
    }


def invoice_json(invoice):
    chapter = invoice.chapter
    return {
        "paymentHash": invoice.payment_hash,
        "bolt11": invoice.bolt11,
        "amountSats": invoice.amount_sats,
        "status": invoice.status,
        "createdAt": iso(invoice.created_at),
        "expiresAt": iso(invoice.expires_at),
        "paidAt": iso(invoice.paid_at),
        "bookId": chapter.book_id,
        "chapterId": chapter.slug,
    }


def income_entry(invoice):
    chapter = invoice.chapter
    return {
        "id": invoice.payment_hash,
        "bookId": chapter.book_id,
        "bookTitle": chapter.book.title,
        "chapterId": chapter.slug,
        "chapterNumber": chapter.number,
        "chapterTitle": chapter.title,
        "reader": invoice.reader_id[:14],
        "sats": invoice.amount_sats,
        "at": iso(invoice.paid_at),
    }
