import { useState } from 'react';
import { getAuthorByNpub } from '../../data/mockBooks';

/** Decorative SVG motifs that give each generated cover its own identity. */
function Motif({ type, accent }) {
  const common = { className: 'absolute inset-0 h-full w-full', viewBox: '0 0 200 300', preserveAspectRatio: 'none', 'aria-hidden': true };
  switch (type) {
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="100" cy="190" r="46" fill={accent} opacity="0.85" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1="20" x2="180" y1={238 + i * 9} y2={238 + i * 9} stroke={accent} strokeOpacity={0.5 - i * 0.07} strokeWidth="1.2" />
          ))}
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <circle cx="120" cy="175" r="40" fill={accent} opacity="0.9" />
          <circle cx="137" cy="164" r="36" fill="currentColor" className="text-black/80" />
          {[...Array(14)].map((_, i) => (
            <circle key={i} cx={(i * 47) % 190 + 6} cy={(i * 71) % 120 + 115} r="0.9" fill="#fff" opacity="0.6" />
          ))}
        </svg>
      );
    case 'arch':
      return (
        <svg {...common}>
          <path d="M45 280 V185 a55 55 0 0 1 110 0 V280" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.8" />
          <path d="M65 280 V190 a35 35 0 0 1 70 0 V280" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          {[...Array(8)].map((_, r) =>
            [...Array(6)].map((__, c) => (
              <rect key={`${r}-${c}`} x={28 + c * 26} y={130 + r * 18} width="14" height="2" fill={accent} opacity={0.15 + ((r + c) % 4) * 0.15} />
            )),
          )}
        </svg>
      );
    case 'wave':
      return (
        <svg {...common}>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M0 ${190 + i * 16} Q 50 ${170 + i * 16} 100 ${190 + i * 16} T 200 ${190 + i * 16}`}
              fill="none"
              stroke={accent}
              strokeWidth="1.2"
              opacity={0.75 - i * 0.12}
            />
          ))}
        </svg>
      );
    default:
      return (
        <svg {...common}>
          {[...Array(10)].map((_, i) => (
            <line key={i} x1="28" x2="172" y1={140 + i * 12} y2={140 + i * 12} stroke={accent} strokeOpacity={0.12 + (i % 3) * 0.12} />
          ))}
        </svg>
      );
  }
}

const SIZES = {
  xs: { frame: null },
  sm: { title: 'text-[15px]', meta: 'text-[8px]', pad: 'p-3', frame: 'inset-2' },
  md: { title: 'text-xl', meta: 'text-[9px]', pad: 'p-4', frame: 'inset-2.5' },
  lg: { title: 'text-3xl sm:text-4xl', meta: 'text-[11px]', pad: 'p-6', frame: 'inset-3' },
};

/**
 * Book cover. Uses `book.coverUrl` when provided, otherwise renders a
 * generated typographic cover from `book.cover` palette + motif.
 */
export default function BookCover({ book, size = 'md', className = '', showCategory = true }) {
  const [imageFailed, setImageFailed] = useState(false);
  const author = getAuthorByNpub(book.authorNpub);
  const s = SIZES[size];
  const palette = book.cover || { from: '#2A2D37', to: '#0F1012', accent: '#F7931A', motif: 'lines' };

  if (book.coverUrl && !imageFailed) {
    return (
      <div className={`relative aspect-[2/3] overflow-hidden rounded-lg bg-card shadow-cover ${className}`}>
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Cover of ${book.title}`}
      className={`relative aspect-[2/3] overflow-hidden rounded-lg shadow-cover ${className}`}
      style={{ background: `linear-gradient(160deg, ${palette.from} 0%, ${palette.to} 100%)` }}
    >
      <div className="grain absolute inset-0 opacity-60" />
      <Motif type={palette.motif} accent={palette.accent} />
      {/* Spine shading */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent" />
      {s.frame && <div className={`absolute ${s.frame} rounded-[3px] border border-white/10`} />}

      {size !== 'xs' && (
        <div className={`relative flex h-full flex-col ${s.pad}`}>
          <p
            className={`${s.meta} font-semibold uppercase tracking-[0.3em] ${showCategory ? '' : 'invisible'}`}
            style={{ color: palette.accent }}
          >
            {book.category}
          </p>
          <p className={`mt-3 font-display font-semibold leading-[1.08] text-cream text-balance ${s.title}`}>
            {book.title || 'Untitled'}
          </p>
          <div className="mt-auto">
            <div className="mb-2 h-px w-8" style={{ background: palette.accent }} />
            <p className={`${s.meta} font-medium uppercase tracking-[0.24em] text-cream/80`}>
              {author?.name || book.authorName || 'Anonymous'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
