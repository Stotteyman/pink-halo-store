import { Component, MutableRefObject, ReactNode, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Text, useGLTF } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';
import * as THREE from 'three';
import { Product } from '../../lib/types';
import garmentRackUrl from '../../assets/models/garment-rack.glb';
import conciergeDeskUrl from '../../assets/models/concierge-desk.glb';
import conciergeTableUrl from '../../assets/models/concierge-table.glb';
import planterUrl from '../../assets/models/planter.glb';
import haloChandelierUrl from '../../assets/models/halo-chandelier.glb';

useGLTF.preload(garmentRackUrl);
useGLTF.preload(conciergeDeskUrl);
useGLTF.preload(conciergeTableUrl);
useGLTF.preload(planterUrl);
useGLTF.preload(haloChandelierUrl);

function LoadedModel({ url, ...props }: { url: string } & GroupProps) {
  const { scene } = useGLTF(url);
  const instance = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={instance} {...props} />;
}

class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function ModeledFixture(props: { url: string } & GroupProps) {
  return <ModelErrorBoundary><Suspense fallback={null}><LoadedModel {...props} /></Suspense></ModelErrorBoundary>;
}

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

type NpcDefinition = {
  id: string;
  label: string;
  category: Product['category'];
  position: [number, number, number];
};

const ROOMS: RoomDefinition[] = [
  { name: 'The Dress Room', category: 'Dresses', position: [-7.55, 0, -1.4], size: [7, 7.2], entrance: 'right', color: '#f096b8', subtitle: 'THE DRESS ROOM' },
  { name: 'The Tops Room', category: 'Tops', position: [7.55, 0, -1.4], size: [7, 7.2], entrance: 'left', color: '#c7a1e8', subtitle: 'THE TOPS ROOM' },
  { name: 'The Lounge', category: 'Lounge', position: [-7.55, 0, -9.6], size: [7, 7.2], entrance: 'right', color: '#e9a7bb', subtitle: 'THE LOUNGE' },
  { name: 'The Accessories Room', category: 'Accessories', position: [7.55, 0, -9.6], size: [7, 7.2], entrance: 'left', color: '#dcb969', subtitle: 'ACCESSORIES' },
  { name: 'The Archive', category: 'Sale', position: [0, 0, -17.1], size: [8, 5.8], entrance: 'front', color: '#cf7180', subtitle: 'THE ARCHIVE' },
];

const NPCS: NpcDefinition[] = [
  { id: 'npc-dresses', label: 'Dresses stylist', category: 'Dresses', position: [-9.65, 0, -1.4] },
  { id: 'npc-tops', label: 'Tops stylist', category: 'Tops', position: [9.65, 0, -1.4] },
  { id: 'npc-lounge', label: 'Lounge curator', category: 'Lounge', position: [-9.65, 0, -9.6] },
  { id: 'npc-accessories', label: 'Accessories expert', category: 'Accessories', position: [9.65, 0, -9.6] },
  { id: 'npc-sale', label: 'Sale archivist', category: 'Sale', position: [2.6, 0, -17.1] },
];

const DONATION_PIG_POSITION: [number, number, number] = [3.25, 0, 5.55];

type BoxCollider = { minX: number; maxX: number; minZ: number; maxZ: number };

const PLAYER_RADIUS = 0.32;

function boxCollider(x: number, z: number, width: number, depth: number): BoxCollider {
  return { minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 };
}

