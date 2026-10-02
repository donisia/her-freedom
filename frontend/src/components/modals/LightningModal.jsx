import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FlaskConical,
  Loader2,
  RefreshCw,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useLightning } from '../../hooks/useLightning';
import { useFlash } from '../../hooks/useFlash';
import { buildQrMatrix, formatSats } from '../../utils/lightning';
import { copyToClipboard } from '../../utils/clipboard';

/** Visual QR-style code generated from the invoice string (demo only). */
function MockQrCode({ value }) {
  const matrix = useMemo(() => buildQrMatrix(value), [value]);
  const size = matrix.length;
  const quiet = 3;

  return (
    <svg
      viewBox={`0 0 ${size + quiet * 2} ${size + quiet * 2}`}
      className="h-full w-full"
      shapeRendering="crispEdges"
      role="img"
      aria-label="Lightning invoice QR code"
    >
      <rect width="100%" height="100%" fill="#F4F1EA" />
      {matrix.flatMap((row, r) =>
        row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c + quiet} y={r + quiet} width="1" height="1" fill="#0F1012" /> : null)),
      )}
      {/* Centre badge */}
      <rect x={size / 2 + quiet - 3} y={size / 2 + quiet - 3} width="6" height="6" rx="1.4" fill="#F7931A" />
      <path
        d={`M${size / 2 + quiet + 0.4} ${size / 2 + quiet - 2.2} L${size / 2 + quiet - 1.4} ${size / 2 + quiet + 0.3} H${size / 2 + quiet} L${size / 2 + quiet - 0.4} ${size / 2 + quiet + 2.2} L${size / 2 + quiet + 1.4} ${size / 2 + quiet - 0.3} H${size / 2 + quiet} Z`}
        fill="#0F1012"
      />
    </svg>
  );
}

function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Lightning checkout modal. Opened via `openPayment(book, chapter)` from
 * the Lightning context; includes a payment simulator for the demo.
 */
