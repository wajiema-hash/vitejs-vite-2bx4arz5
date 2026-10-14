import React, { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
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
    const down = (e: KeyboardEvent) => {
      switch (e.code) {
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
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.code) {
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
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return keys;
}

function Ground() {
  usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }));
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  );
}

function RoadStripe({ z = 0 }: { z?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, z]}>
      <planeGeometry args={[6, 0.5]} />
      <meshStandardMaterial color="#eee" />
    </mesh>
  );
}

function Coupe90Visual({ spoiler }: { spoiler: SpoilerType }) {
  // compact, boxy look
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.9, 0.6, 3.8]} />
        <meshStandardMaterial color="#e84c3d" metalness={0.4} roughness={0.35} />
      </mesh>

      {/* hood / trunk slight offsets to change silhouette */}
      <mesh position={[0, 0.58, -1.3]} castShadow>
        <boxGeometry args={[1.6, 0.12, 0.9]} />
        <meshStandardMaterial color="#d84336" />
      </mesh>

      <mesh position={[0, 0.58, 1.2]} castShadow>
        <boxGeometry args={[1.4, 0.12, 0.7]} />
        <meshStandardMaterial color="#d84336" />
      </mesh>

      {/* simple spoiler mount (stock) */}
      {spoiler !== 'none' && (
        <mesh position={[0, 0.86, -1.7]}>
          <boxGeometry args={[1.4, 0.06, 0.22]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )}

      {spoiler === 'big_wing' && (
        <mesh position={[0, 1.05, -2.0]}>
          <boxGeometry args={[1.8, 0.08, 0.4]} />
          <meshStandardMaterial color="#0b0b0b" />
        </mesh>
      )}

      {/* wheels */}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = i < 2 ? -0.9 : 0.9;
        const z = i % 2 === 0 ? -1.4 : 1.4;
        return (
          <group key={i} position={[x, 0.18, z]} rotation={[0, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.36, 0.36, 0.4, 24]} />
              <meshStandardMaterial color="#111" metalness={0.6} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.03]}>
              <cylinderGeometry args={[0.16, 0.16, 0.38, 20]} />
              <meshStandardMaterial color="#cfcfcf" metalness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GT46Visual({ spoiler }: { spoiler: SpoilerType }) {
  // smoother, wider look compared to coupe
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.05, 0.62, 4.0]} />
        <meshStandardMaterial color="#2a9df4" metalness={0.35} roughness={0.3} />
      </mesh>

      {/* pronounced bumper */}
      <mesh position={[0, 0.6, -1.4]} castShadow>
        <boxGeometry args={[1.8, 0.14, 0.9]} />
        <meshStandardMaterial color="#2387d9" />
      </mesh>

      {/* slightly different spoiler shape */}
      {spoiler !== 'none' && (
        <mesh position={[0, 0.9, -1.75]}>
          <boxGeometry args={[1.5, 0.06, 0.28]} />
          <meshStandardMaterial color="#0b0b0b" />
        </mesh>
      )}
      {spoiler === 'big_wing' && (
        <mesh position={[0, 1.12, -2.05]}>
          <boxGeometry args={[2.0, 0.08, 0.48]} />
          <meshStandardMaterial color="#060606" />
        </mesh>
      )}

      {/* wheels */}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = i < 2 ? -1.05 : 1.05;
        const z = i % 2 === 0 ? -1.52 : 1.52;
        return (
          <group key={i} position={[x, 0.18, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.38, 0.38, 0.46, 24]} />
              <meshStandardMaterial color="#070707" metalness={0.6} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
              <cylinderGeometry args={[0.18, 0.18, 0.42, 20]} />
              <meshStandardMaterial color="#d6d6d6" metalness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ProceduralCar({ type, spoiler, externalRef, name }: { type: CarKey; spoiler: SpoilerType; externalRef?: React.RefObject<any>; name: string }) {
  const [ref, api] = useBox(() => ({
    mass: 1200,
    position: [0, 0.9, 0],
    args: [2.1, 0.8, 4.2],
    angularDamping: 0.8,
    linearDamping: 0.14,
  }));

  // sync external ref if provided
  useEffect(() => {
    if (!externalRef) return;
    if (typeof externalRef === 'object') {
      // @ts-ignore
      externalRef.current = ref.current;
    }
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
    const baseEngineForce = 2600;
    const engineMultiplier = type === 'gt46' ? 1.2 : 1.0;
    const engineForce = baseEngineForce * engineMultiplier * directionMultiplier * forward;

    if (engineForce !== 0) {
      (api as any).applyLocalForce([0, 0, -engineForce], [0, 0, 0]);
    } else {
      const speed = Math.hypot(...velocity.current);
      if (speed > 0.1) {
        const brakeForce = Math.min(240, speed * 60);
        (api as any).applyLocalForce([0, 0, brakeForce * 0.2], [0, 0, 0]);
      }
    }

    const forwardSpeed = -velocity.current[2] || 0;
    const speedFactor = Math.max(0.12, Math.min(1, 1 - Math.abs(forwardSpeed) / 30));
    const steerTorque = steer * 480 * speedFactor;
    if (steerTorque !== 0) (api as any).applyLocalTorque([0, steerTorque, 0]);

    if (handbrake) {
      const lateralPush = (steer || Math.sign(velocity.current[0] || 0)) * 1400;
      (api as any).applyLocalForce([lateralPush, 0, 520], [0, -0.2, -1.6]);
      if (engineForce !== 0) (api as any).applyLocalForce([0, 0, engineForce * -0.22], [0, 0, 0]);
    }
  });

  return (
    <group ref={ref} name={name}>
      {type === 'coupe90' ? <Coupe90Visual spoiler={spoiler} /> : <GT46Visual spoiler={spoiler} />}
    </group>
  );
}

function FollowCamera({ targetRef }: { targetRef: React.RefObject<any> | null }) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  useFrame(({ camera }) => {
    if (!targetRef || !targetRef.current) return;
    const pos = new THREE.Vector3();
    (targetRef.current as THREE.Object3D).getWorldPosition(pos);
    const desired = pos.clone().add(new THREE.Vector3(0, 4.8, 8.6));
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
  setSelected: (c: CarKey) => void;
  spoiler: SpoilerType;
  setSpoiler: (s: SpoilerType) => void;
  engineStage: number;
  setEngineStage: (n: number | ((prev: number) => number)) => void;
}) {
  return (
    <div className="garage-overlay">
      <h3>Garage</h3>
      <div className="panel-block">
        <label>Choose car</label>
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
        <label>Aero</label>
        <div className="button-row">
          <button className={spoiler === 'stock' ? 'active' : ''} onClick={() => setSpoiler('stock')}>
            Stock
          </button>
          <button className={spoiler === 'big_wing' ? 'active' : ''} onClick={() => setSpoiler('big_wing')}>
            Wing
          </button>
        </div>
      </div>

      <div className="panel-block">
        <label>Engine Stage: {engineStage}</label>
        <div className="button-row">
          <button onClick={() => setEngineStage((p: number) => Math.min(3, p + 1))}>Upgrade</button>
          <button onClick={() => setEngineStage(1)}>Reset</button>
        </div>
      </div>

      <div className="controls-hint">Controls: W/↑ accelerate • S/↓ reverse • A/D steer • Space handbrake</div>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState<CarKey>('coupe90');
  const [spoiler, setSpoiler] = useState<SpoilerType>('stock');
  const [engineStage, setEngineStage] = useState(1);

  // ref to the currently rendered car for camera follow
  const carTargetRef = useRef<any>(null);

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

      <Canvas shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 18, 8]} castShadow intensity={1.0} />
        <PerspectiveCamera makeDefault position={[0, 6, 12]} />
        <OrbitControls enablePan={false} enableZoom={true} />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Ground />
            <RoadStripe z={0} />

            <ProceduralCar
              type={selected}
              spoiler={spoiler}
              externalRef={carTargetRef}
              name={selected}
            />

            <FollowCamera targetRef={carTargetRef} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
