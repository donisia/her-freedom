import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFlash } from '../hooks/useFlash';
import { api } from '../utils/api';
import { formatSats } from '../utils/lightning';

/**
 * Lightning payment flow + chapter entitlements, backed by the API.
 *
 * The server issues invoices and records unlocks against this browser's
 * anonymous reader id; paid chapter text is only ever returned by the server
 * once that reader owns the chapter. `payment` drives the LightningModal.
 */
export const LightningContext = createContext(null);

const POLL_MS = 3000;
const keyFor = (bookId, chapterId) => `${bookId}:${chapterId}`;

export function LightningProvider({ children }) {
  const flash = useFlash();
  const [unlocked, setUnlocked] = useState(() => new Set());
  /**
   * payment: {
   *   book, chapter,
   *   status: 'creating' | 'pending' | 'paid' | 'failed' | 'expired' | 'error',
   *   invoice: { paymentHash, bolt11, expiresAt, ... } | null,
   *   error?: string,
   * } | null
   */
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const paymentRef = useRef(payment);
  paymentRef.current = payment;

  const refreshUnlocks = useCallback(async () => {
    try {
      const { unlocks } = await api.listUnlocks();
      setUnlocked(new Set(unlocks));
    } catch {
      /* Offline: keep whatever we already know. */
    }
  }, []);

  useEffect(() => {
    refreshUnlocks();
  }, [refreshUnlocks]);

  const markUnlocked = useCallback((bookId, chapterId, value) => {
    setUnlocked((prev) => {
      const next = new Set(prev);
      if (value) next.add(keyFor(bookId, chapterId));
      else next.delete(keyFor(bookId, chapterId));
      return next;
    });
  }, []);

  const isUnlocked = useCallback(
    (book, chapter) => Boolean(chapter?.isFree) || unlocked.has(keyFor(book?.id, chapter?.id)),
    [unlocked],
  );

  const announcePaid = useCallback(
    (chapter) => {
      flash.success(`"${chapter.title}" is unlocked. Enjoy the read.`, {
        title: `${formatSats(chapter.priceSats)} sats sent to the author`,
      });
    },
    [flash],
  );

  /** Apply a fresh invoice from the server to the open payment, if it still matches. */
  const applyInvoice = useCallback(
    (invoice) => {
      const current = paymentRef.current;
      if (!current || current.invoice?.paymentHash !== invoice.paymentHash) return;
      if (invoice.status === 'paid' && current.status !== 'paid') {
        markUnlocked(invoice.bookId, invoice.chapterId, true);
        announcePaid(current.chapter);
      }
      setPayment((p) => (p?.invoice?.paymentHash === invoice.paymentHash ? { ...p, invoice, status: invoice.status } : p));
    },
    [markUnlocked, announcePaid],
  );

  const requestInvoice = useCallback(
    async (book, chapter) => {
      setPayment({ book, chapter, invoice: null, status: 'creating' });
      try {
        const { invoice } = await api.createInvoice(book.id, chapter.id);
        setPayment((p) => (p?.chapter.id === chapter.id ? { ...p, invoice, status: invoice.status } : p));
      } catch (error) {
        if (error.code === 'already_unlocked') {
          markUnlocked(book.id, chapter.id, true);
          setPayment((p) => p && { ...p, status: 'paid' });
          flash.info('This chapter is already unlocked for this browser.', { title: 'Already yours' });
          return;
        }
        setPayment((p) => p && { ...p, status: 'error', error: error.message });
      }
    },
    [markUnlocked, flash],
  );

  const openPayment = useCallback((book, chapter) => requestInvoice(book, chapter), [requestInvoice]);

  const regenerateInvoice = useCallback(() => {
    const current = paymentRef.current;
    if (current) requestInvoice(current.book, current.chapter);
  }, [requestInvoice]);

  const closePayment = useCallback(() => setPayment(null), []);

  // Poll the server while an invoice is pending, so a real wallet payment
  // (or expiry) is picked up without user action.
  const pendingHash = payment?.status === 'pending' ? payment.invoice?.paymentHash : null;
  useEffect(() => {
    if (!pendingHash) return undefined;
    const interval = setInterval(async () => {
      try {
        const { invoice } = await api.getInvoice(pendingHash);
        if (invoice.status !== 'pending') applyInvoice(invoice);
      } catch {
        /* transient; try again next tick */
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [pendingHash, applyInvoice]);

  const simulate = useCallback(
    async (outcome) => {
      const current = paymentRef.current;
      if (!current?.invoice || current.status !== 'pending' || busy) return;
      setBusy(true);
      try {
        const { invoice } = await api.simulateInvoice(current.invoice.paymentHash, outcome);
        applyInvoice(invoice);
        if (invoice.status === 'failed') {
          flash.error('No route to the author’s node was found. No sats left your wallet.', { title: 'Payment failed' });
        }
      } catch (error) {
        flash.error(error.message, { title: 'Simulation failed' });
      } finally {
        setBusy(false);
      }
    },
    [busy, applyInvoice, flash],
  );

  const simulateSuccess = useCallback(() => simulate('paid'), [simulate]);
  const simulateFailure = useCallback(() => simulate('failed'), [simulate]);

  /** Demo toggle: grant or revoke a chapter server-side without paying. */
  const setChapterAccess = useCallback(
    async (bookId, chapterId, value) => {
      try {
        if (value) await api.demoUnlock(bookId, chapterId);
        else await api.demoLock(bookId, chapterId);
        markUnlocked(bookId, chapterId, value);
      } catch (error) {
        flash.error(error.message, { title: 'Couldn’t change access' });
      }
    },
    [markUnlocked, flash],
  );

  const unlockChapter = useCallback((bookId, chapterId) => setChapterAccess(bookId, chapterId, true), [setChapterAccess]);
  const lockChapter = useCallback((bookId, chapterId) => setChapterAccess(bookId, chapterId, false), [setChapterAccess]);

  const value = useMemo(
    () => ({
      payment,
      isSimulating: busy,
      unlockedCount: unlocked.size,
      isUnlocked,
      unlockChapter,
      lockChapter,
      refreshUnlocks,
      openPayment,
      regenerateInvoice,
      closePayment,
      simulateSuccess,
      simulateFailure,
    }),
    [
      payment,
      busy,
      unlocked,
      isUnlocked,
      unlockChapter,
      lockChapter,
      refreshUnlocks,
      openPayment,
      regenerateInvoice,
      closePayment,
      simulateSuccess,
      simulateFailure,
    ],
  );

  return <LightningContext.Provider value={value}>{children}</LightningContext.Provider>;
}
