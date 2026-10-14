import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Physics, useBox } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import './App.css';

type CarKey = 'e36' | 'e46';
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

function Track() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#1a1d22" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[38, 120]} />
        <meshStandardMaterial color="#2a2d31" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[0.35, 120]} />
        <meshStandardMaterial color="#f2f2f2" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[18, 0.4]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>
    </group>
  );
}

function FallbackCarVisual({ spoiler }: { spoiler: SpoilerType }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[2, 0.7, 4]} />
        <meshStandardMaterial color="#ff3d3d" metalness={0.5} roughness={0.4} />
      </mesh>

      <mesh castShadow position={[0, 1.05, -1.2]}>
        <boxGeometry args={[1.5, 0.12, 0.32]} />
        <meshStandardMaterial color="#121212" />
      </mesh>

      {spoiler === 'big_wing' && (
        <mesh castShadow position={[0, 1.35, -1.8]}>
          <boxGeometry args={[1.8, 0.08, 0.45]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )}

      {Array.from({ length: 4 }).map((_, index) => {
        const x = index < 2 ? -1.1 : 1.1;
        const z = index % 2 === 0 ? -1.2 : 1.2;
        return (
          <group key={`${x}-${z}`} position={[x, 0.15, z]}>
            <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.45, 0.45, 0.38, 20]} />
              <meshStandardMaterial color="#121212" />
            </mesh>
            <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
              <cylinderGeometry args={[0.2, 0.2, 0.4, 20]} />
              <meshStandardMaterial color="#d0d0d0" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function LoadedCarModel({ modelPath, spoiler }: { modelPath: string; spoiler: SpoilerType }) {
  const gltf = useGLTF(modelPath) as any;

  const scene = gltf.scene.clone();
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      if (/logo|badge|emblem|bmw/i.test(child.name || '')) {
        child.visible = false;
      }

      if (child.material && /body|paint|shell|car/i.test(child.name || child.material.name || '')) {
        const material = child.material.clone();
        material.color.set('#ff4f4f');
        child.material = material;
      }
    }
  });

  return (
    <group>
      <primitive object={scene} scale={0.9} position={[0, -0.62, 0]} />
      {spoiler === 'big_wing' && (
        <mesh castShadow position={[0, 1.35, -1.8]}>
          <boxGeometry args={[1.8, 0.08, 0.45]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )}
    </group>
  );
}

function CarBody({ modelPath, spoiler, carName }: { modelPath: string; spoiler: SpoilerType; carName: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(modelPath, { method: 'HEAD' })
      .then((response) => {
        if (mounted) setReady(response.ok);
      })
      .catch(() => {
        if (mounted) setReady(false);
      });

    return () => {
      mounted = false;
    };
  }, [modelPath]);

  if (!ready) {
    return <FallbackCarVisual spoiler={spoiler} />;
  }

  return <LoadedCarModel modelPath={modelPath} spoiler={spoiler} />;
}

function Car({ modelPath, spoiler, carName }: { modelPath: string; spoiler: SpoilerType; carName: string }) {
  const [bodyRef, api] = useBox(() => ({
    mass: 1200,
    position: [0, 0.9, 0],
    args: [2, 0.7, 4],
    angularDamping: 0.78,
    linearDamping: 0.14,
  }));

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

    const directionMultiplier = forward === -1 ? 0.65 : 1;
    const baseEngineForce = 2600;
    const engineMultiplier = 1 + (carName === 'e46' ? 0.25 : 0.1);
    const engineForce = baseEngineForce * engineMultiplier * directionMultiplier * forward;

    if (engineForce !== 0) {
      (api as any).applyLocalForce([0, 0, -engineForce], [0, 0, 0]);
    } else {
      const speed = Math.hypot(...velocity.current);
      if (speed > 0.1) {
        const brakeForce = Math.min(240, speed * 60);
        (api as any).applyLocalForce([0, 0, brakeForce * 0.25], [0, 0, 0]);
      }
    }

    const forwardSpeed = -velocity.current[2] || 0;
    const speedFactor = Math.max(0.12, Math.min(1, 1 - Math.abs(forwardSpeed) / 30));
    const steerTorque = steer * 500 * speedFactor;

    if (steerTorque !== 0) {
      (api as any).applyLocalTorque([0, steerTorque, 0]);
    }

    if (handbrake) {
      const lateralPush = (steer || Math.sign(velocity.current[0] || 0)) * 1500;
      (api as any).applyLocalForce([lateralPush, 0, 550], [0, -0.2, -1.6]);
      if (engineForce !== 0) {
        (api as any).applyLocalForce([0, 0, engineForce * -0.2], [0, 0, 0]);
      }
    }
  });

  return (
    <group ref={bodyRef}>
      <CarBody modelPath={modelPath} spoiler={spoiler} carName={carName} />
    </group>
  );
}

function FollowCamera({ targetRef }: { targetRef: React.RefObject<any> }) {
  const { camera } = useFrame((state) => state.camera);
  useFrame(() => {
    const t = targetRef.current;
    if (!t) return;

    const pos = new THREE.Vector3();
    t.getWorldPosition(pos);
    const desired = pos.clone().add(new THREE.Vector3(0, 4.8, 8.8));
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
  setSelected: (value: CarKey) => void;
  spoiler: SpoilerType;
  setSpoiler: (value: SpoilerType) => void;
  engineStage: number;
  setEngineStage: (value: number | ((prev: number) => number)) => void;
}) {
  return (
    <div className="garage-overlay">
      <h3>Garage</h3>

      <div className="panel-block">
        <label>Select car</label>
        <div className="button-row">
          <button className={selected === 'e36' ? 'active' : ''} onClick={() => setSelected('e36')}>
            Coupe 90
          </button>
          <button className={selected === 'e46' ? 'active' : ''} onClick={() => setSelected('e46')}>
            GT 46
          </button>
        </div>
      </div>

      <div className="panel-block">
        <label>Visual aero</label>
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
        <label>Engine stage: {engineStage}</label>
        <div className="button-row">
          <button onClick={() => setEngineStage((prev) => Math.min(3, prev + 1))}>Upgrade</button>
          <button onClick={() => setEngineStage(1)}>Reset</button>
        </div>
      </div>

      <div className="controls-hint">
        W / ↑ drive • S / ↓ reverse • A / D steer • Space drift
      </div>
    </div>
  );
}

export default function App() {
  const [selectedCar, setSelectedCar] = useState<CarKey>('e36');
  const [spoiler, setSpoiler] = useState<SpoilerType>('stock');
  const [engineStage, setEngineStage] = useState(1);
  const carRef = useRef<any>(null);

  const modelMap: Record<CarKey, string> = {
    e36: '/models/coupe90.glb',
    e46: '/models/gt46.glb',
  };

  return (
    <div className="game-shell">
      <GarageOverlay
        selected={selectedCar}
        setSelected={setSelectedCar}
        spoiler={spoiler}
        setSpoiler={setSpoiler}
        engineStage={engineStage}
        setEngineStage={setEngineStage}
      />

      <Canvas shadows>
        <ambientLight intensity={0.7} />
        <directionalLight position={[12, 18, 10]} castShadow intensity={1.1} />
        <PerspectiveCamera makeDefault position={[0, 6, 10]} />
        <OrbitControls enablePan={false} enableZoom={false} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Track />
            <Car modelPath={modelMap[selectedCar]} spoiler={spoiler} carName={selectedCar} />
            <FollowCamera targetRef={carRef} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
