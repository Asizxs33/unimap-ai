import { useMemo } from 'react';
import { Box } from './primitives.jsx';
import { SITE } from './palette.js';
import { asphaltMap, pavingMap, lawnMap } from './textures.js';

/* Благоустройство территории.

   Против первой версии: деревья собраны из нескольких смещённых и
   повёрнутых объёмов разного тона вместо одной сферы на палке, кроны
   приплюснуты и наклонены. Ровная зелёная сфера — главный признак
   макета, потому что в природе такой формы не бывает. */

const LAWNS = [
  [-38, 47, 30, 10], [26, 47, 34, 10],
  [-14, 0, 34, 46],
  [-70, -16, 16, 72], [42, -12, 20, 60],
];

const PATHS = [
  [-8, 54, 24, 14],
  [0, 62, 150, 8],
  [-64, 24, 20, 84],
  [52, 24, 24, 84],
];

const CARS = [
  [61, 50, '#8d3038'], [67, 50, '#2f4f7d'], [79, 50, '#c9c9cb'],
  [61, 62, '#3a4149'], [73, 62, '#9a7c33'], [85, 62, '#3d6b52'],
];

const LAMPS = [[-30, 50], [14, 50], [-8, 60], [42, 50], [-56, 34], [50, 34]];

const PEOPLE = [
  [-16, 52, '#39537d'], [-2, 55, '#8d3b42'], [-10, 58, '#3a4149'], [6, 51, '#3d6b52'],
  [-24, 49, '#5c4a72'], [18, 53, '#8a7333'], [-8, 63, '#39537d'], [30, 60, '#7a3f45'],
];

/* Деревья: [x, z, масштаб, вид] — 0 лиственное, 1 хвойное, 2 молодое */
const TREES = [
  ...[-52, -44, -34, -26, 12, 20, 30, 38, 46].map((x, i) => [x, 46.5, 0.9 + (i % 4) * 0.13, i % 3]),
  ...[-14, -4, 6, 14].map((z, i) => [-66, z - 10, 1.0 + (i % 2) * 0.15, (i + 1) % 3]),
  ...[-16, -6, 4, 14].map((z, i) => [50, z - 8, 1.0 + (i % 3) * 0.1, i % 3]),
  ...[[-14, -8], [-14, 8], [-4, -20], [-22, -28], [-6, 4]].map(([x, z], i) => [x, z, 0.85 + (i % 3) * 0.12, i % 3]),
];

/** Лиственное дерево: три смещённые приплюснутые кроны разного тона */
function Broadleaf({ s, seed }) {
  const blobs = [
    { p: [0, 4.1 * s, 0], r: 1.95 * s, c: SITE.leafMid, sc: [1, 0.78, 1] },
    { p: [1.15 * s, 3.35 * s, 0.5 * s], r: 1.35 * s, c: SITE.leafLight, sc: [1, 0.82, 1] },
    { p: [-0.9 * s, 3.5 * s, -0.7 * s], r: 1.2 * s, c: SITE.leafDeep, sc: [1, 0.85, 1] },
  ];
  return (
    <>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} scale={b.sc} rotation={[0, seed + i, 0.1 * i]} castShadow>
          <icosahedronGeometry args={[b.r, 1]} />
          <meshStandardMaterial color={b.c} roughness={0.95} flatShading />
        </mesh>
      ))}
    </>
  );
}

/** Хвойное: три яруса с наклоном, вершина смещена */
function Conifer({ s, seed }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0.06 * i * s, (2.7 + i * 1.45) * s, 0.05 * i * s]}
          rotation={[0.02 * i, seed + i, 0.015 * i]}
          castShadow
        >
          <coneGeometry args={[(2.05 - i * 0.52) * s, 2.5 * s, 9]} />
          <meshStandardMaterial
            color={i === 1 ? SITE.leafMid : SITE.leafDeep}
            roughness={0.96} flatShading
          />
        </mesh>
      ))}
    </>
  );
}

/** Молодое дерево на подвязке */
function Sapling({ s }) {
  return (
    <>
      <mesh position={[0, 2.6 * s, 0]} scale={[1, 0.9, 1]} castShadow>
        <icosahedronGeometry args={[1.15 * s, 1]} />
        <meshStandardMaterial color={SITE.leafLight} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.35 * s, 1.1 * s, 0]} rotation={[0, 0, 0.06]}>
        <cylinderGeometry args={[0.04 * s, 0.04 * s, 2.2 * s, 6]} />
        <meshStandardMaterial color="#6b6152" roughness={0.9} />
      </mesh>
    </>
  );
}

function Tree({ x, z, s, kind }) {
  const seed = useMemo(() => ((x * 13 + z * 7) % 6.28), [x, z]);
  const trunkH = kind === 2 ? 1.5 * s : 2.5 * s;
  return (
    <group position={[x, 0, z]} rotation={[0, seed, 0]}>
      {/* Приствольный круг — дерево не «вставлено» в газон */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.5 * s, 12]} />
        <meshStandardMaterial color="#6d6552" roughness={1} />
      </mesh>
      <mesh position={[0, trunkH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2 * s, 0.32 * s, trunkH, 8]} />
        <meshStandardMaterial color={SITE.trunk} roughness={0.98} />
      </mesh>
      {kind === 1 ? <Conifer s={s} seed={seed} />
        : kind === 2 ? <Sapling s={s} />
        : <Broadleaf s={s} seed={seed} />}
    </group>
  );
}

