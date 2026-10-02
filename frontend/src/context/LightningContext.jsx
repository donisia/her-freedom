import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useFlash } from '../hooks/useFlash';
import { INVOICE_TTL_SECONDS, createMockInvoice, formatSats } from '../utils/lightning';

/**
 * Lightning payment flow + chapter entitlements.
 *
 * `payment` drives the LightningModal. Unlocked chapters are persisted in
 * localStorage so the demo survives a refresh. In production, entitlements
 * would be granted server-side after the invoice's preimage is verified.
 */
export const LightningContext = createContext(null);

const STORAGE_KEY = 'sp:unlocked-chapters';
const keyFor = (bookId, chapterId) => `${bookId}:${chapterId}`;

function readUnlocked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
  } catch {
    return new Set();
  }
}

const newInvoice = (sats) => ({
  invoice: createMockInvoice(sats),
  status: 'pending',
  expiresAt: Date.now() + INVOICE_TTL_SECONDS * 1000,
});

export function LightningProvider({ children }) {
  const flash = useFlash();
  const [unlocked, setUnlocked] = useState(readUnlocked);
  /** payment: { book, chapter, invoice, status: 'pending'|'paid'|'failed', expiresAt } | null */
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
  }, [unlocked]);

  const isUnlocked = useCallback(
    (book, chapter) => Boolean(chapter?.isFree) || unlocked.has(keyFor(book?.id, chapter?.id)),
    [unlocked],
  );

  const unlockChapter = useCallback((bookId, chapterId) => {
    setUnlocked((prev) => new Set(prev).add(keyFor(bookId, chapterId)));
  }, []);

  const lockChapter = useCallback((bookId, chapterId) => {
    setUnlocked((prev) => {
      const next = new Set(prev);
      next.delete(keyFor(bookId, chapterId));
      return next;
    });
  }, []);

  const openPayment = useCallback((book, chapter) => {
    setPayment({ book, chapter, ...newInvoice(chapter.priceSats) });
  }, []);

  const regenerateInvoice = useCallback(() => {
    setPayment((current) => current && { ...current, ...newInvoice(current.chapter.priceSats) });
  }, []);

  const closePayment = useCallback(() => setPayment(null), []);

  const simulateSuccess = useCallback(() => {
    if (!payment || payment.status === 'paid') return;
    unlockChapter(payment.book.id, payment.chapter.id);
    setPayment((current) => current && { ...current, status: 'paid' });
    flash.success(`"${payment.chapter.title}" is unlocked. Enjoy the read.`, {
      title: `${formatSats(payment.chapter.priceSats)} sats sent to the author`,
    });
  }, [payment, unlockChapter, flash]);

  const simulateFailure = useCallback(() => {
    if (!payment || payment.status === 'paid') return;
    setPayment((current) => current && { ...current, status: 'failed' });
    flash.error('No route to the author’s node was found. No sats left your wallet.', {
      title: 'Payment failed',
    });
  }, [payment, flash]);

  const value = useMemo(
    () => ({
      payment,
      unlockedCount: unlocked.size,
      isUnlocked,
      unlockChapter,
      lockChapter,
      openPayment,
      regenerateInvoice,
      closePayment,
      simulateSuccess,
      simulateFailure,
    }),
    [
      payment,
      unlocked,
      isUnlocked,
      unlockChapter,
      lockChapter,
      openPayment,
      regenerateInvoice,
      closePayment,
      simulateSuccess,
      simulateFailure,
    ],
  );

  return <LightningContext.Provider value={value}>{children}</LightningContext.Provider>;
}
