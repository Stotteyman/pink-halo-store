import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import Header from './components/Header';
import AnimatedHero from './components/AnimatedHero';
import CategoryGrid from './components/CategoryGrid';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import NotFound from './components/NotFound';
import Footer from './components/Footer';
import { loadProducts, saveProducts, getCategories } from './lib/products';
import { loadSubscribers, saveSubscribers, saveSubscriberToSupabase, fetchSubscribersFromSupabase, validateEmail } from './lib/newsletter';
import { fetchProductsFromSupabase, saveProductToSupabase, supabaseClient } from './lib/supabase';
import type { Product } from './lib/types';

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

const adminSecret = import.meta.env.VITE_ADMIN_SECRET || 'pink-halo-admin';

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
  const [products, setProducts] = useState<Product[]>(loadProducts());
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [scrapeResult, setScrapeResult] = useState<Partial<Product> | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('Discover the latest Pink Halo arrivals!');
  const [campaignBody, setCampaignBody] = useState('A new item is available now — shop our latest collection at Pink Halo Co. Click to explore.');
  const [autoEmailOnAdd, setAutoEmailOnAdd] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [activeTool, setActiveTool] = useState<'dashboard' | 'inventory' | 'productUpload' | 'subscribers'>('dashboard');
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [emailNotification, setEmailNotification] = useState<string | null>(null);

  const adminTools = [
    { id: 'dashboard', label: 'Dashboard', description: 'Review inventory metrics and choose the tool you need.' },
    { id: 'inventory', label: 'Inventory manager', description: 'Update stock counts and keep product data in sync with Supabase.' },
    { id: 'productUpload', label: 'Product ingestion', description: 'Add supplier links, preview product details, and save new items.' },
    { id: 'subscribers', label: 'Subscribers', description: 'Manage newsletter lists, campaign content, and subscriber outreach.' }
  ] as const;

  useEffect(() => {
    const storedCart = localStorage.getItem('pink-halo-cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
    setProducts(loadProducts());
    const storedSubscribers = loadSubscribers();
    if (storedSubscribers.length) {
      setSubscribers(storedSubscribers);
    }

    async function loadRemoteData() {
      if (!supabaseClient) return;
      setSupabaseConnected(true);
      const remoteProducts = await fetchProductsFromSupabase();
      if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
        setProducts(remoteProducts as Product[]);
      }
      const remoteSubscribers = await fetchSubscribersFromSupabase();
      if (Array.isArray(remoteSubscribers) && remoteSubscribers.length > 0) {
        setSubscribers(remoteSubscribers.map((item) => item.email).filter(Boolean));
      }
    }

    loadRemoteData();

    if (location.pathname === '/admin') {
      setIsAdmin(window.location.hostname === 'localhost');
    }
  }, []);

  useEffect(() => {
    setCategory(normalizeCategoryPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveSubscribers(subscribers);
  }, [subscribers]);

  useEffect(() => {
    if (!supabaseClient) return;
    async function backupRemoteProducts() {
      const { error } = await supabaseClient.from('products').upsert(products);
      if (error) {
        console.error('Supabase backup error', error);
      }
    }
    backupRemoteProducts().catch(() => undefined);
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pink-halo-cart', JSON.stringify(cart));
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

  async function saveProductChange(product: Product) {
    if (!supabaseClient) return;
    await saveProductToSupabase(product);
  }

  function updateProductStock(id: string, quantity: number) {
    setProducts((current) => {
      const nextProducts = current.map((product) =>
        product.id === id
          ? { ...product, stock: Math.max(0, Math.min(999, quantity)) }
          : product
      );
      const updated = nextProducts.find((product) => product.id === id);
      if (updated) {
        saveProductChange(updated).catch(() => undefined);
      }
      return nextProducts;
    });
  }

  function addItemToCart(product: Product, quantity: number = 1) {
    if (product.stock <= 0) {
      setNotification('This item is currently out of stock.');
      return;
    }
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] || 0) + quantity
    }));
    setCartOpen(true);
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

    const adjustedQuantity = Math.min(product.stock, Math.max(1, quantity));
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

  function addSubscriber() {
    const email = subscriberEmail.trim().toLowerCase();
    if (!validateEmail(email)) {
      setNewsletterStatus('Enter a valid email address.');
      return;
    }
    if (subscribers.includes(email)) {
      setNewsletterStatus('This email is already subscribed.');
      return;
    }
    const next = [...subscribers, email];
    setSubscribers(next);
    setSubscriberEmail('');
    setNewsletterStatus('You are subscribed to Pink Halo updates.');
    saveSubscriberToSupabase(email).catch(() => undefined);
  }

  function removeSubscriber(email: string) {
    setSubscribers((current) => current.filter((item) => item !== email));
  }

  async function sendEmailCampaign() {
    if (!subscribers.length) {
      setEmailNotification('No subscribers are available for this campaign.');
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: subscribers,
          subject: campaignSubject,
          html: `<h1>${campaignSubject}</h1><p>${campaignBody}</p><p><a href=\"https://pinkhalo.co\">Shop now at PinkHalo.co</a></p>`,
          text: `${campaignSubject}\n\n${campaignBody}\n\nShop now at https://pinkhalo.co`
        })
      });
      const result = await response.json();
      if (result.success) {
        setEmailNotification('Campaign email sent successfully.');
      } else {
        setEmailNotification(result.error || 'Failed to send campaign email.');
      }
    } catch (error) {
      setEmailNotification('Unable to send email campaign.');
    }
  }

  async function sendProductAnnouncement(product: Product) {
    if (!autoEmailOnAdd || !subscribers.length) {
      return;
    }

    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: subscribers,
          subject: `New Pink Halo arrival: ${product.name}`,
          html: `<h1>${product.name}</h1><p>${product.description}</p><p><strong>Price:</strong> ${formatCurrency(product.price)}</p><p><a href=\"${product.link}\" target=\"_blank\">View item</a></p>`,
          text: `${product.name}\n${product.description}\nPrice: ${formatCurrency(product.price)}\n${product.link}`
        })
      });
      setEmailNotification(`Announcement sent for ${product.name}.`);
    } catch (error) {
      setEmailNotification('Failed to send the product announcement email.');
    }
  }

  async function createCheckoutSession() {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      setNotification('Missing Stripe publishable key. Configure VITE_STRIPE_PUBLISHABLE_KEY in your environment.');
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
          url: item.product.link
        })) })
      });

      const data = await response.json();
      if (data.sessionId) {
        const stripe = await loadStripe(publishableKey);
        if (!stripe) {
          setNotification('Unable to initialize Stripe.');
          return;
        }
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) {
          setNotification(error.message || 'Unable to redirect to Stripe checkout.');
        }
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setNotification(data.error || 'Unable to initiate checkout.');
      }
    } catch (error) {
      setNotification('Checkout service is not configured yet.');
    }
  }

  async function handleScrape() {
    if (!linkInput.trim()) {
      setScrapeStatus('Enter a valid product URL to begin scraping.');
      return;
    }
    setScrapeStatus('Fetching product details...');
    try {
      const response = await fetch('/api/fetch-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkInput.trim() })
      });
      const payload = await response.json();
      if (payload.error) {
        setScrapeStatus(payload.error);
        setScrapeResult(null);
        return;
      }
      setScrapeResult({
        id: payload.id || payload.name?.toLowerCase().replace(/\s+/g, '-'),
        name: payload.name || '',
        description: payload.description || '',
        price: payload.price || 0,
        imageUrl: payload.imageUrl || '',
        link: linkInput.trim(),
        category: payload.category || 'Women',
        stock: payload.stock ?? 0,
        profitMargin: payload.profitMargin ?? 0
      });
      setScrapeStatus('Preview ready. Adjust details and save to the catalog.');
    } catch (error) {
      setScrapeStatus('Unable to fetch product details from the link.');
      setScrapeResult(null);
    }
  }

  async function handleSaveScrape() {
    if (!scrapeResult || !scrapeResult.name) {
      setScrapeStatus('Provide valid product details before saving.');
      return;
    }
    if (!scrapeResult.price || scrapeResult.price <= 0) {
      setScrapeStatus('Please enter a valid price for the new product.');
      return;
    }
    if (!scrapeResult.link) {
      setScrapeStatus('Product link is required to save the item.');
      return;
    }
    const newProduct: Product = {
      id: scrapeResult.id || `item-${Date.now()}`,
      category: scrapeResult.category || 'Women',
      name: scrapeResult.name,
      description: scrapeResult.description || 'Shop the latest curated favorite.',
      price: scrapeResult.price,
      imageUrl: scrapeResult.imageUrl || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      link: scrapeResult.link,
      stock: scrapeResult.stock ?? 0,
      profitMargin: scrapeResult.profitMargin ?? 0
    };
    setProducts((current) => [newProduct, ...current]);
    setScrapeResult(null);
    setLinkInput('');
    setScrapeStatus('Product added to the storefront successfully.');
    await saveProductToSupabase(newProduct).catch(() => undefined);
    await sendProductAnnouncement(newProduct);
  }

  function activateAdmin() {
    if (adminKey === adminSecret) {
      setIsAdmin(true);
      setNotification('Admin mode enabled for localhost.');
    } else {
      setNotification('Invalid admin key.');
    }
  }

  const inventory = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        acc.totalStock += product.stock;
        acc.productCount += 1;
        acc.totalValue += product.price * product.stock;
        return acc;
      },
      { totalStock: 0, productCount: 0, totalValue: 0 }
    );
  }, [products]);

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
    <div className="min-h-screen bg-neutral-900 text-white">
      <Header cartCount={cartItems.length} onToggleCart={toggleCart} />

      <main>
        <Routes>
          <Route path="/" element={storefrontPage} />
          <Route path="/men" element={storefrontPage} />
          <Route path="/women" element={storefrontPage} />
          <Route path="/children" element={storefrontPage} />
          <Route path="/pets" element={storefrontPage} />
          <Route path="/:category/:slug" element={<ProductDetail products={products} onAdd={addItemToCart} setCartOpen={setCartOpen} formatCurrency={formatCurrency} />} />
          <Route path="/admin" element={
            <section className="section container">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1 1 520px' }}>
                  <h2 className="title">Admin dashboard</h2>
                  <p className="subtitle">Manage inventory, product ingestion, and subscriber workflows from one backed-up admin workspace.</p>
                </div>
                {!isAdmin && (
                  <div style={{ flex: '1 1 280px', minWidth: 280 }}>
                    <label className="badge">Admin access</label>
                    <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="input" placeholder="Admin key" />
                    <button className="primary" style={{ width: '100%', marginTop: '1rem' }} onClick={activateAdmin}>Unlock admin</button>
                    <p style={{ marginTop: '0.85rem', color: '#b8b8c2' }}>Admin mode also activates automatically on localhost.</p>
                  </div>
                )}
              </div>

              {notification && (
                <div className="card" style={{ marginTop: '1.5rem', borderColor: '#ff8ac7' }}>
                  {notification}
                </div>
              )}

              <div className="section card" style={{ marginTop: '1.5rem' }}>
                <div className="grid grid-3" style={{ gap: '1rem' }}>
                  <div>
                    <p className="badge">Catalog</p>
                    <h3>{products.length} products</h3>
                  </div>
                  <div>
                    <p className="badge">Total stock</p>
                    <h3>{inventory.totalStock}</h3>
                  </div>
                  <div>
                    <p className="badge">Inventory value</p>
                    <h3>{formatCurrency(inventory.totalValue)}</h3>
                  </div>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 220px' }}>
                    <p className="badge">Supabase sync</p>
                    <p style={{ marginTop: '.5rem', color: '#d8d8e8' }}>{supabaseConnected ? 'Connected and backing up product data' : 'Supabase is not configured. Local changes are stored in browser storage.'}</p>
                  </div>
                  <div style={{ flex: '1 1 220px' }}>
                    <p className="badge">Active tool</p>
                    <p style={{ marginTop: '.5rem', color: '#d8d8e8' }}>{adminTools.find((tool) => tool.id === activeTool)?.label}</p>
                  </div>
                </div>
              </div>

              <div className="section card" style={{ marginTop: '1.5rem' }}>
                <p className="badge">Tools list</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  {adminTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTool(tool.id)}
                      style={{
                        padding: '0.9rem 1rem',
                        borderRadius: 12,
                        border: activeTool === tool.id ? '1px solid #fff' : '1px solid rgba(255,255,255,0.18)',
                        background: activeTool === tool.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
                <p style={{ marginTop: '1rem', color: '#d8d8e8' }}>{adminTools.find((tool) => tool.id === activeTool)?.description}</p>
              </div>

              {activeTool === 'dashboard' && (
                <div className="section card" style={{ marginTop: '1.5rem' }}>
                  <h3>Dashboard overview</h3>
                  <p className="subtitle">View real product metrics and quickly jump to the tools you need.</p>
                  <div className="grid grid-4" style={{ gap: '1rem', marginTop: '1rem' }}>
                    {adminTools.map((tool) => (
                      <div key={tool.id} className="card" style={{ padding: '1rem' }}>
                        <p className="badge">{tool.label}</p>
                        <p style={{ marginTop: '0.75rem', color: '#d8d8e8' }}>{tool.description}</p>
                        <button className="secondary" style={{ marginTop: '1rem' }} onClick={() => setActiveTool(tool.id)}>
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'inventory' && (
                <div className="section card" style={{ marginTop: '1.5rem' }}>
                  <h3>Inventory manager</h3>
                  <p className="subtitle">Update stock counts, synchronize changes, and keep all product data backed up.</p>
                  {products.length ? (
                    <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
                      {products.map((product) => (
                        <div key={product.id} className="card" style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                            <div>
                              <strong>{product.name}</strong>
                              <p style={{ marginTop: '0.5rem', color: '#c5c8da' }}>{product.category}</p>
                              <p style={{ marginTop: '0.5rem', color: '#d8d8e8' }}>{formatCurrency(product.price)} each</p>
                            </div>
                            <div style={{ minWidth: 110 }}>
                              <label className="badge">Stock</label>
                              <input className="input" type="number" value={product.stock} onChange={(e) => updateProductStock(product.id, Number(e.target.value))} style={{ width: '100%', marginTop: '0.5rem' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ marginTop: '1rem', color: '#c5c8da' }}>No products are available to manage yet.</p>
                  )}
                </div>
              )}

              {activeTool === 'productUpload' && (
                <div className="section card" style={{ marginTop: '1.5rem' }}>
                  <h3>Product ingestion</h3>
                  <p className="subtitle">Add supplier links, preview scraped details, and publish real product data.</p>
                  <label className="badge">Product URL</label>
                  <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} className="input" placeholder="Paste product page URL" />
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <button className="primary" onClick={handleScrape}>Fetch product details</button>
                    <button className="secondary" onClick={() => { setLinkInput(''); setScrapeResult(null); setScrapeStatus(''); }}>Reset</button>
                  </div>
                  {scrapeStatus && <p style={{ marginTop: '1rem', color: '#d8d8e8' }}>{scrapeStatus}</p>}
                  {scrapeResult && (
                    <div className="card" style={{ marginTop: '1.5rem' }}>
                      <div className="grid grid-2" style={{ alignItems: 'start', gap: '1rem' }}>
                        <div>
                          <label className="badge">Preview</label>
                          <input className="input" value={scrapeResult.name} onChange={(e) => setScrapeResult({ ...scrapeResult, name: e.target.value })} />
                          <textarea className="textarea" rows={4} value={scrapeResult.description} onChange={(e) => setScrapeResult({ ...scrapeResult, description: e.target.value })} style={{ marginTop: '1rem' }} />
                          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                            <input className="input" type="number" value={scrapeResult.price ?? 0} onChange={(e) => setScrapeResult({ ...scrapeResult, price: Number(e.target.value) })} placeholder="Price" />
                            <input className="input" value={scrapeResult.imageUrl} onChange={(e) => setScrapeResult({ ...scrapeResult, imageUrl: e.target.value })} placeholder="Image URL" />
                            <select className="select" value={scrapeResult.category} onChange={(e) => setScrapeResult({ ...scrapeResult, category: e.target.value as Product['category'] })}>
                              {getCategories().map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                            </select>
                            <input className="input" type="number" value={scrapeResult.stock ?? 0} onChange={(e) => setScrapeResult({ ...scrapeResult, stock: Number(e.target.value) })} placeholder="Stock" />
                          </div>
                        </div>
                        <div className="product-image" style={{ minHeight: 260 }}>
                          <img src={scrapeResult.imageUrl || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'} alt="Preview" />
                        </div>
                      </div>
                      <button className="primary" style={{ marginTop: '1.25rem' }} onClick={handleSaveScrape}>Save new product</button>
                    </div>
                  )}
                </div>
              )}

              {activeTool === 'subscribers' && (
                <div className="section card" style={{ marginTop: '1.5rem' }}>
                  <h3>Subscribers</h3>
                  <p className="subtitle">Manage your email list and send campaigns only when your data is real.</p>
                  <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <input
                        className="input"
                        placeholder="subscriber@example.com"
                        value={subscriberEmail}
                        onChange={(e) => setSubscriberEmail(e.target.value)}
                      />
                      <button className="primary" onClick={addSubscriber}>Add subscriber</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <input
                        type="checkbox"
                        checked={autoEmailOnAdd}
                        onChange={(e) => setAutoEmailOnAdd(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span>Automatically email subscribers when a new product is added</span>
                    </div>
                    <div>
                      <p className="badge">Campaign editor</p>
                      <input className="input" value={campaignSubject} onChange={(e) => setCampaignSubject(e.target.value)} placeholder="Email subject" />
                      <textarea className="textarea" rows={4} value={campaignBody} onChange={(e) => setCampaignBody(e.target.value)} style={{ marginTop: '1rem' }} />
                      <button className="primary" style={{ marginTop: '1rem' }} onClick={sendEmailCampaign}>Send campaign now</button>
                      {emailNotification && <p style={{ marginTop: '1rem', color: '#d8d8e8' }}>{emailNotification}</p>}
                    </div>
                    <div className="card" style={{ padding: '1rem' }}>
                      <p className="badge">Subscriber list</p>
                      {subscribers.length ? (
                        <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.2rem', color: '#d8d8e8' }}>
                          {subscribers.map((subscriber) => (
                            <li key={subscriber} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <span>{subscriber}</span>
                              <button className="secondary" onClick={() => removeSubscriber(subscriber)}>Remove</button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ marginTop: '0.75rem', color: '#c5c8da' }}>No subscribers yet. Add emails to begin your list.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer container">
        <p>Pink Halo Co. — Shop exclusive products and limited-time offers now.</p>
      </footer>
    </div>
  );
}

export default App;
