import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerSession } from '../auth/useCustomerSession';
import { signOutSupabase } from '../lib/supabase';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Products', to: '/admin/products' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Manufacturers', to: '/admin/manufacturers' },
  { label: 'Sourcing & Pricing', to: '/admin/sourcing' },
  { label: 'Discounts', to: '/admin/discounts' },
  { label: 'Mail', to: '/admin/mail' },
  { label: 'Marketing', to: '/admin/marketing' },
  { label: 'Gallery', to: '/admin/gallery' },
  { label: 'Roles', to: '/admin/roles' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { session } = useCustomerSession();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-pink-600 font-semibold">Pink Halo</p>
            <p className="text-sm text-gray-600">Admin workspace</p>
          </div>
          <div className="flex items-center gap-3">
            {session?.user?.email && (
              <p className="hidden md:block text-xs text-gray-500 max-w-[240px] truncate" title={session.user.email}>
                {session.user.user_metadata?.full_name || session.user.email}
              </p>
            )}
            <Link to="/" className="text-xs text-gray-600 hover:text-gray-900">Back to store</Link>
            <button onClick={() => signOutSupabase()} className="text-xs text-gray-600 hover:text-gray-900">Sign out</button>
          </div>
        </div>
        <nav className="max-w-[1280px] mx-auto px-3 md:px-6 lg:px-8 pb-3 flex gap-2 overflow-x-auto">
          {NAV_ITEMS.map(item => {
            const active = item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-colors ${
                  active
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-5 md:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
