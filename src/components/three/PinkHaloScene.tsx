import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles, Text, Stars, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ── Spinning central halo ring ──────────────────────────────────────────────
function HaloRing() {
  const outer  = useRef<THREE.Mesh>(null);
  const inner  = useRef<THREE.Mesh>(null);
  const accent = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (outer.current)  outer.current.rotation.y  = t * 0.25;
    if (inner.current)  inner.current.rotation.z  = t * 0.4;
    if (accent.current) accent.current.rotation.x = t * 0.15;
  });

  return (
    <group position={[0, 1.0, 0]}>
      <mesh ref={outer}>
        <torusGeometry args={[2.0, 0.11, 24, 120]} />
        <meshStandardMaterial color="#ff5fa0" emissive="#ff2277" emissiveIntensity={2.5} metalness={0.9} roughness={0.05} />
      </mesh>
      <mesh ref={inner}>
        <torusGeometry args={[1.4, 0.055, 16, 100]} />
        <meshStandardMaterial color="#f5d67a" emissive="#e8b820" emissiveIntensity={2} metalness={1} roughness={0} />
      </mesh>
      <mesh ref={accent} rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[1.7, 0.035, 12, 80]} />
        <meshStandardMaterial color="#ffadd6" emissive="#ff77bb" emissiveIntensity={1.5} metalness={0.8} roughness={0.1} />
      </mesh>
      <Sparkles count={80} scale={5} size={1.2} speed={0.5} color="#ff80c0" />
      <Sparkles count={40} scale={3.5} size={1.5} speed={0.3} color="#f5d67a" />
    </group>
  );
}

// ── Brand text ──────────────────────────────────────────────────────────────
function BrandText() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 3.6 + Math.sin(clock.elapsedTime * 0.6) * 0.07;
  });
  return (
    <group ref={ref} position={[0, 3.6, 0]}>
      <Text fontSize={0.58} color="#ffffff" anchorX="center" anchorY="middle" outlineColor="#ff5fa0" outlineWidth={0.012}>
        Pink Halo
      </Text>
      <Text fontSize={0.13} color="#f9d0e8" anchorX="center" anchorY="middle" position={[0, -0.52, 0]} letterSpacing={0.18}>
        WEAR YOUR HALO
      </Text>
    </group>
  );
}

// ── Category platform with Html emoji overlay ───────────────────────────────
const CAT_COLORS: Record<string, { hex: string; glow: string }> = {
  Dresses:     { hex: '#ff6eb4', glow: '#ff2288' },
  Tops:        { hex: '#c084fc', glow: '#9030e0' },
  Lounge:      { hex: '#f9a8d4', glow: '#ff5faa' },
  Accessories: { hex: '#fbbf24', glow: '#e09000' },
  Sale:        { hex: '#fb7185', glow: '#dd1133' },
};

interface CategoryDiscProps {
  position: [number, number, number];
  label: string;
  emoji: string;
  onClick: () => void;
}

function CategoryDisc({ position, label, emoji, onClick }: CategoryDiscProps) {
  const [hovered, setHovered] = useState(false);
  const discRef = useRef<THREE.Mesh>(null);
  const rimRef  = useRef<THREE.Mesh>(null);
  const { hex, glow } = CAT_COLORS[label] ?? { hex: '#ff6eb4', glow: '#ff2288' };

  useFrame(({ clock }) => {
    if (discRef.current) discRef.current.rotation.y = clock.elapsedTime * 0.25;
    if (rimRef.current) {
      const ei = hovered ? 3.5 : 1.2 + Math.sin(clock.elapsedTime * 2 + position[0]) * 0.4;
      (rimRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = ei;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.5}>
      <group
        position={position}
        onClick={onClick}
        onPointerOver={() => { setHovered(true);  document.body.style.cursor = 'pointer'; }}
        onPointerOut ={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {/* Disc body */}
        <mesh ref={discRef}>
          <cylinderGeometry args={[0.78, 0.78, 0.1, 48]} />
          <meshStandardMaterial
            color={hovered ? hex : '#1e0a22'}
            emissive={hex}
            emissiveIntensity={hovered ? 1.2 : 0.2}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Glowing rim */}
        <mesh ref={rimRef}>
          <torusGeometry args={[0.79, 0.028, 8, 48]} />
          <meshStandardMaterial color={hex} emissive={glow} emissiveIntensity={1.2} metalness={1} roughness={0} />
        </mesh>

        {/* Hover sparkles */}
        {hovered && <Sparkles count={18} scale={1.6} size={2} speed={1} color={hex} />}

        {/* HTML emoji + label (renders as actual browser element) */}
        <Html center distanceFactor={6} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, transition: 'transform 0.2s',
            transform: hovered ? 'scale(1.15)' : 'scale(1)',
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
            <span style={{
              color: hovered ? '#fff' : '#f0d0e8',
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              textShadow: `0 0 8px ${hex}`,
            }}>
              {label}
            </span>
          </div>
        </Html>
      </group>
    </Float>
  );
}

// ── Ground ──────────────────────────────────────────────────────────────────
function Ground() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.06 + Math.sin(clock.elapsedTime * 0.4) * 0.03;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.8, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color="#110010" emissive="#cc0055" emissiveIntensity={0.06} metalness={0.95} roughness={0.05} />
    </mesh>
  );
}

