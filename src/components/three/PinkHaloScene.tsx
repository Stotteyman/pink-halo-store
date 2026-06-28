import { MutableRefObject, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Product } from '../../lib/types';

export interface TouchMovement { forward: boolean; backward: boolean; left: boolean; right: boolean; }

type RoomDefinition = {
  name: string;
  category: Product['category'];
  position: [number, number, number];
  size: [number, number];
  entrance: 'left' | 'right' | 'front';
  color: string;
  subtitle: string;
};

const ROOMS: RoomDefinition[] = [
  { name: 'The Dress Room', category: 'Dresses', position: [-8.5, 0, -2.5], size: [8, 7.5], entrance: 'right', color: '#e989ad', subtitle: 'DRESSES' },
  { name: 'The Tops Room', category: 'Tops', position: [8.5, 0, -2.5], size: [8, 7.5], entrance: 'left', color: '#cda0e5', subtitle: 'TOPS' },
  { name: 'The Lounge', category: 'Lounge', position: [-8.5, 0, -12.2], size: [8, 7.5], entrance: 'right', color: '#e7a9bd', subtitle: 'LOUNGE' },
  { name: 'The Accessories Room', category: 'Accessories', position: [8.5, 0, -12.2], size: [8, 7.5], entrance: 'left', color: '#d5af69', subtitle: 'ACCESSORIES' },
  { name: 'The Archive', category: 'Sale', position: [0, 0, -18.2], size: [7, 5], entrance: 'front', color: '#c96b76', subtitle: 'SALE ARCHIVE' },
];

function Wall({ position, size, color = '#321c25' }: { position: [number, number, number]; size: [number, number, number]; color?: string }) {
  return <mesh position={position} receiveShadow castShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.74} /></mesh>;
}

