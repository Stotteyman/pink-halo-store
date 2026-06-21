import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="min-h-screen bg-neutral-950 text-white py-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
        <span className="inline-flex rounded-full bg-pink-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-pink-200">
          404
        </span>
        <h1 className="text-5xl font-serif font-bold tracking-tight text-white">Page not found</h1>
        <p className="max-w-2xl text-base text-pink-200">
          The page you're looking for doesn't exist yet. Head back to the store to continue exploring Pink Halo’s premium collections.
        </p>
        <Link
          to="/"
          className="inline-flex rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-pink-500/20 transition hover:scale-[1.01]"
        >
          Return to home
        </Link>
      </div>
    </section>
  );
}