function buildStoreColliders(): BoxCollider[] {
  const colliders: BoxCollider[] = [
    boxCollider(-11.25, -5.4, 0.35, 30),
    boxCollider(11.25, -5.4, 0.35, 30),
    boxCollider(-2.1, 9.65, 3.9, 0.18),
    boxCollider(2.1, 9.65, 3.9, 0.18),
    boxCollider(-2.75, 4.75, 2.4, 0.9),
    boxCollider(2.75, 3.25, 2.5, 0.8),
    boxCollider(-3.35, 7.15, 0.65, 0.65),
    boxCollider(3.35, 7.15, 0.65, 0.65),
    boxCollider(DONATION_PIG_POSITION[0], DONATION_PIG_POSITION[2], 1.1, 0.85),
  ];

  for (const room of ROOMS) {
    const [roomX, , roomZ] = room.position;
    const [width, depth] = room.size;
    colliders.push(boxCollider(roomX, roomZ - depth / 2, width, 0.28));

    if (room.entrance === 'left' || room.entrance === 'right') {
      const entryX = roomX + (room.entrance === 'left' ? -width / 2 : width / 2);
      const oppositeX = roomX + (room.entrance === 'left' ? width / 2 : -width / 2);
      colliders.push(boxCollider(oppositeX, roomZ, 0.28, depth));
      colliders.push(boxCollider(entryX, roomZ - depth / 2 + 1.15, 0.28, 2.3));
      colliders.push(boxCollider(entryX, roomZ + depth / 2 - 1.15, 0.28, 2.3));
      colliders.push(boxCollider(roomX, roomZ + depth / 2, width, 0.28));
    } else {
      colliders.push(boxCollider(roomX - width / 2, roomZ, 0.28, depth));
      colliders.push(boxCollider(roomX + width / 2, roomZ, 0.28, depth));
      colliders.push(boxCollider(roomX - width / 2 + 1, roomZ + depth / 2, 2, 0.28));
      colliders.push(boxCollider(roomX + width / 2 - 1, roomZ + depth / 2, 2, 0.28));
    }

    // Both display racks have solid bases and should stop the player.
    const rackZ = depth / 2 - 1.2;
    colliders.push(boxCollider(roomX, roomZ - rackZ, 3.1, 0.72));
    colliders.push(boxCollider(roomX, roomZ + rackZ, 3.1, 0.72));
  }

  return colliders;
}

const STORE_COLLIDERS = buildStoreColliders();

function circleIntersectsBox(x: number, z: number, radius: number, box: BoxCollider): boolean {
  const closestX = THREE.MathUtils.clamp(x, box.minX, box.maxX);
  const closestZ = THREE.MathUtils.clamp(z, box.minZ, box.maxZ);
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

function playerPositionBlocked(x: number, z: number): boolean {
  if (x < -10.8 || x > 10.8 || z < -19.65 || z > 9.15) return true;
  if (STORE_COLLIDERS.some(collider => circleIntersectsBox(x, z, PLAYER_RADIUS, collider))) return true;

  return NPCS.some(npc => {
    const dx = x - npc.position[0];
    const dz = z - npc.position[2];
    const combinedRadius = PLAYER_RADIUS + 0.34;
    return dx * dx + dz * dz < combinedRadius * combinedRadius;
  });
}

function Wall({ position, size, color = '#3d222e' }: { position: [number, number, number]; size: [number, number, number]; color?: string }) {
  return <mesh position={position} receiveShadow castShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.74} /></mesh>;
}

