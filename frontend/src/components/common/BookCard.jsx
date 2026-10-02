import { Link } from 'react-router-dom';
import { BadgeCheck, Layers, Zap } from 'lucide-react';
import BookCover from './BookCover';
import { getAuthorByNpub, getStartingPrice } from '../../data/mockBooks';
import { formatSats } from '../../utils/lightning';

/** Catalogue card used on Home, Explore and Author pages. */
export default function BookCard({ book }) {
  const author = getAuthorByNpub(book.authorNpub);
  const startingPrice = getStartingPrice(book);
  const freeCount = book.chapters.filter((c) => c.isFree).length;

  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex flex-col rounded-2xl p-2 transition duration-300 hover:bg-white/[0.02] focus-visible:bg-white/[0.02]"
    >
      <div className="relative">
        <BookCover
          book={book}
          showCategory={false}
          className="transition duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-glow-soft"
        />
        <span className="badge absolute left-2.5 top-2.5 border-white/10 bg-black/50 text-cream backdrop-blur-md">
          {book.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4">
        <h3 className="font-display text-lg leading-snug text-cream transition group-hover:text-btc sm:text-xl">
          {book.title}
        </h3>
        <p className="mt-1 text-sm text-cream-muted">{author?.name}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-cream-faint">
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {book.chapters.length} chapters
          </span>
          <span className="inline-flex items-center gap-1 text-btc">
            <Zap className="h-3.5 w-3.5" />
            {startingPrice ? `From ${formatSats(startingPrice)} sats` : 'Free'}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          <span className="badge-nostr">
            <BadgeCheck className="h-3 w-3" /> Signed on Nostr
          </span>
          {freeCount > 0 && <span className="badge-free">{freeCount} free</span>}
        </div>
      </div>
    </Link>
  );
}
