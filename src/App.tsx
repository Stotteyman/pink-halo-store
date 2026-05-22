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
            <section className="section container">
              <motion.div className="hero fade-in" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }}>
                <span className="hero-pill">Curated fashion, lifestyle, & pet essentials.</span>
                <h1 className="title">Pink Halo Co. brings fresh style to every wardrobe.</h1>
                <p className="subtitle">
                  Discover premium pieces for men, women, children, and pets with seamless checkout and built-in inventory tracking.
                </p>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="primary" onClick={() => navigate('/')}>Shop the latest</button>
                  <button className="secondary" onClick={() => navigate('/admin')}>Admin panel</button>
                </div>
              </motion.div>

              <div className="section card" style={{ marginTop: '1.75rem' }}>
                <div className="grid grid-2" style={{ alignItems: 'center' }}>
                  <div>
                    <p className="badge">Stay notified</p>
                    <h2 style={{ margin: '0.75rem 0' }}>Join our Pink Halo newsletter.</h2>
                    <p className="subtitle">Get product launches, styling tips, and special offers straight to your inbox.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      className="input"
                      placeholder="Enter your email"
                      value={subscriberEmail}
                      onChange={(event) => setSubscriberEmail(event.target.value)}
                      style={{ minWidth: '240px' }}
                    />
                    <button className="primary" style={{ minWidth: '180px' }} onClick={addSubscriber}>Subscribe</button>
                  </div>
                </div>
                {newsletterStatus && <p style={{ marginTop: '1rem', color: '#d8d8e8' }}>{newsletterStatus}</p>}
              </div>

              <div className="section">
                <div className="grid grid-2" style={{ alignItems: 'center' }}>
                  <div>
                    <div className="badge">Trusted by modern boutiques</div>
                    <h2 className="title" style={{ fontSize: '2.5rem', marginTop: '1.5rem' }}>
                      Product sourcing made simple.
                    </h2>
                    <p className="subtitle">
                      Add links from trusted supplier pages and let the admin dashboard extract product metadata automatically.
                    </p>
                  </div>
                  <div className="card" style={{ minHeight: '320px' }}>
                    <div className="grid" style={{ gap: '1.25rem' }}>
                      <div>
                        <strong>Fast scraping</strong>
                        <p>Product names, descriptions, prices, and images populate automatically from your source URL.</p>
                      </div>
                      <div>
                        <strong>Inventory tracking</strong>
                        <p>Stock and profit metrics are tracked in real time and ready for Supabase upgrade.</p>
                      </div>
                      <div>
                        <strong>Ready for Stripe</strong>
                        <p>Checkout session creation is ready for your Stripe keys, and the storefront is configured for Netlify deployment.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="grid grid-4">
                  {['Men', 'Women', 'Children', 'Pets'].map((item) => (
                    <motion.div key={item} className="card" whileHover={{ y: -6 }}>
                      <h3>{item}</h3>
                      <p>Handpicked collection for {item.toLowerCase()} with modern essentials and seasonal flair.</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: '1 1 320px' }}>
                    <label className="badge">Search</label>
                    <input
                      className="input"
                      placeholder="Search by name or category"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      style={{ marginTop: '1rem' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 220px' }}>
                    <label className="badge">Filter</label>
                    <select className="select" value={category} onChange={(event) => setCategory(event.target.value)} style={{ marginTop: '1rem' }}>
                      <option value="All">All categories</option>
                      {getCategories().map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="grid grid-3">
                  {filteredProducts.map((product) => (
                    <motion.article key={product.id} className="card" whileHover={{ y: -4 }}>
                      <div className="product-image">
                        <img src={product.imageUrl} alt={product.name} loading="lazy" />
                      </div>
                      <div style={{ marginTop: '1.25rem' }}>
                        <div className="badge">{product.category}</div>
                        <h3 style={{ margin: '1rem 0 0.75rem' }}>{product.name}</h3>
                        <p style={{ color: '#cdd2e8' }}>{productMask(product.description)}</p>
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{formatCurrency(product.price)}</strong>
                          <span className="status-pill">{product.stock} in stock</span>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button className="primary" style={{ flex: '1 1 auto' }} onClick={() => addItemToCart(product)}>Add to cart</button>
                          <a className="secondary" href={product.link} target="_blank" rel="noreferrer" style={{ flex: '1 1 auto', textAlign: 'center', padding: '1rem 1rem' }}>View</a>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>

              <section className="section card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <p className="badge">Shopping cart</p>
                    <h3>{cartItems.length ? 'Ready for checkout' : 'Your cart is empty'}</h3>
                    <p className="subtitle">Track your selected items and complete purchase through Stripe when configured.</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '1.15rem' }}>Subtotal: <strong>{formatCurrency(total)}</strong></p>
                    <p style={{ margin: '0.5rem 0 0', color: '#c5c8da' }}>Estimated profit: <strong>{formatCurrency(profit)}</strong></p>
                    <button className="primary" onClick={createCheckoutSession} disabled={!cartItems.length} style={{ marginTop: '1rem' }}>{cartItems.length ? 'Proceed to checkout' : 'Add items to cart'}</button>
                  </div>
                </div>
                {cartItems.length > 0 && (
                  <div className="grid grid-2" style={{ marginTop: '1.5rem', gap: '1rem' }}>
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{item.product.name}</strong>
                          <p style={{ margin: '0.5rem 0 0', color: '#c5c8da' }}>{item.quantity} × {formatCurrency(item.product.price)}</p>
                        </div>
                        <button className="secondary" onClick={() => removeFromCart(item.product.id)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="section card" style={{ marginTop: '2rem' }}>
                <div className="grid grid-2" style={{ alignItems: 'center' }}>
                  <div>
                    <h2>Seamless checkout and performance-ready architecture</h2>
                    <p className="subtitle">
                      The store is built with optimized page structure, responsive design, SEO metadata, and serverless hooks for Stripe and Supabase.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="card" style={{ flex: '1' }}>
                      <strong>Fast load</strong>
                      <p>Minimal assets and modern CSS deliver a polished experience on desktop and mobile.</p>
                    </div>
                    <div className="card" style={{ flex: '1' }}>
                      <strong>Rich data</strong>
                      <p>Admin scraping makes catalog building easy while keeping product details fresh and accurate.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
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
        <p>Pink Halo Co. — stylish storefront built for modern ecommerce.</p>
      </footer>
    </div>
  );
}

export default App;
