import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import AnimatedHero from './components/AnimatedHero';
import CategoryGrid from './components/CategoryGrid';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import NotFound from './components/NotFound';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminAddProductPage from './pages/AdminAddProductPage';
import AdminEditProductPage from './pages/AdminEditProductPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminManufacturersPage from './pages/AdminManufacturersPage';
import AdminDiscountsPage from './pages/AdminDiscountsPage';
import AdminRolesPage from './pages/AdminRolesPage';
import { loadProducts, saveProducts, getCategories } from './lib/products';
import { fetchCurrentUserRole, fetchPublishedStorefrontProducts, signInWithGoogle, signOutSupabase, supabaseClient } from './lib/supabase';
import type { Product } from './lib/types';
import { clearGuestCart, ensureGuestSession, loadGuestCart, saveGuestCart } from './lib/session';
import CartPage from './pages/CartPage';

const CATEGORIES = getCategories();

function categoryFromPath(pathname: string): string {
  const match = pathname.match(/^\/category\/([^/]+)/);
  if (!match) return 'All';
  const segment = decodeURIComponent(match[1]).toLowerCase();
  return CATEGORIES.find((name) => name.toLowerCase() === segment) ?? 'All';
}

function categoryRoute(category: string) {
  return category === 'All' ? '/shop' : `/category/${category.toLowerCase()}`;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function productMask(text: string) {
  return text.length > 85 ? `${text.slice(0, 82)}...` : text;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLandingRoute = location.pathname === '/';
  const [products, setProducts] = useState<Product[]>(loadProducts());
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState(false);
  const [userRole, setUserRole] = useState<string>('guest');

  useEffect(() => {
    ensureGuestSession();
    setCart(loadGuestCart());
    setProducts(loadProducts());

    if (!supabaseClient) return;

    fetchPublishedStorefrontProducts()
      .then(publishedProducts => setProducts(publishedProducts))
      .catch(error => console.error('Storefront catalog error', error));

    const loadSessionRole = async (session: any) => {
      if (!session?.user) return;
      try {
        const data = await fetchCurrentUserRole();
        if (data?.current_role) {
          setUserRole(String(data.current_role));
          return;
        }
      } catch {
        // Ignore backend role lookup failure and fall back to metadata.
      }
      const fallbackRole = session.user?.app_metadata?.role || 'customer';
      setUserRole(String(fallbackRole));
    };

    supabaseClient.auth.getSession().then(({ data: sessionData }) => {
      const signedIn = Boolean(sessionData.session);
      setAuthSession(signedIn);
      if (signedIn) loadSessionRole(sessionData.session);

      // Clear OAuth callback hash after session has been read.
      if (window.location.hash.includes('access_token=')) {
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
      }
    });

    const { data: authSubscription } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setAuthSession(Boolean(session));
      if (session) {
        loadSessionRole(session);
      } else {
        setUserRole('guest');
      }
    });

    return () => authSubscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setCategory(categoryFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const checkoutState = new URLSearchParams(window.location.search).get('checkout');
    if (checkoutState === 'success') {
      setCart({});
      clearGuestCart();
      setNotification('Checkout complete. Thank you for shopping Pink Halo.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkoutState === 'cancel') {
      setNotification('Checkout was canceled. Your bag is still here.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveGuestCart(cart);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = category === 'All' || product.category === category;
      const searchMatch = [product.name, product.description, product.category]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [category, products, search]);

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, quantity]) => {
      const product = products.find((item) => item.id === id);
      return product ? { product, quantity } : null;
    }).filter(Boolean) as { product: Product; quantity: number }[];
  }, [cart, products]);

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function toggleCart() {
    setCartOpen((current) => !current);
  }

  function closeCart() {
    setCartOpen(false);
  }

  function addItemToCart(product: Product, quantity: number = 1, openDrawer: boolean = true) {
    if (product.stock <= 0 && !product.preorder) {
      setNotification('This item is currently out of stock.');
      return;
    }
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] || 0) + quantity
    }));
    if (openDrawer) setCartOpen(true);
  }

  function updateCartQuantity(productId: string, quantity: number) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const maxQuantity = product.preorder ? Math.max(product.stock, 10) : product.stock;
    const adjustedQuantity = Math.min(maxQuantity, Math.max(1, quantity));
    setCart((current) => ({
      ...current,
      [productId]: adjustedQuantity
    }));
  }

  function removeFromCart(productId: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  async function createCheckoutSession() {
    if (cartItems.length === 0) {
      setNotification('Your cart is empty.');
      return;
    }
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems.map((item) => ({
          name: item.product.name,
          amount: Math.round(item.product.price * 100),
          quantity: item.quantity,
          url: item.product.link,
          productId: item.product.id,
        })),
        guestSessionId: ensureGuestSession(),
        customerMode: authSession ? 'authenticated' : 'guest',
      })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setNotification(data.error || 'Unable to initiate checkout.');
      }
    } catch (error) {
      setNotification('Checkout service is not configured yet.');
    }
  }

  const isStaff = ['staff', 'manager', 'admin', 'superadmin'].includes(userRole.toLowerCase());

  const adminAccessGate = (
    <section className="max-w-xl mx-auto p-6 mt-10 rounded-2xl border border-pink-500/30 bg-neutral-900/80">
      <h2 className="text-2xl font-semibold text-white">Staff access required</h2>
      <p className="text-pink-100 mt-2">Sign in with Google through Supabase to manage inventory, users, and orders.</p>
      <div className="flex gap-3 mt-5">
        {!authSession ? (
          <button className="px-4 py-2 rounded-lg bg-pink-500 text-white" onClick={() => signInWithGoogle().catch(() => setNotification('Google sign in failed.'))}>
            Sign in with Google
          </button>
        ) : (
          <button className="px-4 py-2 rounded-lg bg-white/10 text-white" onClick={() => signOutSupabase().catch(() => undefined)}>
            Sign out
          </button>
        )}
      </div>
    </section>
  );

  const adminRoute = (page: JSX.Element) => (isStaff ? <AdminLayout>{page}</AdminLayout> : adminAccessGate);

  const storefrontPage = (
    <>
      {/* Simple, cute landing — only on the home route */}
      {isLandingRoute && (
        <>
          <AnimatedHero
            onShopNow={() => navigate('/shop')}
            onExploreCollections={() => {
              const element = document.getElementById('products');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <CategoryGrid />
        </>
      )}

      {/* Category header */}
      {!isLandingRoute && category !== 'All' && (
        <section className="bg-pink-50 border-b border-pink-100 py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-[0.35em] text-pink-500 mb-2">Pink Halo</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-pink-900">{category}</h1>
          </div>
        </section>
      )}

      {/* Search and filter */}
      <section className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-pink-100 py-3">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400">🔍</span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-pink-50 border border-pink-200 rounded-full text-pink-900 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            value={category}
            onChange={(event) => navigate(categoryRoute(event.target.value))}
            className="px-4 py-2.5 bg-pink-50 border border-pink-200 rounded-full text-pink-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Products grid */}
      <section id="products" className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length > 0 ? (
            <>
              <div className="mb-8 flex items-end justify-between flex-wrap gap-2">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-pink-900">
                  {category === 'All' ? 'Shop all' : category}
                </h2>
                <p className="text-sm text-pink-500">{filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addItemToCart} formatCurrency={formatCurrency} productMask={productMask} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-serif font-semibold text-pink-900 mb-2">
                {products.length === 0 ? 'New arrivals coming soon' : 'No products found'}
              </h3>
              <p className="text-pink-500">
                {products.length === 0 ? 'Check back shortly — the collection is being stocked.' : 'Try adjusting your search or category.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Cart drawer */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={closeCart}
        />
      )}

      <motion.aside
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-pink-100 z-50 flex flex-col shadow-2xl"
        initial={{ x: 500 }}
        animate={cartOpen ? { x: 0 } : { x: 520 }}
        transition={{ duration: 0.28 }}
        aria-modal="true"
        role="dialog"
      >
        <div className="p-6 border-b border-pink-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-serif font-bold text-pink-900">Your bag</h3>
            <p className="text-pink-500 text-sm mt-1">{cartItems.length} item{cartItems.length === 1 ? '' : 's'}</p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="p-2 hover:bg-pink-50 rounded-full transition-colors text-pink-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.product.id} className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-pink-900 text-sm">{item.product.name}</h4>
                      <p className="text-pink-600 font-bold mt-1">{formatCurrency(item.product.price)}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-pink-200 hover:bg-pink-100 text-pink-700"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-pink-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full border border-pink-200 hover:bg-pink-100 text-pink-700"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-auto text-pink-400 hover:text-pink-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-pink-500">Your bag is empty. Add something you love to get started.</p>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-pink-100 p-6 space-y-4">
            <div className="flex justify-between font-bold text-pink-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-pink-500 -mt-2">Shipping calculated at checkout. No account needed.</p>
            <button
              onClick={createCheckoutSession}
              className="w-full luxury-cta-gradient text-white font-semibold py-3 rounded-full shadow-lg hover:shadow-xl"
            >
              Checkout
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );

  return (
    <div className={isAdminRoute ? 'min-h-screen' : 'min-h-screen bg-white text-pink-900 flex flex-col'}>
      {!isAdminRoute && <Header cartCount={cartItems.length} onToggleCart={toggleCart} />}

      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white border border-pink-200 text-pink-900 px-5 py-3 rounded-xl shadow-lg flex items-center gap-4 max-w-md">
          <p className="text-sm">{notification}</p>
          <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss" className="text-pink-400 hover:text-pink-700">×</button>
        </div>
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={storefrontPage} />
          <Route path="/shop" element={storefrontPage} />
          <Route path="/category/:name" element={storefrontPage} />
          <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} products={products} onCheckout={createCheckoutSession} />} />
          <Route path="/:category/:slug" element={<ProductDetail products={products} onAdd={addItemToCart} setCartOpen={setCartOpen} formatCurrency={formatCurrency} />} />
          {/* ── Admin routes ── */}
          <Route path="/admin" element={adminRoute(<AdminDashboardPage />)} />
          <Route path="/admin/products" element={adminRoute(<AdminProductsPage />)} />
          <Route path="/admin/products/new" element={adminRoute(<AdminAddProductPage />)} />
          <Route path="/admin/products/:id/edit" element={adminRoute(<AdminEditProductPage />)} />
          <Route path="/admin/orders" element={adminRoute(<AdminOrdersPage />)} />
          <Route path="/admin/manufacturers" element={adminRoute(<AdminManufacturersPage />)} />
          <Route path="/admin/discounts" element={adminRoute(<AdminDiscountsPage />)} />
          <Route path="/admin/roles" element={adminRoute(<AdminRolesPage />)} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