export default function LightningModal() {
  const { payment, isSimulating, closePayment, simulateSuccess, simulateFailure, regenerateInvoice } = useLightning();
  const flash = useFlash();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  const isOpen = Boolean(payment);

  // Countdown ticker
  useEffect(() => {
    if (!isOpen) return undefined;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Escape to close, lock background scroll, move focus into the dialog
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    const onKey = (event) => event.key === 'Escape' && closePayment();
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, [isOpen, closePayment]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!payment) return null;

  const { book, chapter, status } = payment;
  const invoice = payment.invoice?.bolt11 || '';
  const expiresAt = payment.invoice ? Date.parse(payment.invoice.expiresAt) : now;
  const remaining = Math.max(0, Math.round((expiresAt - now) / 1000));
  const isExpired = status === 'expired' || (status === 'pending' && remaining === 0);
  const canSimulate = status === 'pending' && !isExpired && !isSimulating;

  const handleCopy = async () => {
    if (!invoice) return;
    const ok = await copyToClipboard(invoice);
    if (ok) {
      setCopied(true);
      flash.success('Paste it into any Lightning wallet to pay.', { title: 'Invoice copied', duration: 2500 });
    } else {
      flash.error('Copy failed. Long-press the invoice to copy it manually.');
    }
  };

  const startReading = () => {
    closePayment();
    navigate(`/book/${book.id}/chapter/${chapter.id}`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button
        type="button"
        aria-label="Close payment dialog"
        className="absolute inset-0 animate-fade-in cursor-default bg-black/75 backdrop-blur-sm"
        onClick={closePayment}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ln-modal-title"
        tabIndex={-1}
        className="relative max-h-[94dvh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-t-3xl border border-line bg-surface shadow-card focus:outline-none sm:rounded-3xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-btc/15 text-btc">
              <Zap className="h-4 w-4" fill="currentColor" />
            </span>
            <h2 id="ln-modal-title" className="text-sm font-semibold text-cream">
              Unlock with Lightning
            </h2>
          </div>
          <button type="button" onClick={closePayment} className="icon-btn h-9 w-9" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-6 pt-5 sm:px-6">
          {/* Purchase summary */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-[0.16em] text-cream-faint">{book.title}</p>
              <p className="mt-1 font-display text-xl leading-snug text-cream">
                Chapter {chapter.number}: {chapter.title}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-3xl text-btc">{formatSats(chapter.priceSats)}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-cream-faint">sats</p>
            </div>
          </div>

          {/* Status-dependent body */}
          {status === 'paid' ? (
            <div className="mt-6 animate-fade-up rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
              <p className="mt-4 font-display text-2xl text-cream">Payment received</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-cream-muted">
                {formatSats(chapter.priceSats)} sats went straight to the author. This chapter is now unlocked on this device.
              </p>
              <button type="button" onClick={startReading} className="btn-primary mt-6 w-full sm:w-auto">
                <BookOpen className="h-4 w-4" /> Start reading
              </button>
            </div>
          ) : status === 'error' ? (
            <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-400/[0.06] p-6 text-center">
              <XCircle className="mx-auto h-10 w-10 text-red-300" />
              <p className="mt-3 font-display text-xl text-cream">Couldn’t create an invoice</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-cream-muted">{payment.error}</p>
              <button type="button" onClick={regenerateInvoice} className="btn-secondary btn-sm mt-5">
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          ) : (
            <>
              <div className="relative mx-auto mt-6 aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl bg-cream p-2 shadow-glow-soft">
                {invoice ? (
                  <MockQrCode value={invoice} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" aria-label="Creating invoice">
                    <Loader2 className="h-8 w-8 animate-spin text-ink/60" />
                  </div>
                )}
                {(status === 'failed' || isExpired) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/85 p-6 text-center backdrop-blur-sm">
                    {isExpired ? <Clock className="h-9 w-9 text-amber-300" /> : <XCircle className="h-9 w-9 text-red-300" />}
                    <p className="text-sm font-medium text-cream">{isExpired ? 'Invoice expired' : 'Payment failed'}</p>
                    <button type="button" onClick={regenerateInvoice} className="btn-secondary btn-sm">
                      <RefreshCw className="h-3.5 w-3.5" /> New invoice
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-cream-faint">
                {status === 'creating' && 'Requesting an invoice from the author’s node…'}
                {status === 'pending' && !isExpired && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-btc" />
                    Waiting for payment · expires in <span className="font-mono text-cream-muted">{formatCountdown(remaining)}</span>
                  </>
                )}
                {status === 'failed' && <span className="text-red-300">The route failed. No sats were sent.</span>}
              </div>

              {/* Invoice string */}
              <div className="mt-5">
                <label htmlFor="ln-invoice" className="label">
                  Lightning invoice
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    id="ln-invoice"
                    readOnly
                    value={invoice}
                    onFocus={(e) => e.target.select()}
                    className="input min-w-0 flex-1 truncate py-2.5 font-mono text-xs"
                  />
                  <button type="button" onClick={handleCopy} className="btn-secondary btn-sm shrink-0 rounded-xl px-4">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy Invoice'}
                  </button>
                </div>
                <a href={`lightning:${invoice}`} className="mt-3 inline-flex items-center gap-1.5 text-xs text-cream-muted transition hover:text-btc">
                  <ExternalLink className="h-3.5 w-3.5" /> Open in wallet app
                </a>
              </div>

              {/* Demo simulator */}
              <div className="mt-6 rounded-2xl border border-dashed border-btc/30 bg-btc/[0.04] p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-btc">
                  <FlaskConical className="h-3.5 w-3.5" /> Payment simulator
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-cream-muted">
                  This invoice is a demo and can’t be paid on mainnet. Use these buttons to test the unlock flow.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={simulateSuccess} disabled={!canSimulate} className="btn-primary btn-sm disabled:opacity-50">
                    {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Simulate Success
                  </button>
                  <button type="button" onClick={simulateFailure} disabled={!canSimulate} className="btn-danger btn-sm disabled:opacity-50">
                    <AlertTriangle className="h-3.5 w-3.5" /> Simulate Failure
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