function GarmentRack({ position, products, color }: { position: [number, number, number]; products: Product[]; color: string }) {
  return (
    <group position={position}>
      <ModeledFixture url={garmentRackUrl} />
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

function EntranceFrame({ room }: { room: RoomDefinition }) {
  const [width, depth] = room.size;
  const sideEntrance = room.entrance !== 'front';
  const entryX = room.entrance === 'left' ? -width / 2 : width / 2;
  const frameMaterial = <meshStandardMaterial color="#d5ad78" metalness={0.55} roughness={0.28} />;

  if (sideEntrance) {
    const rotationY = room.entrance === 'right' ? Math.PI / 2 : -Math.PI / 2;
    return <group>
      <mesh position={[entryX, 2.1, -1.55]}>{<boxGeometry args={[0.12, 4.2, 0.12]} />}{frameMaterial}</mesh>
      <mesh position={[entryX, 2.1, 1.55]}>{<boxGeometry args={[0.12, 4.2, 0.12]} />}{frameMaterial}</mesh>
      <mesh position={[entryX, 4.15, 0]}>{<boxGeometry args={[0.12, 0.12, 3.2]} />}{frameMaterial}</mesh>
      <Text position={[entryX + (room.entrance === 'right' ? 0.08 : -0.08), 3.72, 0]} rotation={[0, rotationY, 0]} fontSize={0.22} color="#fff4f8" anchorX="center" letterSpacing={0.06}>{room.subtitle}</Text>
    </group>;
  }

  return <group>
    <mesh position={[-1.55, 2.1, depth / 2]}><boxGeometry args={[0.12, 4.2, 0.12]} />{frameMaterial}</mesh>
    <mesh position={[1.55, 2.1, depth / 2]}><boxGeometry args={[0.12, 4.2, 0.12]} />{frameMaterial}</mesh>
    <mesh position={[0, 4.15, depth / 2]}><boxGeometry args={[3.2, 0.12, 0.12]} />{frameMaterial}</mesh>
    <Text position={[0, 3.72, depth / 2 + 0.08]} fontSize={0.24} color="#fff4f8" anchorX="center" letterSpacing={0.08}>{room.subtitle}</Text>
  </group>;
}

function DepartmentRoom({ room, products }: { room: RoomDefinition; products: Product[] }) {
  const [width, depth] = room.size;
  const wallColor = '#4a2a38';
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
          <Wall position={[0, 2.7, depth / 2]} size={[width, 5.4, 0.28]} color={wallColor} />
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

      <EntranceFrame room={room} />
      <pointLight position={[0, 4.4, 0]} intensity={20} distance={8} color={room.color} />
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.3, 40]} /><meshStandardMaterial color={room.color} roughness={0.95} transparent opacity={0.22} /></mesh>
      <GarmentRack position={[0, 0, -depth / 2 + 1.2]} products={localProducts} color={room.color} />
      <GarmentRack position={[0, 0, depth / 2 - 1.2]} products={localProducts.slice(7)} color={room.color} />
      {localProducts.length === 0 && <EmptyRoomNotice color={room.color} />}
    </group>
  );
}

function Npc({ npc }: { npc: NpcDefinition }) {
  return (
    <group position={npc.position}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.7, 8, 16]} />
        <meshStandardMaterial color="#f6d5e4" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#ffe8f1" roughness={0.45} />
      </mesh>
      <Text position={[0, 2.1, 0]} fontSize={0.14} color="#fff4f8" anchorX="center">
        {npc.label}
      </Text>
      <Text position={[0, 1.95, 0]} fontSize={0.1} color="#ffc7dc" anchorX="center">
        Press E to interact
      </Text>
      <pointLight position={[0, 1.8, 0]} intensity={8} distance={3} color="#ffb4d5" />
    </group>
  );
}

function DonationPig() {
  return <group position={DONATION_PIG_POSITION}>
    <mesh position={[0, 0.72, 0]} castShadow><sphereGeometry args={[0.55, 24, 18]} /><meshStandardMaterial color="#f39bbb" roughness={0.58} /></mesh>
    <mesh position={[0, 0.7, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.22, 0.27, 0.28, 18]} /><meshStandardMaterial color="#f7b0c8" roughness={0.5} /></mesh>
    <mesh position={[-0.12, 0.73, 0.66]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#6f334b" /></mesh>
    <mesh position={[0.12, 0.73, 0.66]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#6f334b" /></mesh>
    <mesh position={[-0.3, 1.13, 0]} rotation={[0, 0, -0.25]}><coneGeometry args={[0.16, 0.28, 3]} /><meshStandardMaterial color="#f39bbb" /></mesh>
    <mesh position={[0.3, 1.13, 0]} rotation={[0, 0, 0.25]}><coneGeometry args={[0.16, 0.28, 3]} /><meshStandardMaterial color="#f39bbb" /></mesh>
    {[-0.3, 0.3].flatMap(x => [-0.28, 0.28].map(z => <mesh key={`${x}-${z}`} position={[x, 0.24, z]}><cylinderGeometry args={[0.09, 0.11, 0.34, 10]} /><meshStandardMaterial color="#e986a9" /></mesh>))}
    <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.3, 0.025, 0.06]} /><meshStandardMaterial color="#5f3443" metalness={0.4} /></mesh>
    <Text position={[0, 1.72, 0]} fontSize={0.15} color="#fff4f8" anchorX="center">DONATION PIGGY BANK</Text>
    <Text position={[0, 1.5, 0]} fontSize={0.1} color="#ffc7dc" anchorX="center">Press E to donate</Text>
    <pointLight position={[0, 1.2, 0]} intensity={7} distance={3} color="#ff9fc4" />
  </group>;
}

