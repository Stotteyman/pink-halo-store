import { Link } from 'react-router-dom';
import { HaloCrest } from './brand';

export default function NotFound() {
  return (
    <section className="bg-cream py-24 lg:py-36">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-5 px-4 text-center">
        <HaloCrest className="w-[96px] text-rose" />
        <p className="overline text-gold">404 — Page not found</p>
        <h1 className="font-serif font-medium text-ink text-5xl md:text-6xl leading-none">
          This halo has <em className="italic text-rose">drifted.</em>
        </h1>
        <p className="max-w-md text-[15px] text-ink-soft">
          The page you're looking for doesn't exist yet. Head back to the store to keep exploring Pink Halo Co.
        </p>
        <Link to="/" className="btn-primary mt-3">
          Return to home
        </Link>
      </div>
    </section>
  );
}
