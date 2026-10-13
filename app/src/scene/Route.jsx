import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { INT } from './palette.js';
import { setWalker, walker } from './walkerState.js';

/* Скорость обычного шага. Раньше стояло 3.0 — это бег трусцой, из-за
   чего проход по коридору выглядел как полёт. */
const WALK_SPEED = 1.45;   // м/с
const CAM_BACK = 4.8;      // насколько камера отстаёт от человека
const CAM_UP = 2.35;       // высота камеры над полом
const LOOK_AHEAD = 3.0;    // куда смотрим — чуть впереди человека
const STRIDE = 2.6;        // шагов на метр пути — задаёт частоту покачивания
const END_PAUSE = 2.2;     // сек. постоять на месте перед новым проходом

/**
 * Маршрут: труба прорисовывается от старта к финишу, а не появляется целиком.
 * Взгляд успевает проследить путь — понятнее, чем мгновенная линия.
 */
export function RouteLine({ curve, visible = true, animate = true }) {
  const meshRef = useRef();
  const grown = useRef(0);

  const geometry = useMemo(() => {
    if (!curve) return null;
    const segments = Math.max(24, curve.points.length * 14);
    return new THREE.TubeGeometry(curve, segments, 0.3, 10, false);
  }, [curve]);

  /* Растим трубу, увеличивая количество отрисовываемых индексов */
  useFrame((_, delta) => {
    const g = meshRef.current?.geometry;
    if (!g?.index) return;
    const total = g.index.count;
    if (!animate) { g.setDrawRange(0, total); return; }
    grown.current = Math.min(1, grown.current + delta * 0.85);
    const eased = 1 - Math.pow(1 - grown.current, 3);
    g.setDrawRange(0, Math.max(6, Math.floor(total * eased)));
  });

  useLayoutEffect(() => { grown.current = 0; }, [curve]);

  if (!curve || !geometry) return null;
  const start = curve.points[0];
  const end = curve.points[curve.points.length - 1];

  return (
    <group visible={visible}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color={INT.route} emissive="#1b4fae" emissiveIntensity={0.35}
          roughness={0.3} metalness={0.2} envMapIntensity={1.3}
        />
      </mesh>

      {/* Точка старта */}
      <mesh position={[start.x, 0.2, start.z]}>
        <cylinderGeometry args={[0.75, 0.75, 0.24, 28]} />
        <meshStandardMaterial color="#1c6b45" emissive="#0d4a2e" emissiveIntensity={0.3} roughness={0.4} />
      </mesh>

      <Beacon x={end.x} z={end.z} />
    </group>
  );
}

