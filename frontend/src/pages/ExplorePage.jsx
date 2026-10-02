import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import BookCard from '../components/common/BookCard';
import { CATEGORIES, books, getAuthorByNpub } from '../data/mockBooks';

/** Full-text-ish haystack per book: title, subtitle, author, description, tags. */
const searchIndex = books.map((book) => ({
  book,
  haystack: [book.title, book.subtitle, getAuthorByNpub(book.authorNpub)?.name, book.description, ...book.tags]
    .join(' ')
    .toLowerCase(),
}));

export default function ExplorePage() {
  // Filters live in the URL so results are shareable and survive back/forward.
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = CATEGORIES.includes(params.get('category')) ? params.get('category') : 'All';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'All') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return searchIndex
      .filter(({ book, haystack }) => (category === 'All' || book.category === category) && (!needle || haystack.includes(needle)))
      .map(({ book }) => book);
  }, [query, category]);

  const counts = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c, c === 'All' ? books.length : books.filter((b) => b.category === c).length])),
    [],
  );

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow">The library</p>
        <h1 className="mt-4 font-display text-4xl text-cream sm:text-6xl">Explore books</h1>
        <p className="mt-4 text-lg leading-relaxed text-cream-muted">
          Every title here is signed by its author’s Nostr key. Start with the free chapters, unlock the rest with sats.
        </p>
      </header>

      {/* Search */}
      <div className="sticky top-16 z-20 -mx-4 mt-10 border-b border-line/60 bg-ink/85 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => updateParam('q', e.target.value)}
            placeholder="Search by title, author, or keyword…"
            aria-label="Search books"
            className="input rounded-full py-3.5 pl-11 pr-12"
          />
          {query && (
            <button
              type="button"
              onClick={() => updateParam('q', '')}
              className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-cream-faint hover:bg-white/5 hover:text-cream"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Categories">
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => updateParam('category', c)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition active:scale-[0.97] ${
                  active
                    ? 'border-btc bg-btc text-ink shadow-glow'
                    : 'border-line bg-surface text-cream-muted hover:border-btc/50 hover:text-cream'
                }`}
              >
                {c}
                <span className={`text-[11px] ${active ? 'text-ink/70' : 'text-cream-faint'}`}>{counts[c]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-8 text-sm text-cream-faint" aria-live="polite">
        {results.length} {results.length === 1 ? 'title' : 'titles'}
        {category !== 'All' && ` in ${category}`}
        {query && ` matching “${query}”`}
      </p>

      {results.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {results.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="panel mx-auto mt-10 flex max-w-xl flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card text-cream-faint">
            <SearchX className="h-6 w-6" />
          </span>
          <h2 className="mt-6 font-display text-2xl text-cream">No books found</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-cream-muted">
            Nothing on our relays matches those filters yet. Try a different keyword or browse every category.
          </p>
          <button type="button" onClick={() => setParams({}, { replace: true })} className="btn-secondary mt-8">
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
