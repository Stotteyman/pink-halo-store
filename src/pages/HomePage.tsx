import { Suspense, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PinkHaloScene, { type TouchMovement } from '../components/three/PinkHaloScene';
import { Product } from '../lib/types';

interface HomePageProps { products: Product[]; }

const DIRECTIONS: { key: keyof TouchMovement; label: string; className: string }[] = [
  { key: 'forward', label: 'UP', className: 'world-control-up' },
  { key: 'left', label: 'LT', className: 'world-control-left' },
  { key: 'backward', label: 'DN', className: 'world-control-down' },
  { key: 'right', label: 'RT', className: 'world-control-right' },
];

function SceneLoader() {
  return <div className="world-loader"><div className="world-loader-halo" /><p>Opening the doors</p></div>;
}

export default function HomePage({ products }: HomePageProps) {
  const movement = useRef<TouchMovement>({ forward: false, backward: false, left: false, right: false });
  const [entered, setEntered] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [atExit, setAtExit] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [closeBlocked, setCloseBlocked] = useState(false);

  const enterStore = async () => {
    setEntered(true);
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be denied by browser or OS policy; the fixed viewport remains usable.
    }
  };

  const quitStore = async () => {
    setConfirmExit(false);
    setSettingsOpen(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Continue to the browser close attempt.
    }
    window.close();
    window.setTimeout(() => setCloseBlocked(true), 180);
  };

  const returnToFullscreen = async () => {
    try { await document.documentElement.requestFullscreen(); } catch { /* browser policy */ }
  };

  const setMoving = (key: keyof TouchMovement, value: boolean) => { movement.current[key] = value; };

  return (
    <div className="world-shell">
      <Suspense fallback={<SceneLoader />}>
        <PinkHaloScene
          active={entered && !settingsOpen && !confirmExit}
          products={products}
          movement={movement}
          onRoomChange={setRoom}
          onExitChange={setAtExit}
        />
      </Suspense>

      <header className="world-brandbar">
        <div className="world-wordmark"><span>Wear your halo</span><strong>Pink Halo</strong></div>
        <div className="world-actions">
          <button type="button" onClick={() => { document.exitPointerLock?.(); setSettingsOpen(true); }}>Menu</button>
          <Link to="/cart">Bag</Link>
        </div>
      </header>

      {entered && (
        <>
          <div className="world-crosshair" aria-hidden="true"><i /><i /></div>
          <div className="world-status">
            <span className="world-status-dot" />
            <div><small>Now exploring</small><strong>{room ?? 'The Main Hall'}</strong></div>
          </div>
          <div className="world-minimap" aria-label="Store map">
            <span className="map-title">Store map</span><i className="map-you" />
            <span className="map-zone map-dresses">Dresses</span><span className="map-zone map-tops">Tops</span>
            <span className="map-zone map-lounge">Lounge</span><span className="map-zone map-accessories">Accessories</span>
            <span className="map-zone map-sale">Sale</span><span className="map-zone map-exit">Exit</span>
          </div>
          {atExit && (
            <button type="button" className="world-exit-prompt" onClick={() => { document.exitPointerLock?.(); setConfirmExit(true); }}>
              <span>Front doors</span><strong>Leave the store</strong>
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
        <div className="world-welcome">
          <div className="world-welcome-card">
            <span className="world-eyebrow">The doors are open</span>
            <h1>This isn't a page.<br /><em>It's a place.</em></h1>
            <p>Step inside Pink Halo. Walk through real departments and discover the collection as it arrives.</p>
            <button type="button" onClick={enterStore}>Enter the store <span>-&gt;</span></button>
            <small>Entering opens the store in fullscreen</small>
          </div>
          <div className="world-welcome-controls">
            <span><kbd>W A S D</kbd> to walk</span><span><i className="mouse-icon" /> mouse to look</span>
            <span>Walk through a doorway to explore</span>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="world-help" role="dialog" aria-modal="true" aria-label="Store menu">
          <button className="world-help-backdrop" onClick={() => setSettingsOpen(false)} aria-label="Close menu" />
          <div className="world-help-card">
            <button className="world-help-close" onClick={() => setSettingsOpen(false)} aria-label="Close">X</button>
            <span className="world-eyebrow">Store menu</span><h2>Pause and settings</h2>
            <p><kbd>W A S D</kbd> or arrow keys to walk. Move your mouse to look around. Walk directly through department doorways.</p>
            <div className="world-menu-actions">
              {!document.fullscreenElement && <button type="button" onClick={returnToFullscreen}>Return to fullscreen</button>}
              <button type="button" className="world-menu-quit" onClick={() => setConfirmExit(true)}>Quit Pink Halo</button>
            </div>
            <p className="world-help-note">Press Esc to release your mouse. Use Menu to resume or quit.</p>
          </div>
        </div>
      )}

      {confirmExit && (
        <div className="world-help" role="alertdialog" aria-modal="true" aria-label="Confirm exit">
          <button className="world-help-backdrop" onClick={() => setConfirmExit(false)} aria-label="Cancel exit" />
          <div className="world-help-card world-exit-card">
            <span className="world-eyebrow">Leaving Pink Halo</span><h2>Ready to step outside?</h2>
            <p>Your visit will end and Pink Halo will attempt to close this browser tab.</p>
            <div className="world-confirm-actions">
              <button type="button" onClick={() => setConfirmExit(false)}>Stay in store</button>
              <button type="button" className="world-menu-quit" onClick={quitStore}>Leave and close</button>
            </div>
          </div>
        </div>
      )}

      {closeBlocked && (
        <div className="world-closed">
          <div><span className="world-eyebrow">Visit complete</span><h2>Pink Halo is closed.</h2>
            <p>Your browser prevented this tab from closing automatically. You can safely close it now.</p></div>
        </div>
      )}
    </div>
  );
}