function Planter({ position }: { position: [number, number, number] }) {
  return <ModeledFixture url={planterUrl} position={position} />;
}

function ConciergeArea() {
  return <group>
    <group position={[-2.75, 0, 4.75]}>
      <ModeledFixture url={conciergeDeskUrl} />
      <Text position={[0, 0.55, 0.47]} fontSize={0.14} color="#ffe8f0" anchorX="center" letterSpacing={0.12}>WELCOME</Text>
    </group>
    <ModeledFixture url={conciergeTableUrl} position={[2.75, 0, 3.25]} />
    <Planter position={[-3.35, 0, 7.15]} /><Planter position={[3.35, 0, 7.15]} />
  </group>;
}

function MainHall() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4.8]} receiveShadow>
        <planeGeometry args={[8.15, 29]} /><meshStandardMaterial color="#d9cbc5" roughness={0.52} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, -5.2]}><planeGeometry args={[2.15, 27.5]} /><meshStandardMaterial color="#a95e78" roughness={0.92} /></mesh>
      <Wall position={[-11.25, 3, -5.4]} size={[0.35, 6, 30]} />
      <Wall position={[11.25, 3, -5.4]} size={[0.35, 6, 30]} />
      <Wall position={[0, 5.9, -5.4]} size={[22.5, 0.22, 30]} color="#2b1720" />
      <Text position={[0, 4.35, 9.1]} rotation={[0, Math.PI, 0]} fontSize={0.42} color="#f3c6d8" anchorX="center" letterSpacing={0.15}>EXIT</Text>
      <mesh position={[-2.1, 2.2, 9.65]}><boxGeometry args={[3.9, 4.4, 0.18]} /><meshStandardMaterial color="#6f334b" metalness={0.2} roughness={0.28} transparent opacity={0.58} /></mesh>
      <mesh position={[2.1, 2.2, 9.65]}><boxGeometry args={[3.9, 4.4, 0.18]} /><meshStandardMaterial color="#6f334b" metalness={0.2} roughness={0.28} transparent opacity={0.58} /></mesh>
      <ModeledFixture url={haloChandelierUrl} position={[0, 3.05, 4.8]} />
      <Sparkles position={[0, 3.05, 4.8]} count={18} scale={2.4} size={0.8} speed={0.2} color="#ffb5d0" />
      <Text position={[0, 4.08, 4.8]} fontSize={0.34} color="#fff4f8" anchorX="center" letterSpacing={0.1}>PINK HALO</Text>
      <ConciergeArea />
      {[-3.7, -8.4, -13.1].map(z => <group key={z} position={[0, 5.55, z]}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.42, 0.42, 0.08, 24]} /><meshStandardMaterial color="#e9c9a0" emissive="#ffd9aa" emissiveIntensity={1.5} /></mesh><pointLight position={[0, -0.5, 0]} intensity={18} distance={7} color="#ffd9c3" /></group>)}
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

