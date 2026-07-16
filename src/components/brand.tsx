import { Link } from 'react-router-dom';

/*
 * Pink Halo Co. brand marks — recreated as inline SVG from the brand deck:
 * a thin halo ellipse flanked by four-point sparkles above the letterspaced
 * serif wordmark "PINK HALO CO."
 */

export function HaloCrest({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 92 26" fill="none" className={className} aria-hidden="true">
      <ellipse cx="46" cy="16" rx="26" ry="5.5" stroke={color} strokeWidth="1.1" />
      <path d="M15.5 4.5l.9 2.9 2.9.9-2.9.9-.9 2.9-.9-2.9-2.9-.9 2.9-.9z" fill={color} />
      <path d="M72 1l.8 2.6 2.6.8-2.6.8L72 7.8l-.8-2.6-2.6-.8 2.6-.8z" fill={color} />
    </svg>
  );
}

export function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
    </svg>
  );
}

type WordmarkProps = {
  /** Tailwind classes for the wordmark text */
  textClassName?: string;
  /** Tailwind classes for the halo crest */
  crestClassName?: string;
  to?: string | null;
  className?: string;
};

export function HaloWordmark({
  textClassName = 'text-ink text-xl',
  crestClassName = 'text-rose w-[84px]',
  to = '/',
  className = '',
}: WordmarkProps) {
  const mark = (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <HaloCrest className={`mb-1 ${crestClassName}`} />
      <span className={`font-serif font-medium tracking-[0.3em] indent-[0.3em] whitespace-nowrap ${textClassName}`}>
        PINK HALO CO.
      </span>
    </span>
  );
  if (!to) return mark;
  return (
    <Link to={to} aria-label="Pink Halo Co. home" className="inline-flex">
      {mark}
    </Link>
  );
}
