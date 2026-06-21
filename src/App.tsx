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
import { Product } from './lib/types';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

function App() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Load cart from localStorage
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

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('pink-halo-cart', JSON.stringify(cart));
  }, [cart]);

  // Load products from Supabase
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,95,162,0.12),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(248,200,220,0.14),transparent_18%),linear-gradient(180deg,#fff3ee_0%,#ffe7f0_50%,#fff9fb_100%)] text-[#3D2A3D] flex flex-col">
      {!isAdmin && <Header cartCount={cartCount} />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage products={products} />} />
          <Route path="/:category" element={<HomePage products={products} />} />
          <Route path="/:category/:slug" element={<ProductDetailPage products={products} cart={cart} setCart={setCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} products={products} />} />
          <Route path="/checkout" element={<CheckoutPage cart={cart} products={products} />} />

          <Route path="/admin/login" element={<AdminLoginPage onLogin={() => setIsAdminLoggedIn(true)} adminPassword={ADMIN_PASSWORD} />} />
          <Route path="/admin" element={isAdminLoggedIn ? <AdminDashboardPage products={products} /> : <AdminLoginPage onLogin={() => setIsAdminLoggedIn(true)} adminPassword={ADMIN_PASSWORD} />} />
          <Route path="/admin/products" element={isAdminLoggedIn ? <AdminProductsPage products={products} setProducts={setProducts} /> : <AdminLoginPage onLogin={() => setIsAdminLoggedIn(true)} adminPassword={ADMIN_PASSWORD} />} />
          <Route path="/admin/products/new" element={isAdminLoggedIn ? <AdminAddProductPage setProducts={setProducts} /> : <AdminLoginPage onLogin={() => setIsAdminLoggedIn(true)} adminPassword={ADMIN_PASSWORD} />} />
          <Route path="/admin/products/:id/edit" element={isAdminLoggedIn ? <AdminEditProductPage products={products} setProducts={setProducts} /> : <AdminLoginPage onLogin={() => setIsAdminLoggedIn(true)} adminPassword={ADMIN_PASSWORD} />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isAdmin && <Footer />}

      {notification && (
        <div className="fixed bottom-4 right-4 bg-pink-500 text-white px-6 py-3 rounded-full shadow-lg">
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;