function Player({ active, movement, initialPosition, onRoomChange, onExitChange, onNpcFocus, onNpcInteract, onDonationFocus, onDonationInteract, onPlayerPosition, onFootstep, onStep }: Omit<PinkHaloSceneProps, 'products'>) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const currentRoom = useRef<string | null>(null);
  const atExit = useRef(false);
  const elapsed = useRef(0);
  const touchPoint = useRef<{ x: number; y: number } | null>(null);
  const focusedNpc = useRef<string | null>(null);
  const donationFocused = useRef(false);
  const positionReportElapsed = useRef(0);
  const stepDistance = useRef(0);

  useEffect(() => {
    camera.position.set(initialPosition?.x ?? 0, 1.65, initialPosition?.z ?? 7.4);
    camera.rotation.order = 'YXZ';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);
  useEffect(() => {
    if (!active) return;
    const canvas = gl.domElement;
    const down = (event: KeyboardEvent) => { keys.current[event.code] = true; };
    const up = (event: KeyboardEvent) => { keys.current[event.code] = false; };
    let dragging = false;
    let dragPoint: { x: number; y: number } | null = null;
    const dragStart = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || document.pointerLockElement === canvas) return;
      dragging = true;
      dragPoint = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture?.(event.pointerId);
    };
    const dragLook = (event: PointerEvent) => {
      if (!dragging || !dragPoint) return;
      yaw.current -= (event.clientX - dragPoint.x) * 0.004;
      pitch.current = THREE.MathUtils.clamp(pitch.current - (event.clientY - dragPoint.y) * 0.003, -1.15, 1.15);
      dragPoint = { x: event.clientX, y: event.clientY };
    };
    const dragEnd = () => { dragging = false; dragPoint = null; };
    const lockedLook = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      yaw.current -= event.movementX * 0.0018;
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.0015, -1.15, 1.15);
    };
    const requestLock = () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    };
    const interact = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE') return;
      if (donationFocused.current) { onDonationInteract(); return; }
      if (focusedNpc.current) {
        const npc = NPCS.find(item => item.id === focusedNpc.current);
        if (npc) onNpcInteract(npc.category, npc.label);
      }
    };
    // Touches are global to the screen, not scoped to the canvas, so grabbing
    // touches[0] would pick up a finger held on a movement button elsewhere.
    // Track this drag's own identifier so look and move work simultaneously.
    let lookTouchId: number | null = null;
    const touchStart = (event: TouchEvent) => {
      if (lookTouchId !== null) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      lookTouchId = touch.identifier;
      touchPoint.current = { x: touch.clientX, y: touch.clientY };
    };
    const touchMove = (event: TouchEvent) => {
      if (lookTouchId === null || !touchPoint.current) return;
      const touch = Array.from(event.touches).find(candidate => candidate.identifier === lookTouchId);
      if (!touch) return;
      yaw.current -= (touch.clientX - touchPoint.current.x) * 0.004;
      pitch.current = THREE.MathUtils.clamp(pitch.current - (touch.clientY - touchPoint.current.y) * 0.003, -1.15, 1.15);
      touchPoint.current = { x: touch.clientX, y: touch.clientY };
    };
    const touchEnd = (event: TouchEvent) => {
      if (lookTouchId === null) return;
      const stillDown = Array.from(event.touches).some(candidate => candidate.identifier === lookTouchId);
      if (!stillDown) { lookTouchId = null; touchPoint.current = null; }
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('keydown', interact);
    document.addEventListener('mousemove', lockedLook);
    canvas.addEventListener('click', requestLock);
    canvas.addEventListener('pointerdown', dragStart); canvas.addEventListener('pointermove', dragLook); canvas.addEventListener('pointerup', dragEnd); canvas.addEventListener('pointercancel', dragEnd);
    canvas.addEventListener('touchstart', touchStart, { passive: true });
    canvas.addEventListener('touchmove', touchMove, { passive: true }); canvas.addEventListener('touchend', touchEnd);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('keydown', interact);
      document.removeEventListener('mousemove', lockedLook);
      canvas.removeEventListener('click', requestLock);
      canvas.removeEventListener('pointerdown', dragStart); canvas.removeEventListener('pointermove', dragLook); canvas.removeEventListener('pointerup', dragEnd); canvas.removeEventListener('pointercancel', dragEnd);
      canvas.removeEventListener('touchstart', touchStart); canvas.removeEventListener('touchmove', touchMove); canvas.removeEventListener('touchend', touchEnd);
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
      const startX = camera.position.x;
      const startZ = camera.position.z;
      const direction = new THREE.Vector3(x, 0, z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      const distance = Math.min(delta, 0.05) * 4.5;
      const nextX = camera.position.x + direction.x * distance;
      const nextZ = camera.position.z + direction.z * distance;

      // Resolve each axis separately so the player slides along walls instead of sticking.
      if (!playerPositionBlocked(nextX, camera.position.z)) camera.position.x = nextX;
      if (!playerPositionBlocked(camera.position.x, nextZ)) camera.position.z = nextZ;
      stepDistance.current += Math.hypot(camera.position.x - startX, camera.position.z - startZ);
      while (stepDistance.current >= 1.1) {
        stepDistance.current -= 1.1;
        onFootstep();
        onStep();
      }
      elapsed.current += delta * 10; camera.position.y = 1.65 + Math.sin(elapsed.current) * 0.026;
    } else camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.65, delta * 8);

    const nextRoom = roomAt(camera.position.x, camera.position.z);
    if (nextRoom !== currentRoom.current) { currentRoom.current = nextRoom; onRoomChange(nextRoom); }
    const nextExit = camera.position.z > 7.8 && Math.abs(camera.position.x) < 3.6;
    if (nextExit !== atExit.current) { atExit.current = nextExit; onExitChange(nextExit); }

    const donationDistance = Math.hypot(camera.position.x - DONATION_PIG_POSITION[0], camera.position.z - DONATION_PIG_POSITION[2]);
    const nextDonationFocused = donationDistance <= 2.25;
    if (nextDonationFocused !== donationFocused.current) {
      donationFocused.current = nextDonationFocused;
      onDonationFocus(nextDonationFocused);
    }

    positionReportElapsed.current += delta;
    if (positionReportElapsed.current >= 0.1) {
      positionReportElapsed.current = 0;
      onPlayerPosition(camera.position.x, camera.position.z);
    }

    let nearestNpc: NpcDefinition | null = null;
    let nearestDistance = Infinity;
    for (const npc of NPCS) {
      const distance = new THREE.Vector3(npc.position[0], 1.65, npc.position[2]).distanceTo(camera.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestNpc = npc;
      }
    }
    const nextFocused = nearestNpc && nearestDistance <= 2.5 ? nearestNpc.id : null;
    if (nextFocused !== focusedNpc.current) {
      focusedNpc.current = nextFocused;
      if (!nextFocused) {
        onNpcFocus(null, null);
      } else {
        const npc = NPCS.find(item => item.id === nextFocused) || null;
        onNpcFocus(npc?.category || null, npc?.label || null);
      }
    }
  });
  return null;
}

