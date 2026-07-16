import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import AnimatedHero from './components/AnimatedHero';
import CategoryGrid from './components/CategoryGrid';
import NewArrivals from './components/NewArrivals';
import EditorialBand from './components/EditorialBand';
import NewsletterBand from './components/NewsletterBand';
import TrustBadges from './components/TrustBadges';
import MobileTabBar from './components/MobileTabBar';
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
import WishlistPage from './pages/WishlistPage';
import AccountPage from './pages/AccountPage';
import RewardsPage from './pages/RewardsPage';
import ReferPage from './pages/ReferPage';
import InfoPage from './pages/InfoPage';
import { loadProducts, saveProducts, getCategories } from './lib/products';
import { fetchCurrentUserRole, fetchPublishedStorefrontProducts, signInWithGoogle, signOutSupabase, supabaseClient } from './lib/supabase';
import type { Product } from './lib/types';
import { clearGuestCart, ensureGuestSession, loadGuestCart, saveGuestCart } from './lib/session';
import { useWishlist } from './lib/wishlist';
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function productMask(text: string) {
  return text.length > 85 ? `${text.slice(0, 82)}...` : text;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLandingRoute = location.pathname === '/';
  const isNewRoute = location.pathname === '/new';
  const [products, setProducts] = useState<Product[]>(loadProducts());
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState(false);
  const [userRole, setUserRole] = useState<string>('guest');
  const wishlistIds = useWishlist();

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
        if (data?.current_role) { setUserRole(String(data.current_role)); return; }
      } catch { /* fall back to metadata */ }
      const fallbackRole = session.user?.app_metadata?.role || 'customer';
      setUserRole(String(fallbackRole));
    };

    supabaseClient.auth.getSession().then(({ data: sessionData }) => {
      const signedIn = Boolean(sessionData.session);
      setAuthSession(signedIn);
      if (signedIn) loadSessionRole(sessionData.session);
      if (window.location.hash.includes('access_token=')) {
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
      }
    });

    const { data: authSubscription } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setAuthSession(Boolean(session));
      if (session) loadSessionRole(session);
      else setUserRole('guest');
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

  useEffect(() => { saveProducts(products); }, [products]);
  useEffect(() => { saveGuestCart(cart); }, [cart]);

  const matchesSearch = (product: Product) =>
    [product.name, product.description, product.category].join(' ').toLowerCase().includes(search.toLowerCase());

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      let inScope: boolean;
      if (isNewRoute) {
        inScope = (product.tags || []).includes('new');
      } else if (category === 'Sale') {
        inScope = product.compareAtPrice != null || product.category === 'Sale';
      } else if (category === 'Bottoms') {
        inScope = product.category === 'Bottoms' || (product.tags || []).includes('bottoms');
      } else if (category === 'Sets') {
        inScope = product.category === 'Sets' || (product.tags || []).includes('sets');
      } else {
        inScope = category === 'All' || product.category === category;
      }
      return inScope && matchesSearch(product);
    });
    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [category, products, search, isNewRoute, sort]);

  const newArrivals = useMemo(() => {
    const tagged = products.filter((p) => (p.tags || []).includes('new'));
    return (tagged.length >= 4 ? tagged : products).slice(0, 12);
  }, [products]);

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, quantity]) => {
      const product = products.find((item) => item.id === id);
      return product ? { product, quantity } : null;
    }).filter(Boolean) as { product: Product; quantity: number }[];
  }, [cart, products]);

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function toggleCart() { setCartOpen((current) => !current); }
  function closeCart() { setCartOpen(false); }

  function addItemToCart(product: Product, quantity: number = 1, openDrawer: boolean = true) {
    if (product.stock <= 0 && !product.preorder) {
      setNotification('This item is currently out of stock.');
      return;
    }
    setCart((current) => ({ ...current, [product.id]: (current[product.id] || 0) + quantity }));
    if (openDrawer) setCartOpen(true);
  }

  function updateCartQuantity(productId: string, quantity: number) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (quantity <= 0) { removeFromCart(productId); return; }
    const maxQuantity = product.preorder ? Math.max(product.stock, 10) : product.stock;
    const adjustedQuantity = Math.min(maxQuantity, Math.max(1, quantity));
    setCart((current) => ({ ...current, [productId]: adjustedQuantity }));
  }

  function removeFromCart(productId: string) {
    setCart((current) => { const next = { ...current }; delete next[productId]; return next; });
  }

  async function createCheckoutSession() {
    if (cartItems.length === 0) { setNotification('Your cart is empty.'); return; }
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
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
      if (data.url) window.location.href = data.url;
      else setNotification(data.error || 'Unable to initiate checkout.');
    } catch {
      setNotification('Checkout service is not configured yet.');
    }
  }

  const isStaff = ['staff', 'manager', 'admin', 'superadmin'].includes(userRole.toLowerCase());

  const adminAccessGate = (
    <section className="max-w-xl mx-auto p-8 my-14 border border-hairline bg-white text-center">
      <p className="overline text-gold mb-3">Pink Halo Co.</p>
      <h2 className="font-serif font-medium text-3xl text-ink">Staff access required</h2>
      <p className="text-[15px] text-ink-soft mt-3">Sign in with Google through Supabase to manage inventory, users, and orders.</p>
      <div className="flex justify-center gap-3 mt-7">
        {!authSession ? (
          <button className="btn-primary" onClick={() => signInWithGoogle().catch(() => setNotification('Google sign in failed.'))}>
            Sign in with Google
          </button>
        ) : (
          <button className="btn-ghost" onClick={() => signOutSupabase().catch(() => undefined)}>
            Sign out
          </button>
        )}
      </div>
    </section>
  );

  const adminRoute = (page: JSX.Element) => (isStaff ? <AdminLayout>{page}</AdminLayout> : adminAccessGate);

  const listHeading = isNewRoute ? 'New In' : category === 'All' ? 'Shop All' : category;

  const storefrontPage = (
    <>
      {isLandingRoute ? (
        <>
          <AnimatedHero
            onShopNewArrivals={() => navigate('/new')}
            onShopBestSellers={() => navigate('/shop')}
          />
          <CategoryGrid />
          <NewArrivals title="New Arrivals" products={newArrivals} formatCurrency={formatCurrency} viewAllTo="/new" />
          <EditorialBand />
          <TrustBadges />
          <NewsletterBand />
        </>
      ) : (
        <>
          {/* Category header */}
          <section className="bg-blush border-b border-hairline py-10 lg:py-14 px-4 sm:px-6 text-center">
            <div className="max-w-7xl mx-auto">
              <p className="overline text-gold mb-3">Pink Halo Co.</p>
              <h1 className="font-serif font-medium text-ink text-4xl md:text-5xl leading-none">{listHeading}</h1>
            </div>
          </section>

          {/* Search and filter */}
          <section className="sticky top-[72px] z-30 bg-cream/95 backdrop-blur border-b border-hairline">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 flex items-center gap-2.5 border-b border-hairline sm:border-0">
                <svg className="w-4 h-4 text-rose flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
                <input
                  className="w-full bg-transparent border-0 outline-none py-2 text-sm text-ink placeholder:text-ink-soft/70"
                  placeholder="Search the collection..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={isNewRoute ? 'All' : category}
                  onChange={(event) => navigate(categoryRoute(event.target.value))}
                  className="bg-white border border-hairline px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink outline-none focus:border-rose"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                  className="bg-white border border-hairline px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink outline-none focus:border-rose"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name: A–Z</option>
                </select>
                <p className="hidden md:block text-[11px] uppercase tracking-[0.14em] text-ink-soft whitespace-nowrap">
                  {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </section>

          {/* Products grid */}
          <section id="products" className="py-12 lg:py-16 px-4 sm:px-6 bg-cream">
            <div className="max-w-7xl mx-auto">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={addItemToCart} formatCurrency={formatCurrency} productMask={productMask} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24">
                  <p className="overline text-gold mb-4">Pink Halo Co.</p>
                  <h3 className="font-serif font-medium text-ink text-3xl mb-3">
                    {category === 'Sale' ? 'No sales running right now' : products.length === 0 ? 'New arrivals coming soon' : 'No products found'}
                  </h3>
                  <p className="text-[15px] text-ink-soft">
                    {category === 'Sale' ? 'Check back soon — new offers drop regularly.' : products.length === 0 ? 'Check back shortly — the collection is being stocked.' : 'Try adjusting your search or category.'}
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );

  // Rendered at the app level (not inside storefrontPage) so Add to Bag can
  // open the drawer from any storefront route, including product detail pages.
  const cartDrawer = (
    <>
      {cartOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={closeCart} />}

      <motion.aside
        className="fixed right-0 top-0 h-full w-full max-w-md bg-cream border-l border-hairline z-50 flex flex-col shadow-2xl"
        initial={{ x: 500 }}
        animate={cartOpen ? { x: 0 } : { x: 520 }}
        transition={{ duration: 0.28 }}
        aria-modal="true"
        role="dialog"
      >
        <div className="px-6 py-5 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="font-serif font-medium text-2xl text-ink">Your bag</h3>
            <p className="overline !tracking-[0.24em] text-gold mt-1">{cartItems.length} item{cartItems.length === 1 ? '' : 's'}</p>
          </div>
          <button type="button" onClick={closeCart} aria-label="Close cart" className="p-2 hover:bg-blush rounded-full transition-colors text-ink">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length > 0 ? (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.product.id} className="bg-white border border-hairline p-3.5">
                  <div className="flex gap-4">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-20 h-24 object-cover bg-shell" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gold">{item.product.category}</p>
                      <h4 className="font-serif text-[15px] text-ink leading-snug mt-0.5 truncate">{item.product.name}</h4>
                      <p className="text-[13px] font-semibold text-ink mt-1">{formatCurrency(item.product.price)}</p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <button type="button" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} aria-label="Decrease quantity" className="w-7 h-7 border border-hairline hover:border-rose text-ink transition-colors">−</button>
                        <span className="w-8 text-center text-sm text-ink">{item.quantity}</span>
                        <button type="button" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} aria-label="Increase quantity" className="w-7 h-7 border border-hairline hover:border-rose text-ink transition-colors">+</button>
                        <button onClick={() => removeFromCart(item.product.id)} className="ml-auto text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft hover:text-rose transition-colors">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <span className="text-gold text-2xl" aria-hidden="true">✦</span>
              <p className="text-[15px] text-ink-soft max-w-[240px]">Your bag is empty. Add something you love to get started.</p>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-hairline p-6 space-y-4 bg-white">
            <div className="flex justify-between items-baseline">
              <span className="overline !tracking-[0.24em] text-ink-soft">Total</span>
              <span className="font-serif font-medium text-2xl text-ink">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-ink-soft -mt-2">Shipping calculated at checkout. No account needed.</p>
            <button onClick={createCheckoutSession} className="btn-primary w-full">Checkout</button>
          </div>
        )}
      </motion.aside>
    </>
  );

  return (
    <div className={isAdminRoute ? 'min-h-screen' : 'min-h-screen bg-cream text-ink flex flex-col'}>
      {!isAdminRoute && (
        <Header
          cartCount={cartItems.length}
          wishlistCount={wishlistIds.length}
          search={search}
          onSearchChange={setSearch}
          onToggleCart={toggleCart}
        />
      )}

      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white border border-hairline text-ink px-5 py-3.5 shadow-[0_20px_50px_rgba(120,60,80,0.16)] flex items-center gap-4 max-w-md">
          <span className="text-gold" aria-hidden="true">✦</span>
          <p className="text-sm">{notification}</p>
          <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss" className="text-ink-soft hover:text-rose text-lg leading-none">×</button>
        </div>
      )}

      <main className={isAdminRoute ? 'flex-1' : 'flex-1 pb-16 lg:pb-0'}>
        <Routes>
          <Route path="/" element={storefrontPage} />
          <Route path="/shop" element={storefrontPage} />
          <Route path="/new" element={storefrontPage} />
          <Route path="/category/:name" element={storefrontPage} />
          <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} products={products} onCheckout={createCheckoutSession} />} />
          <Route path="/wishlist" element={<WishlistPage products={products} onAdd={addItemToCart} formatCurrency={formatCurrency} />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/refer" element={<ReferPage />} />
          <Route path="/help/:slug" element={<InfoPage />} />
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

      {!isAdminRoute && cartDrawer}
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <MobileTabBar />}
    </div>
  );
}

export default App;
