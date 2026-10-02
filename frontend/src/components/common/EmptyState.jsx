import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

/** Centered empty / not-found state with an optional call to action. */
export default function EmptyState({ icon: Icon = BookOpen, title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="panel mx-auto flex max-w-xl flex-col items-center px-6 py-14 text-center sm:px-12">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card text-btc">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-6 font-display text-2xl text-cream sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 max-w-md text-sm leading-relaxed text-cream-muted">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-8">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button type="button" onClick={onAction} className="btn-primary mt-8">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