// ── Slow camera drift ───────────────────────────────────────────────────────
function CameraDrift() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.07;
    camera.position.x = Math.sin(t) * 0.5;
    camera.position.y = 1.8 + Math.sin(t * 0.8) * 0.2;
    camera.lookAt(0, 0.8, 0);
  });
  return null;
}

// ── Small ambient orbs (fixed sizes, lower glow) ───────────────────────────
const ORB_CONFIGS = [
  { pos: [-6.5, 0.5,  2.0] as [number,number,number], color: '#ff6eb4', size: 0.09 },
  { pos: [ 6.0, 1.2, -1.5] as [number,number,number], color: '#c084fc', size: 0.10 },
  { pos: [-4.0, 2.0, -5.0] as [number,number,number], color: '#f9a8d4', size: 0.07 },
  { pos: [ 4.5,-0.5,  5.0] as [number,number,number], color: '#fbbf24', size: 0.07 },
  { pos: [-2.0, 3.0, -6.0] as [number,number,number], color: '#fb7185', size: 0.08 },
  { pos: [ 7.0,-0.8,  3.0] as [number,number,number], color: '#ff6eb4', size: 0.06 },
  { pos: [-7.5, 1.5, -2.0] as [number,number,number], color: '#c084fc', size: 0.11 },
  { pos: [ 2.5, 3.5, -7.0] as [number,number,number], color: '#fbbf24', size: 0.06 },
  { pos: [-3.5,-1.0,  6.5] as [number,number,number], color: '#ff6eb4', size: 0.08 },
  { pos: [ 5.5, 2.5, -4.0] as [number,number,number], color: '#f9a8d4', size: 0.07 },
];

function AmbientOrbs() {
  return (
    <>
      {ORB_CONFIGS.map((o, i) => <AmbientOrb key={i} index={i} {...o} />)}
    </>
  );
}

function AmbientOrb({ pos, color, size, index }: { pos: [number,number,number]; color: string; size: number; index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const speed  = 0.3 + (index % 5) * 0.1;
  const offset = index * 1.7;
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = pos[1] + Math.sin(clock.elapsedTime * speed + offset) * 0.35;
    }
  });
  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[size, 10, 10]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} metalness={1} roughness={0} />
    </mesh>
  );
}

// ── Category positions: front arc, below halo ──────────────────────────────
const CATEGORIES: { label: string; emoji: string; position: [number,number,number] }[] = [
  { label: 'Dresses',     emoji: '👗', position: [-4.8, -1.4,  2.8] },
  { label: 'Tops',        emoji: '✨', position: [-2.3, -1.6,  4.2] },
  { label: 'Lounge',      emoji: '🤍', position: [ 0.0, -1.7,  4.8] },
  { label: 'Accessories', emoji: '💛', position: [ 2.3, -1.6,  4.2] },
  { label: 'Sale',        emoji: '🏷️', position: [ 4.8, -1.4,  2.8] },
];

// ── Main scene ──────────────────────────────────────────────────────────────
function Scene({ onCategoryClick }: { onCategoryClick: (cat: string) => void }) {
  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.12} color="#2d0025" />
      <pointLight position={[0, 6, 2]}   color="#ff4499" intensity={3.5} distance={18} decay={2} />
      <pointLight position={[-5, 3, -3]} color="#c084fc" intensity={2}   distance={14} decay={2} />
      <pointLight position={[0, -1, 5]}  color="#ff80c0" intensity={1.2} distance={10} decay={2} />
      <pointLight position={[5, 1, -3]}  color="#f0b030" intensity={1.2} distance={12} decay={2} />

      <Stars radius={55} depth={35} count={2500} factor={2.5} saturation={1} fade speed={0.4} />
      <Sparkles count={160} scale={20} size={0.8} speed={0.15} color="#ff80c0" opacity={0.5} />
      <Sparkles count={60}  scale={14} size={1.2} speed={0.08} color="#ffd700" opacity={0.3} />

      <HaloRing />
      <BrandText />
      <Ground />
      <AmbientOrbs />
      <CameraDrift />

      {CATEGORIES.map(cat => (
        <CategoryDisc
          key={cat.label}
          position={cat.position}
          label={cat.label}
          emoji={cat.emoji}
          onClick={() => onCategoryClick(cat.label)}
        />
      ))}

      <EffectComposer>
        <Bloom intensity={0.75} luminanceThreshold={0.55} luminanceSmoothing={0.85} mipmapBlur />
      </EffectComposer>
    </>
  );
}

// ── Exported canvas ─────────────────────────────────────────────────────────
export default function PinkHaloScene({ onCategoryClick }: { onCategoryClick: (cat: string) => void }) {
  return (
    <Canvas
      camera={{ position: [0, 1.8, 9], fov: 58 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      dpr={[1, 1.8]}
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #2a0028 0%, #0d000e 60%, #000008 100%)' }}
    >
      <fog attach="fog" args={['#0d000e', 14, 36]} />
      <Scene onCategoryClick={onCategoryClick} />
    </Canvas>
  );
}