function GarmentRack({ position, products, color }: { position: [number, number, number]; products: Product[]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[-1.35, 1.05, 0]}><cylinderGeometry args={[0.045, 0.045, 2.1, 12]} /><meshStandardMaterial color="#9d7c49" metalness={0.8} roughness={0.22} /></mesh>
      <mesh position={[1.35, 1.05, 0]}><cylinderGeometry args={[0.045, 0.045, 2.1, 12]} /><meshStandardMaterial color="#9d7c49" metalness={0.8} roughness={0.22} /></mesh>
      <mesh position={[0, 2.08, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 2.75, 12]} /><meshStandardMaterial color="#b79355" metalness={0.85} roughness={0.18} /></mesh>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[3.1, 0.08, 0.72]} /><meshStandardMaterial color="#ad8b7e" roughness={0.5} /></mesh>
      {products.slice(0, 7).map((product, index) => {
        const x = (index - Math.min(products.length - 1, 6) / 2) * 0.36;
        return (
          <group key={product.id} position={[x, 1.55, 0]}>
            <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.18, 0.018, 8, 24, Math.PI]} /><meshStandardMaterial color="#d8b16b" metalness={0.7} /></mesh>
            <mesh position={[0, -0.18, 0]}><boxGeometry args={[0.31, 0.82, 0.07]} /><meshStandardMaterial color={color} roughness={0.62} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

function EmptyRoomNotice({ color }: { color: string }) {
  return (
    <group position={[0, 2.55, 0]}>
      <Text fontSize={0.24} color={color} anchorX="center" letterSpacing={0.12}>COLLECTION IN PREPARATION</Text>
      <Text position={[0, -0.42, 0]} fontSize={0.12} color="#bba8af" anchorX="center" maxWidth={4.8} textAlign="center">
        This department will open when real inventory is connected.
      </Text>
    </group>
  );
}

function DepartmentRoom({ room, products }: { room: RoomDefinition; products: Product[] }) {
  const [width, depth] = room.size;
  const wallColor = '#33202a';
  const localProducts = products.filter(product => product.category === room.category);
  const sideEntrance = room.entrance === 'left' || room.entrance === 'right';
  const entryX = room.entrance === 'left' ? -width / 2 : width / 2;

  return (
    <group position={room.position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={room.color} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[width - 0.45, depth - 0.45]} />
        <meshStandardMaterial color="#5b3d49" roughness={0.82} />
      </mesh>

      <Wall position={[0, 2.7, -depth / 2]} size={[width, 5.4, 0.28]} color={wallColor} />
      {sideEntrance ? (
        <>
          <Wall position={[-Math.sign(entryX) * width / 2, 2.7, 0]} size={[0.28, 5.4, depth]} color={wallColor} />
          <Wall position={[entryX, 2.7, -depth / 2 + 1.15]} size={[0.28, 5.4, 2.3]} color={wallColor} />
          <Wall position={[entryX, 2.7, depth / 2 - 1.15]} size={[0.28, 5.4, 2.3]} color={wallColor} />
          <Wall position={[entryX, 4.7, 0]} size={[0.28, 1.4, depth - 4.6]} color={wallColor} />
        </>
      ) : (
        <>
          <Wall position={[-width / 2, 2.7, 0]} size={[0.28, 5.4, depth]} color={wallColor} />
          <Wall position={[width / 2, 2.7, 0]} size={[0.28, 5.4, depth]} color={wallColor} />
          <Wall position={[-width / 2 + 1, 2.7, depth / 2]} size={[2, 5.4, 0.28]} color={wallColor} />
          <Wall position={[width / 2 - 1, 2.7, depth / 2]} size={[2, 5.4, 0.28]} color={wallColor} />
          <Wall position={[0, 4.7, depth / 2]} size={[width - 4, 1.4, 0.28]} color={wallColor} />
        </>
      )}

      <Text position={[0, 4.25, -depth / 2 + 0.18]} fontSize={0.48} color={room.color} anchorX="center" letterSpacing={0.08}>{room.subtitle}</Text>
      <pointLight position={[0, 4.4, 0]} intensity={20} distance={8} color={room.color} />
      <GarmentRack position={[0, 0, -0.5]} products={localProducts} color={room.color} />
      <GarmentRack position={[0, 0, 2]} products={localProducts.slice(7)} color={room.color} />
      {localProducts.length === 0 && <EmptyRoomNotice color={room.color} />}
    </group>
  );
}

function MainHall() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[7, 31]} /><meshStandardMaterial color="#d6c4be" roughness={0.46} />
      </mesh>
      <gridHelper args={[31, 31, '#8c7377', '#c4aeb0']} position={[0, 0.015, -5]} rotation={[0, Math.PI / 2, 0]} />
      <Wall position={[-13, 3, -5]} size={[0.35, 6, 31]} />
      <Wall position={[13, 3, -5]} size={[0.35, 6, 31]} />
      <Wall position={[0, 5.9, -5]} size={[26, 0.22, 31]} color="#1c1016" />
      <Text position={[0, 4.35, 9.1]} rotation={[0, Math.PI, 0]} fontSize={0.42} color="#f3c6d8" anchorX="center" letterSpacing={0.15}>EXIT</Text>
      <mesh position={[-2.1, 2.2, 9.65]}><boxGeometry args={[3.9, 4.4, 0.18]} /><meshStandardMaterial color="#6f334b" metalness={0.2} roughness={0.28} transparent opacity={0.58} /></mesh>
      <mesh position={[2.1, 2.2, 9.65]}><boxGeometry args={[3.9, 4.4, 0.18]} /><meshStandardMaterial color="#6f334b" metalness={0.2} roughness={0.28} transparent opacity={0.58} /></mesh>
      <mesh position={[0, 3.2, 3.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.075, 18, 96]} /><meshStandardMaterial color="#ffc2d8" emissive="#ff478d" emissiveIntensity={3.5} metalness={0.75} roughness={0.12} />
      </mesh>
      <Sparkles position={[0, 3.2, 3.2]} count={32} scale={4} size={1.2} speed={0.25} color="#ffb5d0" />
      <Text position={[0, 5, 3.2]} fontSize={0.52} color="#fff4f8" anchorX="center" letterSpacing={0.1}>PINK HALO</Text>
    </group>
  );
}

function roomAt(x: number, z: number): string | null {
  for (const room of ROOMS) {
    const [width, depth] = room.size;
    if (Math.abs(x - room.position[0]) < width / 2 - 0.2 && Math.abs(z - room.position[2]) < depth / 2 - 0.2) return room.name;
  }
  return null;
}

