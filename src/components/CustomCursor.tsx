import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    // Hide the native cursor globally
    document.documentElement.style.cursor = 'none';

    let rafId: number;
    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let dotX  = ringX;
    let dotY  = ringY;

    function onMove(e: MouseEvent) {
      dotX = e.clientX;
      dotY = e.clientY;

      // Check if hovering something interactive
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const interactive = el?.closest('a, button, input, [role="button"], canvas');
      setHovering(!!interactive);
    }

    function onDown() { setClicking(true); }
    function onUp()   { setClicking(false); }

    function animate() {
      // Ring lags behind dot for trailing effect
      ringX += (dotX - ringX) * 0.12;
      ringY += (dotY - ringY) * 0.12;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;
      }
      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);
    rafId = requestAnimationFrame(animate);

    return () => {
      document.documentElement.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: clicking ? '#ffd700' : hovering ? '#ff4499' : '#ffffff',
          boxShadow: `0 0 ${clicking ? 12 : hovering ? 10 : 6}px ${clicking ? '#ffd700' : hovering ? '#ff4499' : '#ffffff'}`,
          transition: 'background 0.15s, box-shadow 0.15s, width 0.15s, height 0.15s',
          willChange: 'transform',
        }}
      />

      {/* Outer ring — trails behind */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `2px solid ${hovering ? '#ff4499' : '#ff80c0'}`,
          boxShadow: `0 0 8px ${hovering ? '#ff449966' : '#ff80c044'}`,
          transform: clicking ? 'scale(0.7)' : hovering ? 'scale(1.4)' : 'scale(1)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          willChange: 'transform',
          opacity: 0.85,
        }}
      />
    </>
  );
}
