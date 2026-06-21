import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-serif font-bold text-pink-900 mb-4">404</h1>
        <p className="text-xl text-pink-700 mb-8">Page not found.</p>
        <Link to="/" className="inline-block px-8 py-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
