import React, { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import './App.css';

type CarKey = 'coupe90' | 'gt46';
type SpoilerType = 'stock' | 'big_wing' | 'none';

function useKeyboard() {
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true;
          break;
        case 'Space':
          keys.current.brake = true;
          break;
        default:
          break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false;
          break;
        case 'Space':
          keys.current.brake = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return keys;
}

function Ground() {
  usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }));

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[800, 800]} />
      <meshStandardMaterial color="#1a1a1a" />
    </mesh>
  );
}

function RoadStrip() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#1d1d1d" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[5.5, 120]} />
        <meshStandardMaterial color="#2c2c2c" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
        <planeGeometry args={[0.3, 120]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
    </group>
  );
}

function Wheel({ radius = 0.38 }: { radius?: number }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, 0.44, 28]} />
        <meshStandardMaterial color="#090909" metalness={0.8} roughness={0.38} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.03]}>
        <cylinderGeometry args={[radius * 0.38, radius * 0.38, 0.4, 18]} />
        <meshStandardMaterial color="#d4d4d4" metalness={0.96} roughness={0.18} />
      </mesh>
    </group>
  );
}

function CarShell({
  color = '#e84545',
  width = 2,
  height = 0.62,
  length = 4,
}: {
  color?: string;
  width?: number;
  height?: number;
  length?: number;
}) {
  return (
    <group>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={color} metalness={0.62} roughness={0.28} />
      </mesh>

      <mesh position={[0, 0.92, 0.2]} castShadow>
        <boxGeometry args={[width * 0.9, height * 0.76, length * 0.6]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.22} />
      </mesh>

      <mesh position={[0, 0.82, 0.18]}>
        <boxGeometry args={[width * 0.82, height * 0.42, length * 0.5]} />
        <meshStandardMaterial color="#0d1a2e" metalness={0.12} roughness={0.12} transparent opacity={0.9} />
      </mesh>

      <mesh position={[0, 0.56, -length * 0.38]}>
        <boxGeometry args={[width * 0.9, height * 0.18, length * 0.28]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.24} />
      </mesh>

      <mesh position={[0, 0.56, length * 0.4]}>
        <boxGeometry args={[width * 0.8, height * 0.14, length * 0.22]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.24} />
      </mesh>
    </group>
  );
}

function DetailedCarVisual({ variant, spoiler }: { variant: CarKey; spoiler: SpoilerType }) {
  const isGT = variant === 'gt46';
  const width = isGT ? 2.08 : 1.95;
  const length = isGT ? 4.28 : 3.9;
  const height = isGT ? 0.64 : 0.58;
  const color = isGT ? '#2a9df4' : '#d64539';

  return (
    <group>
      <CarShell color={color} width={width} height={height} length={length} />

      <mesh position={[-width * 0.49, 0.45, -length * 0.6]} castShadow>
        <boxGeometry args={[0.52, 0.28, 0.82]} />
        <meshStandardMaterial color={color} metalness={0.56} roughness={0.25} />
      </mesh>
      <mesh position={[width * 0.49, 0.45, -length * 0.6]} castShadow>
        <boxGeometry args={[0.52, 0.28, 0.82]} />
        <meshStandardMaterial color={color} metalness={0.56} roughness={0.25} />
      </mesh>

      <mesh position={[0, 0.48, -length * 0.95]} castShadow>
        <boxGeometry args={[width * 0.84, 0.22, 0.3]} />
        <meshStandardMaterial color="#090909" metalness={0.65} roughness={0.42} />
      </mesh>

      <mesh position={[width * 0.62, 0.9, -0.05]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.22]} />
        <meshStandardMaterial color="#090909" />
      </mesh>
      <mesh position={[-width * 0.62, 0.9, -0.05]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.22]} />
        <meshStandardMaterial color="#090909" />
      </mesh>

      {spoiler !== 'none' && (
        <mesh position={[0, 1.0, length * 0.52]} castShadow>
          <boxGeometry args={[width * 0.9, 0.06, 0.18]} />
          <meshStandardMaterial color="#090909" />
        </mesh>
      )}

      {spoiler === 'big_wing' && (
        <group>
          <mesh position={[0, 1.2, length * 0.64]} castShadow>
            <boxGeometry args={[width * 1.1, 0.08, 0.42]} />
            <meshStandardMaterial color="#050505" />
          </mesh>
          <mesh position={[0, 0.95, length * 0.5]} castShadow>
            <boxGeometry args={[0.08, 0.48, 0.08]} />
            <meshStandardMaterial color="#050505" />
          </mesh>
        </group>
      )}

      <group>
        <mesh position={[-width * 0.82, 0.18, -length * 0.36]}>
          <Wheel />
        </mesh>
        <mesh position={[width * 0.82, 0.18, -length * 0.36]}>
          <Wheel />
        </mesh>
        <mesh position={[-width * 0.82, 0.18, length * 0.36]}>
          <Wheel />
        </mesh>
        <mesh position={[width * 0.82, 0.18, length * 0.36]}>
          <Wheel />
        </mesh>
      </group>
    </group>
  );
}

