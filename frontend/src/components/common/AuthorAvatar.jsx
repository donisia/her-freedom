const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl',
};

/** Initials avatar tinted by the author's hue, ringed in Bitcoin orange. */
export default function AuthorAvatar({ author, size = 'md', className = '' }) {
  const hue = author?.avatarHue ?? 30;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-cream ring-2 ring-btc/50 ring-offset-2 ring-offset-ink ${SIZES[size]} ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue} 40% 14%))` }}
      aria-hidden="true"
    >
      {author?.initials || '?'}
    </span>
  );
}
