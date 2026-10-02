import { Loader2, WifiOff } from 'lucide-react';
import EmptyState from './EmptyState';

/** Full-width loading indicator for pages waiting on the API. */
export function PageLoading({ label = 'Loading…' }) {
  return (
    <div className="container-page flex items-center justify-center gap-3 py-32 text-sm text-cream-faint" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-btc" /> {label}
    </div>
  );
}

/** API error with a retry button. 404s should be handled by the caller with a specific EmptyState. */
export function PageError({ error, onRetry }) {
  return (
    <div className="container-page py-24">
      <EmptyState
        icon={WifiOff}
        title="Something went wrong"
        description={error?.message || 'The server didn’t respond.'}
        actionLabel={onRetry ? 'Try again' : undefined}
        onAction={onRetry}
      />
    </div>
  );
}
