import { useState, useEffect, useMemo } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import './index.css';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminAddProductPage from './pages/AdminAddProductPage';
import AdminEditProductPage from './pages/AdminEditProductPage';
import NotFoundPage from './pages/NotFoundPage';
import CustomCursor from './components/CustomCursor';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import ShippingPage from './pages/ShippingPage';
import ReturnsPage from './pages/ReturnsPage';
import SizeGuidePage from './pages/SizeGuidePage';
import { Product } from './lib/types';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

function App() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const storedCart = localStorage.getItem('pink-halo-cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error('Failed to load cart', e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('pink-halo-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    async function loadProducts() {
      try {
        // TODO: Replace with actual Supabase fetch
        setProducts([]);
      } catch (error) {
        console.error('Failed to load products', error);
      }
    }
    loadProducts();
  }, []);

  const cartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const isAdmin = location.pathname.startsWith('/admin');
  const DARK_PAGES = ['/about', '/contact', '/faq', '/shipping', '/returns', '/size-guide', '/rewards'];
  const isDarkPage = DARK_PAGES.some(p => location.pathname === p);

  const adminProps = {
    onLogin: () => setIsAdminLoggedIn(true),
    adminPassword: ADMIN_PASSWORD,
  };

  function requireAdmin(el: React.ReactElement) {
    return isAdminLoggedIn ? el : <AdminLoginPage {...adminProps} />;
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,95,162,0.12),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(248,200,220,0.14),transparent_18%),linear-gradient(180deg,#fff3ee_0%,#ffe7f0_50%,#fff9fb_100%)] text-[#3D2A3D] flex flex-col">
      <CustomCursor />
      {!isAdmin && <Header cartCount={cartCount} dark={isDarkPage} />}

      <main className="flex-1">
        <Routes>
          {/* Shop routes */}
          <Route path="/" element={<HomePage products={products} />} />
          <Route path="/shop" element={<HomePage products={products} />} />
          <Route path="/new-arrivals" element={<HomePage products={products} />} />
          <Route path="/rewards" element={<HomePage products={products} />} />
          <Route path="/category/:category" element={<HomePage products={products} />} />
          <Route path="/:category/:slug" element={<ProductDetailPage products={products} cart={cart} setCart={setCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} products={products} />} />
          <Route path="/checkout" element={<CheckoutPage cart={cart} products={products} />} />

          {/* Info pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/size-guide" element={<SizeGuidePage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage {...adminProps} />} />
          <Route path="/admin" element={requireAdmin(<AdminDashboardPage products={products} />)} />
          <Route path="/admin/products" element={requireAdmin(<AdminProductsPage products={products} setProducts={setProducts} />)} />
          <Route path="/admin/products/new" element={requireAdmin(<AdminAddProductPage setProducts={setProducts} />)} />
          <Route path="/admin/products/:id/edit" element={requireAdmin(<AdminEditProductPage products={products} setProducts={setProducts} />)} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isAdmin && <Footer />}

      {notification && (
        <div className="fixed bottom-4 right-4 bg-pink-500 text-white px-6 py-3 rounded-full shadow-lg z-50">
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;