function PhysicsCar({ variant, spoiler, externalRef }: { variant: CarKey; spoiler: SpoilerType; externalRef?: React.RefObject<any> }) {
  const [ref, api] = useBox(() => ({
    mass: 1200,
    position: [0, 0.95, 0],
    args: [2.1, 0.8, 4.2],
    angularDamping: 0.82,
    linearDamping: 0.14,
  }));

  useEffect(() => {
    if (!externalRef) return;
    // @ts-ignore
    externalRef.current = ref.current;
  }, [externalRef, ref]);

  const keys = useKeyboard();
  const velocity = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    const unsub = api.velocity.subscribe((v) => {
      velocity.current = v as [number, number, number];
    });
    return unsub;
  }, [api]);

  useFrame(() => {
    const state = keys.current;
    const forward = state.forward ? 1 : state.backward ? -1 : 0;
    const steer = state.left ? 1 : state.right ? -1 : 0;
    const handbrake = state.brake;

    const directionMultiplier = forward === -1 ? 0.6 : 1;
    const baseEngineForce = 3000;
    const engineMultiplier = variant === 'gt46' ? 1.25 : 1.0;
    const engineForce = baseEngineForce * engineMultiplier * directionMultiplier * forward;

    if (engineForce !== 0) {
      (api as any).applyLocalForce([0, 0, -engineForce], [0, 0, 0]);
    } else {
      const speed = Math.hypot(...velocity.current);
      if (speed > 0.1) {
        const brakeForce = Math.min(400, speed * 80);
        (api as any).applyLocalForce([0, 0, brakeForce * 0.25], [0, 0, 0]);
      }
    }

    const forwardSpeed = -velocity.current[2] || 0;
    const speedFactor = Math.max(0.08, Math.min(1, 1 - Math.abs(forwardSpeed) / 40));
    const steerTorque = steer * 720 * speedFactor;
    if (steerTorque !== 0) {
      (api as any).applyLocalTorque([0, steerTorque, 0]);
    }

    if (handbrake) {
      const lateralPush = (steer || Math.sign(velocity.current[0] || 0)) * 1800;
      (api as any).applyLocalForce([lateralPush, 0, 720], [0, -0.2, -1.6]);
      if (engineForce !== 0) {
        (api as any).applyLocalForce([0, 0, engineForce * -0.28], [0, 0, 0]);
      }
    }
  });

  return (
    <group ref={ref}>
      <DetailedCarVisual variant={variant} spoiler={spoiler} />
    </group>
  );
}

function FollowCamera({ targetRef }: { targetRef: React.RefObject<any> | null }) {
  useFrame(({ camera }) => {
    if (!targetRef || !targetRef.current) return;

    const pos = new THREE.Vector3();
    (targetRef.current as THREE.Object3D).getWorldPosition(pos);
    const desired = pos.clone().add(new THREE.Vector3(0, 4.8, 10.0));
    camera.position.lerp(desired, 0.08);
    const lookAt = pos.clone().add(new THREE.Vector3(0, 1.2, 0));
    camera.lookAt(lookAt);
  });

  return null;
}

function GarageOverlay({
  selected,
  setSelected,
  spoiler,
  setSpoiler,
  engineStage,
  setEngineStage,
}: {
  selected: CarKey;
  setSelected: (car: CarKey) => void;
  spoiler: SpoilerType;
  setSpoiler: (value: SpoilerType) => void;
  engineStage: number;
  setEngineStage: (value: number | ((prev: number) => number)) => void;
}) {
  return (
    <div className="garage-overlay">
      <h3>Garage</h3>

      <div className="panel-block">
        <div className="label">Car</div>
        <div className="button-row">
          <button className={selected === 'coupe90' ? 'active' : ''} onClick={() => setSelected('coupe90')}>
            Coupe 90
          </button>
          <button className={selected === 'gt46' ? 'active' : ''} onClick={() => setSelected('gt46')}>
            GT 46
          </button>
        </div>
      </div>

      <div className="panel-block">
        <div className="label">Aero</div>
        <div className="button-row">
          <button className={spoiler === 'stock' ? 'active' : ''} onClick={() => setSpoiler('stock')}>
            Stock
          </button>
          <button className={spoiler === 'big_wing' ? 'active' : ''} onClick={() => setSpoiler('big_wing')}>
            Big Wing
          </button>
        </div>
      </div>

      <div className="panel-block">
        <div className="label">Engine stage: {engineStage}</div>
        <div className="button-row">
          <button onClick={() => setEngineStage((prev) => Math.min(3, prev + 1))}>Upgrade</button>
          <button onClick={() => setEngineStage(1)}>Reset</button>
        </div>
      </div>

      <div className="controls-hint">W / ↑ accelerate • S / ↓ reverse • A / D steer • Space drift</div>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState<CarKey>('coupe90');
  const [spoiler, setSpoiler] = useState<SpoilerType>('stock');
  const [engineStage, setEngineStage] = useState(1);
  const carRef = useRef<any>(null);

  return (
    <div className="game-shell">
      <GarageOverlay
        selected={selected}
        setSelected={setSelected}
        spoiler={spoiler}
        setSpoiler={setSpoiler}
        engineStage={engineStage}
        setEngineStage={setEngineStage}
      />

      <Canvas shadows camera={{ position: [0, 6, 12], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[12, 18, 10]} castShadow intensity={1.2} />
        <PerspectiveCamera makeDefault position={[0, 6, 12]} />
        <OrbitControls enablePan={false} enableZoom />

        <Suspense fallback={<Html center>Loading scene...</Html>}>
          <Physics gravity={[0, -9.81, 0]}>
            <Ground />
            <RoadStrip />
            <PhysicsCar variant={selected} spoiler={spoiler} externalRef={carRef} />
            <FollowCamera targetRef={carRef} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