function Player({ active, movement, onRoomChange, onExitChange }: Omit<PinkHaloSceneProps, 'products'>) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const currentRoom = useRef<string | null>(null);
  const atExit = useRef(false);
  const elapsed = useRef(0);
  const touchPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { camera.position.set(0, 1.65, 7.4); camera.rotation.order = 'YXZ'; }, [camera]);
  useEffect(() => {
    if (!active) return;
    const canvas = gl.domElement;
    const down = (event: KeyboardEvent) => { keys.current[event.code] = true; };
    const up = (event: KeyboardEvent) => { keys.current[event.code] = false; };
    const look = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      yaw.current -= event.movementX * 0.0018;
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.0015, -1.15, 1.15);
    };
    const lock = () => { if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.(); };
    const touchStart = (event: TouchEvent) => { const touch = event.touches[0]; if (touch) touchPoint.current = { x: touch.clientX, y: touch.clientY }; };
    const touchMove = (event: TouchEvent) => {
      const touch = event.touches[0]; if (!touch || !touchPoint.current) return;
      yaw.current -= (touch.clientX - touchPoint.current.x) * 0.004;
      pitch.current = THREE.MathUtils.clamp(pitch.current - (touch.clientY - touchPoint.current.y) * 0.003, -1.15, 1.15);
      touchPoint.current = { x: touch.clientX, y: touch.clientY };
    };
    const touchEnd = () => { touchPoint.current = null; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); document.addEventListener('mousemove', look);
    canvas.addEventListener('click', lock); canvas.addEventListener('touchstart', touchStart, { passive: true });
    canvas.addEventListener('touchmove', touchMove, { passive: true }); canvas.addEventListener('touchend', touchEnd);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); document.removeEventListener('mousemove', look);
      canvas.removeEventListener('click', lock); canvas.removeEventListener('touchstart', touchStart); canvas.removeEventListener('touchmove', touchMove); canvas.removeEventListener('touchend', touchEnd);
    };
  }, [active, gl]);

  useFrame((_, delta) => {
    if (!active) return;
    camera.rotation.set(pitch.current, yaw.current, 0);
    const input = movement.current;
    const forward = keys.current.KeyW || keys.current.ArrowUp || input.forward;
    const backward = keys.current.KeyS || keys.current.ArrowDown || input.backward;
    const left = keys.current.KeyA || keys.current.ArrowLeft || input.left;
    const right = keys.current.KeyD || keys.current.ArrowRight || input.right;
    const z = Number(backward) - Number(forward); const x = Number(right) - Number(left);
    if (x || z) {
      const direction = new THREE.Vector3(x, 0, z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      camera.position.addScaledVector(direction, Math.min(delta, 0.05) * 4.5);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -12.5, 12.5);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -20.1, 9.15);
      elapsed.current += delta * 10; camera.position.y = 1.65 + Math.sin(elapsed.current) * 0.026;
    } else camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.65, delta * 8);

    const nextRoom = roomAt(camera.position.x, camera.position.z);
    if (nextRoom !== currentRoom.current) { currentRoom.current = nextRoom; onRoomChange(nextRoom); }
    const nextExit = camera.position.z > 7.8 && Math.abs(camera.position.x) < 3.6;
    if (nextExit !== atExit.current) { atExit.current = nextExit; onExitChange(nextExit); }
  });
  return null;
}

interface PinkHaloSceneProps {
  active: boolean;
  products: Product[];
  movement: MutableRefObject<TouchMovement>;
  onRoomChange: (name: string | null) => void;
  onExitChange: (near: boolean) => void;
}

function StoreScene(props: PinkHaloSceneProps) {
  return (
    <>
      <color attach="background" args={['#140b10']} /><fog attach="fog" args={['#211219', 18, 42]} />
      <ambientLight intensity={1.1} color="#ffe0eb" /><hemisphereLight args={['#ffe9f0', '#241018', 1.35]} />
      <spotLight position={[0, 5.6, 5]} angle={0.9} penumbra={0.7} intensity={80} color="#ffd6e5" castShadow />
      <MainHall />
      {ROOMS.map(room => <DepartmentRoom key={room.name} room={room} products={props.products} />)}
      <Player active={props.active} movement={props.movement} onRoomChange={props.onRoomChange} onExitChange={props.onExitChange} />
    </>
  );
}

export default function PinkHaloScene(props: PinkHaloSceneProps) {
  const gl = useMemo(() => ({ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }), []);
  return <Canvas className="world-canvas" camera={{ position: [0, 1.65, 7.4], fov: 68, near: 0.05, far: 65 }} gl={gl} dpr={[1, 1.6]} shadows><StoreScene {...props} /></Canvas>;
}