function Car({ x, z, color }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.62, 4.3]} />
        <meshStandardMaterial color={color} roughness={0.32} metalness={0.62} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[0, 1.12, -0.15]} castShadow>
        <boxGeometry args={[1.68, 0.56, 2.25]} />
        <meshStandardMaterial color="#20262e" roughness={0.16} metalness={0.5} envMapIntensity={1.6} />
      </mesh>
      <mesh position={[0, 1.42, -0.15]} castShadow>
        <boxGeometry args={[1.5, 0.1, 2.0]} />
        <meshStandardMaterial color={color} roughness={0.32} metalness={0.6} />
      </mesh>
      {[[0.9, 1.35], [-0.9, 1.35], [0.9, -1.35], [-0.9, -1.35]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.34, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.22, 14]} />
          <meshStandardMaterial color="#191b1f" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function Lamp({ x, z, night = false }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.24, 10]} />
        <meshStandardMaterial color="#6e747c" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 7, 10]} />
        <meshStandardMaterial color="#5d646d" metalness={0.6} roughness={0.42} />
      </mesh>
      <mesh position={[0, 7.15, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.5, 0.42, 12, 1, true]} />
        <meshStandardMaterial color="#6e747c" metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[0, 6.94, 0]}>
        <sphereGeometry args={[0.24, 12, 8]} />
        {night
          ? <meshBasicMaterial color="#fff0c4" toneMapped={false} />
          : <meshStandardMaterial color="#fff6dd" emissive="#ffe6a8" emissiveIntensity={0.5} />}
      </mesh>
      {night && (
        <pointLight position={[0, 6.6, 0]} color="#ffdfa0" intensity={22} distance={26} decay={2} />
      )}
    </group>
  );
}

function Bench({ x, z, rot = 0 }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {[0.5, 0.78].map((y, i) => (
        <mesh key={i} position={[0, y, i ? -0.24 : 0]} rotation={[i ? -0.35 : 0, 0, 0]} castShadow>
          <boxGeometry args={[2.2, 0.09, 0.5]} />
          <meshStandardMaterial color="#7a6144" roughness={0.9} />
        </mesh>
      ))}
      {[-0.9, 0.9].map((sx) => (
        <mesh key={sx} position={[sx, 0.25, 0]} castShadow>
          <boxGeometry args={[0.1, 0.5, 0.52]} />
          <meshStandardMaterial color="#4e545c" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Person({ x, z, color }) {
  const rot = ((x * 7 + z * 3) % 6.28);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.5, 4, 8]} />
        <meshStandardMaterial color="#2c3238" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <capsuleGeometry args={[0.21, 0.42, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.44, 0]} castShadow>
        <sphereGeometry args={[0.155, 12, 10]} />
        <meshStandardMaterial color="#c99f78" roughness={0.85} />
      </mesh>
    </group>
  );
}

export default function Site({ night = false }) {
  const lawn = useMemo(() => lawnMap(SITE.lawn, SITE.lawnDry), []);
  const paving = useMemo(() => pavingMap(SITE.path), []);
  const asphalt = useMemo(() => asphaltMap(SITE.asphalt), []);

  return (
    <group>
      {/* Газоны чуть приподняты и с бортиком — граница читается */}
      {LAWNS.map(([x, z, w, d], i) => (
        <group key={`l${i}`}>
          <Box x={x} z={z} w={w + 0.3} d={d + 0.3} h={0.2} color={SITE.pathEdge}
               material={{ roughness: 0.95 }} shadow={false} receiveShadow />
          <mesh position={[x, 0.22, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial map={lawn} color={SITE.lawn} roughness={1} />
          </mesh>
        </group>
      ))}

      {PATHS.map(([x, z, w, d], i) => (
        <mesh key={`p${i}`} position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial map={paving} color={SITE.path} roughness={0.92} />
        </mesh>
      ))}

      {/* Парковка */}
      <mesh position={[74, 0.1, 56]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 26]} />
        <meshStandardMaterial map={asphalt} color={SITE.asphalt} roughness={0.98} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`m${i}`} position={[58.5 + i * 6, 0.12, 56]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 24]} />
          <meshStandardMaterial color="#d8d6cd" roughness={0.9} />
        </mesh>
      ))}
      {CARS.map(([x, z, c], i) => <Car key={`c${i}`} x={x} z={z} color={c} />)}

      {TREES.map(([x, z, s, kind], i) => <Tree key={`t${i}`} x={x} z={z} s={s} kind={kind} />)}
      {LAMPS.map(([x, z], i) => <Lamp key={`lp${i}`} x={x} z={z} night={night} />)}

      {[[-22, 56, 0], [-8, 57.5, 0.3], [4, 56, -0.2], [-34, 50, 0.5]].map(([x, z, r], i) => (
        <Bench key={`b${i}`} x={x} z={z} rot={r} />
      ))}

      {PEOPLE.map(([x, z, c], i) => <Person key={`pe${i}`} x={x} z={z} color={c} />)}
    </group>
  );
}
