/**
 * Formatted long-form chapter body. Prose gets a drop cap on the opening
 * paragraph; verse preserves line breaks.
 */
export default function ChapterContent({ paragraphs, format = 'prose', showEnding = true, dropCap = true }) {
  const isVerse = format === 'verse';

  return (
    <article className={`prose-reading ${isVerse ? 'verse' : ''}`}>
      {paragraphs.map((text, index) => (
        <p key={index} className={index === 0 && dropCap && !isVerse ? 'drop-cap' : undefined}>
          {text}
        </p>
      ))}

      {showEnding && (
        <div className="mt-16 flex items-center justify-center gap-4 text-btc/70" aria-hidden="true">
          <span className="h-px w-12 bg-line" />
          <span className="font-display text-xl">⁂</span>
          <span className="h-px w-12 bg-line" />
        </div>
      )}
    </article>
  );
}
