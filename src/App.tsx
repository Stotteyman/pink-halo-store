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
import { loadProducts, saveProducts, getCategories } from './lib/products';
import { fetchPublishedStorefrontProducts, signInWithGoogle, signOutSupabase, supabaseClient } from './lib/supabase';
import type { Product } from './lib/types';
import { clearGuestCart, ensureGuestSession, loadGuestCart, saveGuestCart } from './lib/session';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';

const categoryNames = ['Men', 'Women', 'Children', 'Pets'] as const;

type CategoryName = (typeof categoryNames)[number] | 'All';

function normalizeCategoryPath(pathname: string): CategoryName {
  const segment = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const found = categoryNames.find((name) => name.toLowerCase() === segment);
  return found ?? 'All';
}

function categoryRoute(category: string) {
  return category === 'All' ? '/' : `/${category.toLowerCase()}`;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function productRoute(product: Product) {
  return `/${product.category.toLowerCase()}/${slugify(product.name)}`;
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

const categoryThemes = {
  All: {
    title: 'Find the perfect fit across every collection',
    subtitle: 'Experience premium curation for men, women, children, and pets with rich styling and effortless browsing.',
    buttonLabel: 'Browse all categories',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    accent: ['#ff84cb', '#7b5cff'],
    features: [
      'Curated looks for every lifestyle',
      'Fresh apparel and accessories in one place',
      'Fast browsing with clear product detail'
    ]
  },
  Men: {
    title: 'Modern essentials for him',
    subtitle: 'Bold, refined looks built for confident everyday wear and effortless style.',
    buttonLabel: 'Shop the men’s collection',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
    accent: ['#74c7ff', '#1f4eab'],
    features: [
      'Tailored everyday pieces and sneakers',
      'Durable fabrics for daily wear',
      'Streamlined silhouettes with sharp detail'
    ]
  },
  Women: {
    title: 'Refined style for her',
    subtitle: 'Soft silhouettes, statement details, and polished pieces designed to elevate every outfit.',
    buttonLabel: 'Shop the women’s collection',
    image: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80',
    accent: ['#ff9cd6', '#ff5d7c'],
    features: [
      'Everyday essentials with elevated details',
      'Transitional styles for work and weekends',
      'Soft fabrics and contemporary fits'
    ]
  },
  Children: {
    title: 'Playful style for kids',
    subtitle: 'Bright, comfortable apparel and playful pieces built for every adventurous day.',
    buttonLabel: 'Shop the children’s collection',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    accent: ['#f8d64c', '#6bc1ff'],
    features: [
      'Soft, easy-care kidswear',
      'Bright colors and playful prints',
      'Durable layers for active play'
    ]
  },
  Pets: {
    title: 'Cozy accessories for pets',
    subtitle: 'Premium pet essentials with plush comfort, stylish flair, and trustworthy durability.',
    buttonLabel: 'Shop the pet collection',
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
    accent: ['#93f4d1', '#5ddeff'],
    features: [
      'Soft beds and comfortable pet gear',
      'Everyday essentials for cats and dogs',
      'Quality materials designed to last'
    ]
  }
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isImmersiveHome = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/admin');
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

    supabaseClient.auth.getSession().then(({ data: sessionData }) => {
      const signedIn = Boolean(sessionData.session);
      setAuthSession(signedIn);
      const role = sessionData.session?.user?.app_metadata?.role || 'customer';
      setUserRole(String(role));

      // Clear OAuth callback hash after session has been read.
      if (window.location.hash.includes('access_token=')) {
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
      }
    });

    const { data: authSubscription } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setAuthSession(Boolean(session));
        const nextRole = session?.user?.app_metadata?.role || 'customer';
      setUserRole(String(nextRole));
    });

    return () => authSubscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setCategory(normalizeCategoryPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const checkoutState = new URLSearchParams(window.location.search).get('checkout');
    if (checkoutState === 'success') {
      setCart({});
      clearGuestCart();
      setNotification('Checkout complete. Thank you for shopping Pink Halo.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkoutState === 'donation-success') {
      setNotification('Donation complete. Thank you for supporting the Pink Halo community.');
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

  const activeTheme = categoryThemes[category as keyof typeof categoryThemes] || categoryThemes.All;

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

  function updateProductStock(id: string, quantity: number) {
    setProducts((current) => {
      const nextProducts = current.map((product) =>
        product.id === id
          ? { ...product, stock: Math.max(0, Math.min(999, quantity)) }
          : product
      );
      return nextProducts;
    });
  }

  function addItemToCart(product: Product, quantity: number = 1, openLegacyDrawer: boolean = true) {
    if (product.stock <= 0 && !product.preorder) {
      setNotification('This item is currently out of stock.');
      return;
    }
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] || 0) + quantity
    }));
    if (openLegacyDrawer) setCartOpen(true);
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

  async function createDonationSession(amount: number) {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkoutType: 'donation',
        donationAmount: Math.round(amount * 100),
        guestSessionId: ensureGuestSession(),
        customerMode: authSession ? 'authenticated' : 'guest',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) throw new Error(data.error || 'Unable to start donation checkout.');
    window.location.href = data.url;
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
      {/* Animated Hero on Homepage */}
      {category === 'All' && (
        <>
          <AnimatedHero
            onShopWomen={() => navigate('/women')}
            onExploreCollections={() => {
              const element = document.getElementById('products');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Category Showcase */}
          <CategoryGrid
            onCategorySelect={(cat) => navigate(`/${cat.toLowerCase()}`)}
          />
        </>
      )}

      {/* Category-Specific Hero Section */}
      {category !== 'All' && (
        <section
          className="relative py-20 px-4 overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, ${activeTheme.accent[0]}22, ${activeTheme.accent[1]}33), url(${activeTheme.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <motion.div className="max-w-6xl mx-auto" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-pink-500/20 border border-pink-500/50 text-pink-300 text-sm font-semibold mb-4">
                {category === 'All' ? 'Shop every category' : `${category} collection`}
              </span>
              <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 text-white">{activeTheme.title}</h1>
              <p className="text-lg text-pink-100 mb-8 max-w-2xl">{activeTheme.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    const element = document.getElementById('products');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-3 luxury-cta-gradient text-white font-semibold rounded-full hover:shadow-xl transition-all"
                >
                  {activeTheme.buttonLabel}
                </button>
                <button onClick={() => navigate('/')} className="px-8 py-3 border-2 border-pink-300 text-white font-semibold rounded-full hover:bg-white/10 transition-all">
                  View All Products
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Search and Filter */}
      <section className="sticky top-20 z-40 backdrop-blur-md bg-gradient-to-b from-neutral-900/80 to-neutral-900/40 border-b border-pink-500/20 py-4">
        <div className="max-w-6xl mx-auto px-4 flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-300">🔍</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            value={category}
            onChange={(event) => navigate(categoryRoute(event.target.value))}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-400"
          >
            <option value="All">All Categories</option>
            {getCategories().map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length > 0 ? (
            <>
              <motion.div className="mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-4xl font-serif font-bold mb-2 text-white">
                  {category === 'All' ? 'All Products' : `${category} Collection`}
                </h2>
                <p className="text-pink-200">Showing {filteredProducts.length} items</p>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addItemToCart} formatCurrency={formatCurrency} productMask={productMask} />
                ))}
              </div>
            </>
          ) : (
            <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-2xl font-serif font-semibold text-white mb-4">No products found</h3>
              <p className="text-pink-200">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Cart Drawer */}
      {cartOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCart}
        />
      )}

      <motion.aside
        className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-neutral-900 to-neutral-950 border-l border-pink-500/20 z-50 flex flex-col"
        initial={{ opacity: 0, x: 500 }}
        animate={cartOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: 500 }}
        transition={{ duration: 0.3 }}
        aria-modal="true"
        role="dialog"
      >
        {/* Cart Header */}
        <div className="p-6 border-b border-pink-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-serif font-bold text-white">Shopping Cart</h3>
              <p className="text-pink-200 text-sm mt-2">{cartItems.length} item{cartItems.length === 1 ? '' : 's'}</p>
            </div>
            <motion.button
              type="button"
              onClick={closeCart}
              aria-label="Close cart"
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length > 0 ? (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <motion.div
                  key={item.product.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex gap-4">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-sm">{item.product.name}</h4>
                      <p className="text-pink-300 font-bold mt-2">{formatCurrency(item.product.price)}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <motion.button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 hover:bg-white/10 rounded disabled:opacity-50"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          −
                        </motion.button>
                        <span className="w-8 text-center text-white">{item.quantity}</span>
                        <motion.button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-1 hover:bg-white/10 rounded disabled:opacity-50"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          +
                        </motion.button>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-pink-300 hover:text-pink-400 text-lg"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ✕
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="w-16 h-16 text-pink-300/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 7m10 0h2m-2 0h-2m2 0a1 1 0 11-2 0 1 1 0 012 0zm-6 0a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
              <p className="text-pink-200 text-center">Your cart is empty. Add an item to get started.</p>
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-pink-500/20 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Subtotal:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Shipping:</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between font-bold text-white mb-4">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <motion.button
                onClick={createCheckoutSession}
                className="w-full luxury-cta-gradient text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Proceed to Checkout
              </motion.button>
            </div>
          </div>
        )}
      </motion.aside>

    </>
  );

  return (
    <div className={isAdminRoute ? 'min-h-screen' : 'min-h-screen bg-neutral-900 text-white'}>
      {!isImmersiveHome && !isAdminRoute && <Header cartCount={cartItems.length} onToggleCart={toggleCart} />}

      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-neutral-900 border border-pink-500/40 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-4 max-w-md">
          <p className="text-sm">{notification}</p>
          <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss" className="text-white/60 hover:text-white">×</button>
        </div>
      )}

      <main>
        <Routes>
          <Route path="/" element={<HomePage products={products} cart={cart} onAddToCart={(product) => addItemToCart(product, 1, false)} onUpdateQuantity={updateCartQuantity} onRemoveFromCart={removeFromCart} onCheckout={createCheckoutSession} onDonate={createDonationSession} />} />
          <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} products={products} />} />
          <Route path="/checkout" element={<CheckoutPage cart={cart} products={products} />} />
          <Route path="/men" element={storefrontPage} />
          <Route path="/women" element={storefrontPage} />
          <Route path="/children" element={storefrontPage} />
          <Route path="/pets" element={storefrontPage} />
          <Route path="/:category/:slug" element={<ProductDetail products={products} onAdd={addItemToCart} setCartOpen={setCartOpen} formatCurrency={formatCurrency} />} />
          {/* ── Admin routes ── */}
          <Route path="/admin" element={adminRoute(<AdminDashboardPage />)} />
          <Route path="/admin/products" element={adminRoute(<AdminProductsPage />)} />
          <Route path="/admin/products/new" element={adminRoute(<AdminAddProductPage />)} />
          <Route path="/admin/products/:id/edit" element={adminRoute(<AdminEditProductPage />)} />
          <Route path="/admin/orders" element={adminRoute(<AdminOrdersPage />)} />
          <Route path="/admin/manufacturers" element={adminRoute(<AdminManufacturersPage />)} />
          <Route path="/admin/discounts" element={adminRoute(<AdminDiscountsPage />)} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isImmersiveHome && !isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
