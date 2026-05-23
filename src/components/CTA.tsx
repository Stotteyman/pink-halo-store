import { Link } from 'react-router-dom';

export default function CTA({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl p-8 bg-gradient-to-r from-primary/10 to-secondary/8 border border-neutral-800 ${className}`}>
      <h2 className="text-2xl font-bold">Ready to Shop?</h2>
      <p className="text-gray-300 mt-2">Explore our latest collection and find your next favorite piece.</p>
      <div className="mt-4">
        <Link to="#products" className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-semibold">Start Shopping</Link>
      </div>
    </div>
  );
}
