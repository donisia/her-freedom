import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';
import { useFlash } from '../../hooks/useFlash';

/** Small copy-to-clipboard button with a transient "copied" state. */
export default function CopyButton({ value, label = 'Copy', className = '', showLabel = false, successMessage }) {
  const [copied, setCopied] = useState(false);
  const flash = useFlash();

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      if (successMessage) flash.success(successMessage, { duration: 2500 });
    } else {
      flash.error('Your browser blocked clipboard access. Select the text and copy it manually.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      className={`inline-flex items-center gap-1.5 rounded-full text-cream-faint transition hover:text-btc active:scale-95 ${
        showLabel ? 'border border-line px-3 py-1.5 text-xs hover:border-btc/50' : 'h-8 w-8 justify-center hover:bg-white/5'
      } ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
      {showLabel && (copied ? 'Copied' : label)}
    </button>
  );
}
