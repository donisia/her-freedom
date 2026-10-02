import { Link } from 'react-router-dom';

/** Wordmark: a serif "S" seal followed by the platform name. */
export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Sovereign Publishing home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-btc/40 bg-gradient-to-br from-btc/20 to-transparent font-display text-xl font-semibold text-btc transition group-hover:shadow-glow">
        S
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[17px] font-semibold tracking-tight text-cream">Sovereign</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.28em] text-cream-faint">Publishing</span>
        </span>
      )}
    </Link>
  );
}
