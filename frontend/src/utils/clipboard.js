/**
 * Copy text using document.execCommand('copy') for broad compatibility
 * (works inside iframes and non-secure origins), falling back to the
 * async Clipboard API when execCommand is unavailable.
 */
export async function copyToClipboard(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    Object.assign(textarea.style, { position: 'fixed', top: '-1000px', left: '0', opacity: '0' });
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (ok) return true;
  } catch {
    /* fall through to the Clipboard API */
  }

  try {
    await navigator.clipboard?.writeText(text);
    return Boolean(navigator.clipboard);
  } catch {
    return false;
  }
}
