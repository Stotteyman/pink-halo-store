import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { loadProducts, saveProducts, getCategories } from './lib/products';
import { loadSubscribers, saveSubscribers, saveSubscriberToSupabase, validateEmail } from './lib/newsletter';
import type { Product } from './lib/types';

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
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    accent: ['#ff84cb', '#7b5cff'],
    features: [
      'Elegant interface with smooth interactions',
      'Cross-category styling for every lifestyle',
      'Fast checkout and polished product discovery'
    ]
  },
  Men: {
    title: 'Modern essentials for him',
    subtitle: 'Bold, refined looks built for confident everyday wear and effortless style.',
    buttonLabel: 'Shop the men’s collection',
    image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1200&q=80',
    accent: ['#74c7ff', '#1f4eab'],
    features: [
      'Tailored streetwear and sharp layering',
      'Durable materials with modern accents',
      'Performance pieces with a premium feel'
    ]
  },
  Women: {
    title: 'Refined style for her',
    subtitle: 'Soft silhouettes, statement details, and polished pieces designed to elevate every outfit.',
    buttonLabel: 'Shop the women’s collection',
    image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80',
    accent: ['#ff9cd6', '#ff5d7c'],
    features: [
      'Luxury-inspired textures and feminine shapes',
      'Chic essentials for day-to-night looks',
      'Sophisticated accents that feel modern'
    ]
  },
  Children: {
    title: 'Playful style for kids',
    subtitle: 'Bright, comfortable apparel and playful pieces built for every adventurous day.',
    buttonLabel: 'Shop the children’s collection',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    accent: ['#f8d64c', '#6bc1ff'],
    features: [
      'Soft fabrics made for active days',
      'Fun patterns and cheerful colors',
      'Easy-care gear parents will love'
    ]
  },
  Pets: {
    title: 'Cozy accessories for pets',
    subtitle: 'Premium pet essentials with plush comfort, stylish flair, and trustworthy durability.',
    buttonLabel: 'Shop the pet collection',
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
    accent: ['#93f4d1', '#5ddeff'],
    features: [
      'Premium beds, leashes, and accessories',
      'Comfort-first design for pets of all sizes',
      'Soft textures with a polished look'
    ]
  }
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
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
  const [notification, setNotification] = useState<string | null>(null);
  const [emailNotification, setEmailNotification] = useState<string | null>(null);

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
    if (location.pathname === '/admin') {
      setIsAdmin(window.location.hostname === 'localhost');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requested = params.get('category');
    if (requested && ['Men', 'Women', 'Children', 'Pets'].includes(requested)) {
      setCategory(requested);
    }
  }, [location.search]);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveSubscribers(subscribers);
  }, [subscribers]);

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
  const profit = cartItems.reduce((sum, item) => sum + item.product.profitMargin * item.quantity, 0);

  function updateProductStock(id: string, quantity: number) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, stock: Math.max(0, Math.min(999, quantity)) }
          : product
      )
    );
  }

  function addItemToCart(product: Product) {
    if (product.stock <= 0) {
      setNotification('This item is currently out of stock.');
      return;
    }
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] || 0) + 1
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
      if (data.url) {
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
        category: 'Women',
        stock: payload.stock || 12,
        profitMargin: payload.profitMargin || 22
      });
      setScrapeStatus('Preview ready. Adjust details and save to the catalog.');
    } catch (error) {
      setScrapeStatus('Unable to fetch product details from the link.');
      setScrapeResult(null);
    }
  }

  async function handleSaveScrape() {
    if (!scrapeResult || !scrapeResult.name) return;
    const newProduct: Product = {
      id: scrapeResult.id || `item-${Date.now()}`,
      category: scrapeResult.category || 'Women',
      name: scrapeResult.name,
      description: scrapeResult.description || 'Shop the latest curated favorite.',
      price: scrapeResult.price || 39,
      imageUrl: scrapeResult.imageUrl || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      link: scrapeResult.link || linkInput.trim(),
      stock: scrapeResult.stock ?? 12,
      profitMargin: scrapeResult.profitMargin ?? 24
    };
    setProducts((current) => [newProduct, ...current]);
    setScrapeResult(null);
    setLinkInput('');
    setScrapeStatus('Product added to the storefront successfully.');
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
        acc.totalProfit += product.profitMargin;
        return acc;
      },
      { totalStock: 0, productCount: 0, totalProfit: 0 }
    );
  }, [products]);

  return (
    <div>
      <header className="container">
        <nav className="navbar">
          <div>
            <Link to="/" className="title" style={{ fontSize: '1.35rem' }}>
              Pink Halo Co.
            </Link>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/?category=Men" className="nav-link">Men</Link>
            <Link to="/?category=Women" className="nav-link">Women</Link>
            <Link to="/?category=Children" className="nav-link">Children</Link>
            <Link to="/?category=Pets" className="nav-link">Pets</Link>
            <Link to="/admin" className="nav-link">Admin</Link>
          </div>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={
            <>
              {/* Hero Section */}
              <section
                className={`hero-section container hero-section--${category.toLowerCase()}`}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${activeTheme.accent[0]}22, ${activeTheme.accent[1]}33), url(${activeTheme.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <motion.div className="hero-content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
                  <div className="hero-text">
                    <span className="hero-pill">{category === 'All' ? 'Shop every category' : `${category} collection`}</span>
                    <h1>{activeTheme.title}</h1>
                    <p>{activeTheme.subtitle}</p>
                    <div className="hero-buttons">
                      <a href="#products" className="primary">{activeTheme.buttonLabel}</a>
                      <button className="secondary" onClick={() => { setCategory('All'); navigate('/'); }}>View All Products</button>
                    </div>
                  </div>
                  <motion.div className="hero-visual" initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }}>
                    <div className="hero-image-frame">
                      <img src={activeTheme.image} alt={`${category} hero`} />
                    </div>
                  </motion.div>
                </motion.div>
              </section>

              {category !== 'All' && (
                <section className="category-theme-panel container">
                  <div className="section-header">
                    <h2>{category} style guide</h2>
                    <p>{`Curated highlights to help you shop the best ${category.toLowerCase()} picks.`}</p>
                  </div>
                  <div className="theme-feature-grid">
                    {activeTheme.features.map((feature) => (
                      <motion.div
                        key={feature}
                        className="theme-feature-card"
                        whileHover={{ y: -6, scale: 1.01 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p>{feature}</p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Featured Categories */}
              <section className="featured-section container">
                <div className="section-header">
                  <h2>Shop by Category</h2>
                  <p>Browse our curated collections</p>
                </div>
                <div className="category-grid">
                  {['Men', 'Women', 'Children', 'Pets'].map((item) => (
                    <motion.button 
                      key={item} 
                      className="category-card" 
                      type="button"
                      onClick={() => navigate(`/?category=${item}`)}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <h3>{item}</h3>
                      <p>Shop the best in {item}</p>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Newsletter Section */}
              <section className="newsletter-section container">
                <h2>Stay in the Loop</h2>
                <p>Get exclusive deals, new arrivals, and styling tips delivered to your inbox.</p>
                <div className="newsletter-form">
                  <input
                    className="input"
                    type="email"
                    placeholder="Enter your email"
                    value={subscriberEmail}
                    onChange={(event) => setSubscriberEmail(event.target.value)}
                  />
                  <button className="primary" onClick={addSubscriber}>Subscribe</button>
                </div>
                {newsletterStatus && <p style={{ color: '#ff98d8', marginTop: '1rem' }}>{newsletterStatus}</p>}
              </section>

              {/* Search and Filter */}
              <section className="container">
                <div className="search-filter-bar">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      className="input"
                      placeholder="Search products..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <select className="filter-select select" value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="All">All Categories</option>
                    {getCategories().map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
              </section>

              {/* Products Grid */}
              <section id="products" className="container" style={{ marginBottom: '4rem' }}>
                {filteredProducts.length > 0 ? (
                  <>
                    <div style={{ marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.8rem' }}>
                        {category === 'All' ? 'All Products' : `${category} Collection`}
                      </h2>
                      <p style={{ color: '#b8b8c8' }}>Showing {filteredProducts.length} items</p>
                    </div>
                    <div className="grid grid-4">
                      {filteredProducts.map((product) => (
                        <motion.div 
                          key={product.id} 
                          className="product-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -8 }}
                        >
                          <div className="product-image-wrapper">
                            <img src={product.imageUrl} alt={product.name} loading="lazy" />
                            {product.stock < 5 && product.stock > 0 && (
                              <span className="product-badge">Low Stock</span>
                            )}
                            {product.stock === 0 && (
                              <span className="product-badge" style={{ background: '#666' }}>Sold Out</span>
                            )}
                          </div>
                          <div className="product-info">
                            <span style={{ fontSize: '0.85rem', color: '#ff98d8' }}>{product.category}</span>
                            <h3 className="product-name">{product.name}</h3>
                            <p className="product-desc">{productMask(product.description)}</p>
                            <div className="product-footer" style={{ gap: '0.75rem' }}>
                              <span className="product-price">{formatCurrency(product.price)}</span>
                              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button 
                                  className="product-add-btn" 
                                  onClick={() => addItemToCart(product)}
                                  disabled={product.stock <= 0}
                                >
                                  {product.stock > 0 ? 'Add to cart' : 'Out of stock'}
                                </button>
                                <a 
                                  className="secondary" 
                                  href={product.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ padding: '0.55rem 1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  View
                                </a>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <h3>No products found</h3>
                    <p style={{ color: '#b8b8c8' }}>Try adjusting your search or filters</p>
                  </div>
                )}
              </section>

              {/* Shopping Cart */}
              <section className="container" style={{ marginBottom: '4rem' }}>
                {cartItems.length > 0 && (
                  <motion.div 
                    className="cart-sidebar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <h3 style={{ marginBottom: '1.5rem' }}>Shopping Cart ({cartItems.length})</h3>
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="cart-item">
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.product.name}</div>
                          <div className="cart-item-qty">Qty: {item.quantity}</div>
                        </div>
                        <div>
                          <div className="cart-item-price">{formatCurrency(item.product.price * item.quantity)}</div>
                          <button 
                            className="secondary" 
                            onClick={() => removeFromCart(item.product.id)}
                            style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Subtotal:</span>
                        <strong>{formatCurrency(total)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b8b8c8', marginBottom: '1.5rem' }}>
                        <span>Profit margin:</span>
                        <span>{formatCurrency(profit)}</span>
                      </div>
                      <button 
                        className="primary" 
                        onClick={createCheckoutSession}
                        style={{ width: '100%' }}
                      >
                        Checkout
                      </button>
                    </div>
                  </motion.div>
                )}
              </section>

              {/* Trust & Info Section */}
              <section className="featured-section container" style={{ marginBottom: '4rem' }}>
                <div className="section-header">
                  <h2>Why Shop With Us</h2>
                  <p>Experience the Pink Halo difference</p>
                </div>
                <div className="category-grid">
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🚚 Free Shipping</h3>
                    <p>On orders over $75</p>
                  </div>
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>✨ Exclusive Deals</h3>
                    <p>Limited-time offers</p>
                  </div>
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📦 New Drops Weekly</h3>
                    <p>Fresh arrivals constantly</p>
                  </div>
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔒 Secure Checkout</h3>
                    <p>Your info is safe</p>
                  </div>
                </div>
              </section>

              {/* Footer Call to Action */}
              <section style={{ textAlign: 'center', padding: '3rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Shop?</h2>
                <p style={{ color: '#b8b8c8', marginBottom: '1.5rem' }}>Explore our latest collection and find your next favorite piece</p>
                <a href="#products" className="primary">Start Shopping</a>
              </section>
            </>
          } />

          <Route path="/admin" element={
            <section className="section container">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1 1 520px' }}>
                  <h2 className="title">Admin dashboard</h2>
                  <p className="subtitle">Upload supplier links, manage inventory, and review profit and stock metrics from one place.</p>
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
                <div className="grid grid-3">
                  <div>
                    <p className="badge">Catalog</p>
                    <h3>{products.length} products</h3>
                  </div>
                  <div>
                    <p className="badge">Stock total</p>
                    <h3>{inventory.totalStock}</h3>
                  </div>
                  <div>
                    <p className="badge">Profit potential</p>
                    <h3>{formatCurrency(inventory.totalProfit)}</h3>
                  </div>
                </div>
              </div>

              <div className="section card">
                <label className="badge">Link upload</label>
                <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} className="input" placeholder="Paste product page URL" />
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <button className="primary" onClick={handleScrape}>Fetch product details</button>
                  <button className="secondary" onClick={() => { setLinkInput(''); setScrapeResult(null); setScrapeStatus(''); }}>Reset</button>
                </div>
                {scrapeStatus && <p style={{ marginTop: '1rem', color: '#d8d8e8' }}>{scrapeStatus}</p>}
                {scrapeResult && (
                  <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="grid grid-2" style={{ alignItems: 'start' }}>
                      <div>
                        <label className="badge">Preview</label>
                        <input className="input" value={scrapeResult.name} onChange={(e) => setScrapeResult({ ...scrapeResult, name: e.target.value })} />
                        <textarea className="textarea" rows={4} value={scrapeResult.description} onChange={(e) => setScrapeResult({ ...scrapeResult, description: e.target.value })} style={{ marginTop: '1rem' }} />
                        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                          <input className="input" type="number" value={scrapeResult.price ?? 0} onChange={(e) => setScrapeResult({ ...scrapeResult, price: Number(e.target.value) })} />
                          <input className="input" value={scrapeResult.imageUrl} onChange={(e) => setScrapeResult({ ...scrapeResult, imageUrl: e.target.value })} />
                          <select className="select" value={scrapeResult.category} onChange={(e) => setScrapeResult({ ...scrapeResult, category: e.target.value as Product['category'] })}>
                            {getCategories().map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                          </select>
                          <input className="input" type="number" value={scrapeResult.stock ?? 0} onChange={(e) => setScrapeResult({ ...scrapeResult, stock: Number(e.target.value) })} />
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

              <div className="section card">
                <h3>Email marketing & subscribers</h3>
                <p className="subtitle">Manage your newsletter list, preview campaigns, and send automatic product announcement emails.</p>
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
                      className="select"
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

              <div className="section card">
                <h3>Inventory manager</h3>
                <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
                  {products.slice(0, 4).map((product) => (
                    <div className="card" key={product.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <strong>{product.name}</strong>
                          <p style={{ marginTop: '0.5rem', color: '#c5c8da' }}>{product.category}</p>
                        </div>
                        <input className="input" type="number" value={product.stock} onChange={(e) => updateProductStock(product.id, Number(e.target.value))} style={{ width: '100px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          } />
        </Routes>
      </main>

      <footer className="footer container">
        <p>Pink Halo Co. — Shop exclusive products and limited-time offers now.</p>
      </footer>
    </div>
  );
}

export default App;
