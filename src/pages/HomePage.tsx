import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PinkHaloScene, { type TouchMovement } from '../components/three/PinkHaloScene';
import AccountPanel from '../components/AccountPanel';
import ProfilePanel from '../components/ProfilePanel';
import { useCustomerSession } from '../auth/useCustomerSession';
import { signInWithGoogle, signOutSupabase } from '../lib/supabase';
import { Product } from '../lib/types';

const STAFF_ROLES = ['staff', 'manager', 'admin', 'superadmin'];
const ADMIN_ROLES = ['admin', 'superadmin'];

interface HomePageProps {
  products: Product[];
  cart: Record<string, number>;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onCheckout: () => void;
  onDonate: (amount: number) => Promise<void>;
}

type GameScreen = 'menu' | 'bag' | 'shop' | 'donation' | 'account' | 'profile' | null;

const DIRECTIONS: { key: keyof TouchMovement; label: string; className: string }[] = [
  { key: 'forward', label: '↑', className: 'world-control-up' },
  { key: 'left', label: '←', className: 'world-control-left' },
  { key: 'backward', label: '↓', className: 'world-control-down' },
  { key: 'right', label: '→', className: 'world-control-right' },
];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function SceneLoader() {
  return <div className="world-loader"><div className="world-loader-halo" /><p>Opening the doors</p></div>;
}