/** Маяк над пунктом назначения: пульсирующие кольца и парящая метка */
function Beacon({ x, z }) {
  const ringA = useRef();
  const ringB = useRef();
  const pin = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = (offset) => {
      const p = (t * 0.6 + offset) % 1;
      return { s: 0.6 + p * 3.4, o: Math.max(0, 0.55 * (1 - p)) };
    };
    [ringA, ringB].forEach((r, i) => {
      if (!r.current) return;
      const { s, o } = pulse(i * 0.5);
      r.current.scale.set(s, s, s);
      r.current.material.opacity = o;
    });
    if (pin.current) {
      pin.current.position.y = 3.1 + Math.sin(t * 1.9) * 0.22;
      pin.current.rotation.y = t * 0.8;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {[ringA, ringB].map((r, i) => (
        <mesh key={i} ref={r} position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.85, 40]} />
          <meshBasicMaterial color="#c22432" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={pin} position={[0, 3.1, 0]}>
        <octahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial
          color="#c22432" emissive="#7a121c" emissiveIntensity={0.5}
          roughness={0.3} metalness={0.4}
        />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2.6, 8]} />
        <meshStandardMaterial color="#c22432" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Идущий по маршруту человечек. В режиме «Ходьба» за ним следует камера.
 * Конечности на шарнирах — качаются в такт шагам.
 */
export function Walker({ curve, visible = true, followCamera = false, controlsRef }) {
  const group = useRef();
  const legL = useRef(), legR = useRef(), armL = useRef(), armR = useRef();
  const dist = useRef(0);
  const pause = useRef(0);
  const heading = useRef(0);
  const { camera } = useThree();

  const tmpTarget = useMemo(() => new THREE.Vector3(), []);
  const tmpFollow = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!curve || !group.current) return;
    const dt = Math.min(0.1, delta);
    const len = curve.getLength();
    if (len <= 0) return;

    /* Дошли до конца — стоим пару секунд и начинаем заново */
    if (pause.current > 0) {
      pause.current -= dt;
      if (pause.current <= 0) dist.current = 0;
    } else {
      dist.current += dt * WALK_SPEED;
      if (dist.current >= len) { dist.current = len; pause.current = END_PAUSE; }
    }

    const t = Math.min(0.9999, dist.current / len);
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const moving = pause.current <= 0;

    const baseFloorY = p.y - 0.55;
    group.current.position.set(p.x, baseFloorY, p.z);
    /* Поворот догоняет направление пути, а не щёлкает на повороте */
    const want = Math.atan2(tan.x, tan.z);
    let diff = want - heading.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    heading.current += diff * Math.min(1, dt * 6);
    group.current.rotation.y = heading.current;
    setWalker(p.x, baseFloorY, p.z, visible);   // двери реагируют на приближение

    /* Фаза шага считается от пройденного пути: ноги не «едут» при
       изменении частоты кадров и останавливаются вместе с человеком */
    const phase = dist.current * STRIDE;
    const s = moving ? Math.sin(phase) * 0.55 : 0;
    if (legL.current) legL.current.rotation.x = s;
    if (legR.current) legR.current.rotation.x = -s;
    if (armL.current) armL.current.rotation.x = -s * 0.7;
    if (armR.current) armR.current.rotation.x = s * 0.7;

    if (!followCamera) return;

    /* Вид из-за плеча: человек остаётся в кадре, камера идёт следом с
       небольшим отставанием и слегка покачивается в такт шагам.
       Направление берём от сглаженного поворота, иначе на поворотах
       коридора камеру резко бросает вбок. */
    const hx = Math.sin(heading.current), hz = Math.cos(heading.current);
    const bob = moving ? Math.sin(phase * 2) * 0.03 : 0;

    tmpFollow.set(p.x - hx * CAM_BACK, baseFloorY + CAM_UP + bob, p.z - hz * CAM_BACK);
    /* Сглаживание, не зависящее от частоты кадров */
    camera.position.lerp(tmpFollow, 1 - Math.pow(0.0006, dt));

    tmpTarget.set(p.x + hx * LOOK_AHEAD, baseFloorY + 1.35 + bob * 0.5, p.z + hz * LOOK_AHEAD);
    camera.lookAt(tmpTarget);
    if (controlsRef?.current) controlsRef.current.target.copy(tmpTarget);
  });

  if (!curve) { walker.active = false; return null; }

  const Limb = ({ innerRef, x, y, len, r, color }) => (
    <group ref={innerRef} position={[x, y, 0]}>
      <mesh position={[0, -(len / 2 + r), 0]} castShadow>
        <capsuleGeometry args={[r, len, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );

  return (
    <group ref={group} visible={visible}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.55, 4, 10]} />
        <meshStandardMaterial color="#26416e" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color="#c99f78" roughness={0.85} />
      </mesh>
      <Limb innerRef={legL} x={0.14} y={0.72} len={0.42} r={0.10} color="#1c2836" />
      <Limb innerRef={legR} x={-0.14} y={0.72} len={0.42} r={0.10} color="#1c2836" />
      <Limb innerRef={armL} x={0.36} y={1.30} len={0.36} r={0.07} color="#26416e" />
      <Limb innerRef={armR} x={-0.36} y={1.30} len={0.36} r={0.07} color="#26416e" />
    </group>
  );
}