interface PinkHaloSceneProps {
  active: boolean;
  products: Product[];
  movement: MutableRefObject<TouchMovement>;
  initialPosition?: { x: number; z: number };
  onRoomChange: (name: string | null) => void;
  onExitChange: (near: boolean) => void;
  onNpcFocus: (category: Product['category'] | null, label: string | null) => void;
  onNpcInteract: (category: Product['category'], label: string) => void;
  onDonationFocus: (focused: boolean) => void;
  onDonationInteract: () => void;
  onPlayerPosition: (x: number, z: number) => void;
  onFootstep: () => void;
  onStep: () => void;
}

function StoreScene(props: PinkHaloSceneProps) {
  return (
    <>
      <color attach="background" args={['#140b10']} /><fog attach="fog" args={['#211219', 18, 42]} />
      <ambientLight intensity={1.65} color="#ffe0eb" /><hemisphereLight args={['#fff0f4', '#3a1b27', 1.8]} />
      <spotLight position={[0, 5.6, 5]} angle={0.95} penumbra={0.75} intensity={95} color="#ffd6e5" castShadow />
      <MainHall />
      {ROOMS.map(room => <DepartmentRoom key={room.name} room={room} products={props.products} />)}
      {NPCS.map(npc => <Npc key={npc.id} npc={npc} />)}
      <DonationPig />
      <Player
        active={props.active}
        movement={props.movement}
        initialPosition={props.initialPosition}
        onRoomChange={props.onRoomChange}
        onExitChange={props.onExitChange}
        onNpcFocus={props.onNpcFocus}
        onNpcInteract={props.onNpcInteract}
        onDonationFocus={props.onDonationFocus}
        onDonationInteract={props.onDonationInteract}
        onPlayerPosition={props.onPlayerPosition}
        onFootstep={props.onFootstep}
        onStep={props.onStep}
      />
    </>
  );
}

export default function PinkHaloScene(props: PinkHaloSceneProps) {
  const gl = useMemo(() => ({ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }), []);
  const startPosition: [number, number, number] = [props.initialPosition?.x ?? 0, 1.65, props.initialPosition?.z ?? 7.4];
  return <Canvas className="world-canvas" camera={{ position: startPosition, fov: 68, near: 0.05, far: 65 }} gl={gl} dpr={[1, 1.6]} shadows><StoreScene {...props} /></Canvas>;
}