export default function HomePage({ products, cart, onAddToCart, onUpdateQuantity, onRemoveFromCart, onCheckout, onDonate }: HomePageProps) {
  const movement = useRef<TouchMovement>({ forward: false, backward: false, left: false, right: false });
  const [entered, setEntered] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [atExit, setAtExit] = useState(false);
  const [screen, setScreen] = useState<GameScreen>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [closeBlocked, setCloseBlocked] = useState(false);
  const [shopCategory, setShopCategory] = useState<Product['category'] | null>(null);
  const [focusedNpcCategory, setFocusedNpcCategory] = useState<Product['category'] | null>(null);
  const [focusedNpcLabel, setFocusedNpcLabel] = useState<string | null>(null);
  const [donationFocused, setDonationFocused] = useState(false);
  const [donationAmount, setDonationAmount] = useState(10);
  const [donationStatus, setDonationStatus] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [playerPosition, setPlayerPosition] = useState({ x: 0, z: 7.4 });
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [guestChosen, setGuestChosen] = useState(() => sessionStorage.getItem('pink-halo-guest') === 'true');
  const [, setStepsTaken] = useState(0);
  const [authStatus, setAuthStatus] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const footstepSide = useRef(0);
  const { session, configured: accountsConfigured } = useCustomerSession();
  const navigate = useNavigate();
  const staffRole = String(session?.user?.app_metadata?.role || '').toLowerCase();
  const isStaff = STAFF_ROLES.includes(staffRole);
  const isAdmin = ADMIN_ROLES.includes(staffRole);

  const cartItems = useMemo(() => Object.entries(cart).flatMap(([id, quantity]) => {
    const product = products.find(item => item.id === id);
    return product ? [{ product, quantity }] : [];
  }), [cart, products]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shopProducts = shopCategory ? products.filter(item => item.category === shopCategory) : [];
  const paused = screen !== null || confirmExit || onboardingOpen;

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  useEffect(() => {
    if (!entered) return;
    // Tab would otherwise cycle browser focus across the HUD/menu buttons, which
    // reads as broken input in a fullscreen game. Keep Tab inert everywhere in-store.
    const blockTab = (event: KeyboardEvent) => { if (event.key === 'Tab') event.preventDefault(); };
    window.addEventListener('keydown', blockTab);
    return () => window.removeEventListener('keydown', blockTab);
  }, [entered]);

  useEffect(() => {
    if (!entered) return;
    // Escape already exits pointer lock natively; also close whatever dialog is
    // open so the store doesn't stay paused behind an invisible menu.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (screen !== null) closeScreen();
      else if (confirmExit) cancelExit();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [entered, screen, confirmExit]);

  useEffect(() => {
    if (!entered || session || guestChosen || onboardingOpen) return;
    const timer = window.setTimeout(() => {
      if (document.pointerLockElement) document.exitPointerLock?.();
      setOnboardingOpen(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [entered, guestChosen, onboardingOpen, session]);

  useEffect(() => {
    if (session) setOnboardingOpen(false);
  }, [session]);

  const ensureAudio = () => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume().catch(() => undefined);
    return audioContextRef.current;
  };

  const playFootstep = () => {
    const context = audioContextRef.current;
    if (!context || context.state !== 'running') return;
    const length = Math.floor(context.sampleRate * 0.09);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) samples[index] = (Math.random() * 2 - 1) * (1 - index / length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = footstepSide.current % 2 ? 310 : 260;
    gain.gain.setValueAtTime(0.11, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    footstepSide.current += 1;
  };

  const registerStep = () => {
    setStepsTaken(current => {
      const next = current + 1;
      if (next >= 3 && !session && !guestChosen) {
        if (document.pointerLockElement) document.exitPointerLock?.();
        setOnboardingOpen(true);
      }
      return next;
    });
  };

  const enterStore = async () => {
    ensureAudio();
    setEntered(true);
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen is optional; the fixed game viewport remains usable.
    }
  };

  const quitStore = async () => {
    setConfirmExit(false);
    setScreen(null);
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* continue */ }
    window.close();
    window.setTimeout(() => setCloseBlocked(true), 180);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* browser policy */ }
  };

  const releasePointer = () => {
    if (document.pointerLockElement) document.exitPointerLock?.();
  };

  const relockPointer = () => {
    // Only re-capture the mouse for gameplay look controls once the player has
    // actually entered the store — never while the "Enter the store" welcome
    // prompt is still showing, or the cursor would vanish before gameplay starts.
    if (!entered) return;
    const canvas = document.querySelector('.world-shell canvas') as HTMLCanvasElement | null;
    if (canvas && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
  };

  const cancelExit = () => {
    setConfirmExit(false);
    relockPointer();
  };

  const openScreen = (nextScreen: Exclude<GameScreen, 'shop' | null>) => {
    releasePointer();
    setScreen(nextScreen);
  };

  const handleAccountButton = () => {
    if (session) signOutSupabase();
    else openScreen('account');
  };

  const openShop = (category: Product['category']) => {
    releasePointer();
    setShopCategory(category);
    setScreen('shop');
  };

  const closeScreen = () => {
    setScreen(null);
    relockPointer();
  };
  const setMoving = (key: keyof TouchMovement, value: boolean) => { movement.current[key] = value; };

  return (
    <div className="world-shell">
      <Suspense fallback={<SceneLoader />}>
        <PinkHaloScene
          active={entered && !paused}
          products={products}
          movement={movement}
          onRoomChange={setRoom}
          onExitChange={setAtExit}
          onNpcFocus={(category, label) => { setFocusedNpcCategory(category); setFocusedNpcLabel(label); }}
          onNpcInteract={(category) => openShop(category)}
          onDonationFocus={setDonationFocused}
          onDonationInteract={() => openScreen('donation')}
          onPlayerPosition={(x, z) => setPlayerPosition({ x, z })}
          onFootstep={playFootstep}
          onStep={registerStep}
        />
      </Suspense>

      <header className="world-brandbar">
        <div className="world-wordmark"><span>Wear your halo</span><strong>Pink Halo</strong></div>
        <div className="world-actions">
          <button type="button" onClick={() => openScreen('menu')}>Menu</button>
          <button type="button" onClick={() => openScreen('bag')}>Bag{cartCount ? ` (${cartCount})` : ''}</button>
        </div>
      </header>

      {entered && (
        <>
          <div className="world-crosshair" aria-hidden="true"><i /><i /></div>
          <div className="world-status"><span className="world-status-dot" /><div><small>Now exploring</small><strong>{room ?? 'The Main Hall'}</strong></div></div>
          <div className="world-minimap" aria-label="Store map">
            <span className="map-title">Boutique map</span><i className="map-you" style={{ left: `${10 + ((playerPosition.x + 11) / 22) * 150}px`, top: `${18 + ((playerPosition.z + 20) / 29) * 128}px` }} />
            <span className="map-zone map-dresses">Dresses</span><span className="map-zone map-tops">Tops</span>
            <span className="map-zone map-lounge">Lounge</span><span className="map-zone map-accessories">Accessories</span>
            <span className="map-zone map-sale">Archive</span><span className="map-zone map-lobby">Lobby</span><span className="map-zone map-exit">Exit</span>
          </div>
          {atExit && <button type="button" className="world-exit-prompt" onClick={() => { releasePointer(); setConfirmExit(true); }}><span>Front doors</span><strong>Leave the store</strong></button>}
          {focusedNpcCategory && focusedNpcLabel && (
            <button type="button" className="world-exit-prompt" style={{ bottom: '7.5rem' }} onClick={() => openShop(focusedNpcCategory)}>
              <span>{focusedNpcLabel}</span><strong>Press E or click to shop {focusedNpcCategory}</strong>
            </button>
          )}
          {donationFocused && (
            <button type="button" className="world-exit-prompt world-donation-prompt" onClick={() => openScreen('donation')}>
              <span>Donation piggy bank</span><strong>Press E or click to donate</strong>
            </button>
          )}
          <div className="world-touch-controls" aria-label="Movement controls">
            {DIRECTIONS.map(direction => (
              <button type="button" key={direction.key} className={direction.className} aria-label={`Move ${direction.key}`}
                onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setMoving(direction.key, true); }}
                onPointerUp={() => setMoving(direction.key, false)} onPointerCancel={() => setMoving(direction.key, false)}
                onPointerLeave={() => setMoving(direction.key, false)}>{direction.label}</button>
            ))}
          </div>
        </>
      )}

      {!entered && (
        <div className="world-welcome"><div className="world-welcome-card">
          <span className="world-eyebrow">The doors are open</span><h1>This isn't a page.<br /><em>It's a place.</em></h1>
          <p>Step inside Pink Halo. Walk through real departments and discover the collection as it arrives.</p>
          <button type="button" onClick={enterStore}>Enter the store <span>-&gt;</span></button>
          <small>Fullscreen is optional and can be changed from Menu</small>
        </div><div className="world-welcome-controls"><span><kbd>W A S D</kbd> to walk</span><span>click to lock look</span><span><kbd>Esc</kbd> shows cursor</span></div></div>
      )}

      {onboardingOpen && !session && (
        <div className="world-help" role="dialog" aria-modal="true" aria-label="Choose how to continue">
          <div className="world-help-backdrop" aria-hidden="true" />
          <div className="world-help-card world-auth-choice">
            <span className="world-eyebrow">Save your visit</span><h2>Welcome to Pink Halo</h2>
            <p>Sign in to keep your bag and future rewards connected, or continue exploring as a guest.</p>
            <div className="world-auth-actions">
              <button type="button" className="world-google-button" disabled={!accountsConfigured} onClick={async () => {
                setAuthStatus('Opening Google sign in…');
                try { await signInWithGoogle(); } catch (reason) { setAuthStatus(reason instanceof Error ? reason.message : 'Google sign in could not start.'); }
              }}><strong>G</strong><span>Continue with Google</span></button>
              <button type="button" onClick={() => { sessionStorage.setItem('pink-halo-guest', 'true'); setGuestChosen(true); setOnboardingOpen(false); }}>Continue as guest</button>
            </div>
            {!accountsConfigured && <p className="world-auth-status">Google sign in is not configured in this environment.</p>}
            {authStatus && <p className="world-auth-status" role="status">{authStatus}</p>}
          </div>
        </div>
      )}

      {screen === 'menu' && (
        <div className="world-help" role="dialog" aria-modal="true" aria-label="Store menu">
          <button className="world-help-backdrop" onClick={closeScreen} aria-label="Close menu" />
          <div className="world-help-card world-menu-card">
            <button className="world-help-close" onClick={closeScreen} aria-label="Close">X</button>
            <span className="world-eyebrow">Store menu</span><h2>Pink Halo</h2>
            <p className="world-menu-location">Paused in <strong>{room ?? 'The Main Hall'}</strong></p>
            <div className="world-menu-grid">
              <button type="button" onClick={handleAccountButton}><strong>{session ? 'Log out' : 'Log in'}</strong><span>{session ? session.user.email : 'Create an account or sign in'}</span></button>
              <button type="button" onClick={() => openScreen('donation')}><strong>Donate</strong><span>Visit the community piggy bank</span></button>
              {session && <button type="button" onClick={() => openScreen('profile')}><strong>Profile</strong><span>Edit your account</span></button>}
              {isStaff && <button type="button" onClick={() => navigate('/admin')}><strong>Shopkeeper</strong><span>Manage the store</span></button>}
              {isAdmin && <button type="button" onClick={() => navigate('/admin')}><strong>Admin</strong><span>Owner controls</span></button>}
            </div>
            <div className="world-menu-utility">
              <button type="button" onClick={toggleFullscreen}>{isFullscreen ? 'Windowed' : 'Fullscreen'}</button>
              <button type="button" onClick={() => setConfirmExit(true)}>Exit Pink Halo</button>
            </div>
            <div className="world-controls-guide"><span><kbd>W A S D</kbd> Walk</span><span><kbd>Click</kbd> Lock look</span><span><kbd>Esc</kbd> Cursor</span><span><kbd>E</kbd> Shop</span></div>
          </div>
        </div>
      )}

      {screen === 'bag' && (
        <div className="world-department world-bag" role="dialog" aria-modal="true" aria-label="Shopping bag">
          <div className="world-department-head"><div><span className="world-eyebrow">Your collection</span><h2>Shopping Bag</h2><p>{cartCount} item{cartCount === 1 ? '' : 's'} ready for checkout</p></div><button type="button" onClick={closeScreen}>Back to store <span>X</span></button></div>
          {cartItems.length ? <><div className="world-bag-list">{cartItems.map(({ product, quantity }) => (
            <article className="world-bag-item" key={product.id}><img src={product.imageUrl} alt="" /><div><span>{product.category}</span><h3>{product.name}</h3><strong>{money.format(product.price)}</strong></div>
              <div className="world-quantity"><button onClick={() => onUpdateQuantity(product.id, quantity - 1)} aria-label={`Decrease ${product.name}`}>-</button><span>{quantity}</span><button onClick={() => onUpdateQuantity(product.id, quantity + 1)} aria-label={`Increase ${product.name}`}>+</button></div>
              <button className="world-remove" onClick={() => onRemoveFromCart(product.id)}>Remove</button></article>
          ))}</div><div className="world-bag-summary"><span>Subtotal</span><strong>{money.format(cartTotal)}</strong><button type="button" onClick={onCheckout}>Checkout</button></div></> : <div className="world-empty-collection"><span>○</span><h3>Your bag is empty</h3><p>Meet a stylist in any department to browse the collection.</p><button type="button" onClick={closeScreen}>Continue exploring</button></div>}
        </div>
      )}

      {screen === 'donation' && (
        <div className="world-help" role="dialog" aria-modal="true" aria-label="Donation piggy bank">
          <button className="world-help-backdrop" onClick={closeScreen} aria-label="Close donation" />
          <div className="world-help-card world-donation-card">
            <button className="world-help-close" onClick={closeScreen} aria-label="Close">X</button>
            <div className="world-pig-icon" aria-hidden="true">🐷</div>
            <span className="world-eyebrow">Pink Halo community fund</span><h2>Leave a little kindness</h2>
            <p>Your optional donation is processed securely as a separate Stripe payment.</p>
            <div className="world-donation-options">
              {[5, 10, 25, 50].map(amount => <button type="button" key={amount} className={donationAmount === amount ? 'active' : ''} onClick={() => setDonationAmount(amount)}>{money.format(amount)}</button>)}
            </div>
            <label className="world-donation-custom">Custom amount<input type="number" min="1" max="1000" step="1" value={donationAmount} onChange={event => setDonationAmount(Math.max(1, Math.min(1000, Number(event.target.value) || 1)))} /></label>
            <button type="button" className="world-donate-button" onClick={async () => { setDonationStatus('Opening secure checkout…'); try { await onDonate(donationAmount); } catch (reason) { setDonationStatus(reason instanceof Error ? reason.message : 'Donation checkout could not start.'); } }}>Donate {money.format(donationAmount)}</button>
            {donationStatus && <p className="world-auth-status" role="status">{donationStatus}</p>}
          </div>
        </div>
      )}

      {screen === 'shop' && shopCategory && (
        <div className="world-department" role="dialog" aria-modal="true" aria-label={`${shopCategory} shop`}>
          <div className="world-department-head"><div><span className="world-eyebrow">Stylist selection</span><h2>{shopCategory}</h2><p>Choose an item to add it directly to your in-store bag.</p></div><button type="button" onClick={closeScreen}>Back to store <span>X</span></button></div>
          {shopProducts.length ? <div className="world-product-rail">{shopProducts.map(product => (
            <article className="world-product" key={product.id}><div className="world-product-image"><img src={product.imageUrl} alt={product.name} /></div><div className="world-product-copy"><span>{product.category}{product.preorder ? ' · Coming Soon' : ''}</span><h3>{product.name}</h3><strong>{product.compareAtPrice != null && <s style={{ opacity: 0.5, marginRight: '0.4em', fontWeight: 400 }}>{money.format(product.compareAtPrice)}</s>}{money.format(product.price)}</strong><button type="button" disabled={product.stock <= 0 && !product.preorder} onClick={() => onAddToCart(product)}>{product.preorder ? 'Preorder' : product.stock > 0 ? 'Add to bag' : 'Sold out'}</button></div></article>
          ))}</div> : <div className="world-empty-collection"><span>○</span><h3>Collection in preparation</h3><p>This department will open when inventory is connected.</p></div>}
        </div>
      )}

      {screen === 'account' && (
        <div className="world-help" role="dialog" aria-modal="true" aria-label="Account">
          <button className="world-help-backdrop" onClick={closeScreen} aria-label="Close account" />
          <AccountPanel session={session} configured={accountsConfigured} onClose={closeScreen} />
        </div>
      )}

      {screen === 'profile' && session && (
        <div className="world-help" role="dialog" aria-modal="true" aria-label="Profile">
          <button className="world-help-backdrop" onClick={closeScreen} aria-label="Close profile" />
          <ProfilePanel session={session} onClose={closeScreen} />
        </div>
      )}

      {confirmExit && <div className="world-help" role="alertdialog" aria-modal="true" aria-label="Confirm exit"><button className="world-help-backdrop" onClick={cancelExit} aria-label="Cancel exit" /><div className="world-help-card world-exit-card"><span className="world-eyebrow">Leaving Pink Halo</span><h2>Ready to step outside?</h2><p>Your visit will end and Pink Halo will attempt to close this browser tab.</p><div className="world-confirm-actions"><button type="button" onClick={cancelExit}>Stay in store</button><button type="button" className="world-menu-quit" onClick={quitStore}>Leave and close</button></div></div></div>}
      {closeBlocked && <div className="world-closed"><div><span className="world-eyebrow">Visit complete</span><h2>Pink Halo is closed.</h2><p>Your browser prevented this tab from closing automatically. You can safely close it now.</p></div></div>}
    </div>
  );
}
