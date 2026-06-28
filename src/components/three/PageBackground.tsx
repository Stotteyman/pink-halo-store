import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function BackgroundScene({ accent = '#ff5fa0' }: { accent?: string }) {
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringA.current) { ringA.current.rotation.y = t * 0.18; ringA.current.rotation.z = t * 0.06; }
    if (ringB.current) { ringB.current.rotation.x = t * 0.12; ringB.current.rotation.y = -t * 0.09; }
  });

  return (
    <>
      <ambientLight intensity={0.08} color="#1a0018" />
      <pointLight position={[0, 4, 0]}  color={accent} intensity={2.5} distance={20} decay={2} />
      <pointLight position={[-6, 2, -4]} color="#c084fc" intensity={1.5} distance={14} decay={2} />
      <pointLight position={[6, 0, -4]}  color="#fbbf24" intensity={1}  distance={12} decay={2} />

      <Stars radius={50} depth={30} count={1800} factor={2} saturation={1} fade speed={0.3} />
      <Sparkles count={120} scale={22} size={0.7} speed={0.1} color="#ff80c0" opacity={0.35} />
      <Sparkles count={40}  scale={15} size={1.0} speed={0.06} color="#ffd700" opacity={0.2} />

      {/* Distant halo rings */}
      <mesh ref={ringA} position={[0, 0, -4]}>
        <torusGeometry args={[5, 0.06, 16, 100]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.5} metalness={1} roughness={0} />
      </mesh>
      <mesh ref={ringB} position={[0, 1, -6]}>
        <torusGeometry args={[3.5, 0.04, 12, 80]} />
        <meshStandardMaterial color="#f5d67a" emissive="#e8b820" emissiveIntensity={1.2} metalness={1} roughness={0} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0d0010" emissive="#bb0044" emissiveIntensity={0.04} metalness={0.9} roughness={0.1} />
      </mesh>

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.5} luminanceSmoothing={0.85} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export default function PageBackground({ accent }: { accent?: string }) {
  return (
    <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1e0020 0%, #08000c 70%, #000006 100%)' }}>
      <Canvas
        camera={{ position: [0, 1, 7], fov: 65 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={['#08000c', 10, 30]} />
        <BackgroundScene accent={accent} />
      </Canvas>
    </div>
  );
}
