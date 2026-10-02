import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import BookCard, { BookCardSkeleton } from '../components/common/BookCard';
import { PageError } from '../components/common/PageStatus';
import { CATEGORIES } from '../data/catalogue';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

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

  // Search runs server-side (title, subtitle, author, description, tags).
  const needle = useDebounced(query.trim(), 250);
  const { data, error, loading, reload } = useApi(
    (signal) => api.listBooks({ q: needle, category: category === 'All' ? '' : category }, { signal }),
    [needle, category],
  );
  const results = data?.books ?? [];
  const counts = data?.categoryCounts ?? {};

  if (error && !data) return <PageError error={error} onRetry={reload} />;

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
                <span className={`text-[11px] ${active ? 'text-ink/70' : 'text-cream-faint'}`}>{counts[c] ?? '–'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-8 text-sm text-cream-faint" aria-live="polite">
        {!data ? (
          'Loading the library…'
        ) : (
          <>
            {results.length} {results.length === 1 ? 'title' : 'titles'}
            {category !== 'All' && ` in ${category}`}
            {needle && ` matching “${needle}”`}
          </>
        )}
      </p>

      {!data && loading ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div
          className={`mt-6 grid grid-cols-2 gap-x-3 gap-y-8 transition-opacity sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 ${loading ? 'opacity-60' : ''}`}
        >
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
