import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useFlashMessages } from '../../hooks/useFlash';

const VARIANTS = {
  success: { icon: CheckCircle2, accent: 'text-emerald-300', bar: 'bg-emerald-400', ring: 'border-emerald-400/25' },
  error: { icon: XCircle, accent: 'text-red-300', bar: 'bg-red-400', ring: 'border-red-400/25' },
  warning: { icon: AlertTriangle, accent: 'text-amber-300', bar: 'bg-amber-400', ring: 'border-amber-400/25' },
  info: { icon: Info, accent: 'text-sky-300', bar: 'bg-sky-400', ring: 'border-sky-400/25' },
};

/** Stack of auto-dismissing notifications (top-right on desktop, top on mobile). */
export default function FlashMessage() {
  const { messages, dismiss } = useFlashMessages();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-5 sm:top-20 sm:items-end"
    >
      {messages.map((message) => {
        const variant = VARIANTS[message.type] || VARIANTS.info;
        const Icon = variant.icon;
        return (
          <div
            key={message.id}
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto relative w-full max-w-sm animate-slide-in overflow-hidden rounded-2xl border bg-surface/95 shadow-card backdrop-blur-xl ${variant.ring}`}
          >
            <div className="flex items-start gap-3 p-4 pr-11">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${variant.accent}`} />
              <div className="min-w-0">
                {message.title && <p className="text-sm font-semibold text-cream">{message.title}</p>}
                <p className={`text-sm leading-relaxed text-cream-muted ${message.title ? 'mt-0.5' : ''}`}>{message.text}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismiss(message.id)}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-cream-faint transition hover:bg-white/5 hover:text-cream"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
            {message.duration > 0 && (
              <span
                className={`absolute bottom-0 left-0 h-0.5 w-full origin-left animate-shrink opacity-70 ${variant.bar}`}
                style={{ animationDuration: `${message.duration}ms` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
