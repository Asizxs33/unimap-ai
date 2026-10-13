import { useEffect, useMemo } from 'react';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { DoubleSide } from 'three';
import { Instance, Instances } from '@react-three/drei';
import { Box } from './primitives.jsx';
import { SLABS } from '../data/buildingLayout.js';
import { WALK_FURNITURE, WALK_ROOMS, WALK_STAIRS, roomNumber } from '../lib/walkPhysics.js';
import { labelMap } from './textures.js';
import { wayfindingMap } from './textures.js';
import { surface } from './materials.js';

/** Стена с настоящими нишами: стекло, откосы, подоконник и рамы. */
export function InteriorFacade({ x, z, w, d, rot = 0, yOffset = 0 }) {
  const alongZ = d > w, length = Math.max(w, d), depth = Math.min(w, d);
  const count = Math.max(1, Math.floor(length / 5.6));
  const step = length / count, opening = 1.85;
  const angle = rot + (alongZ ? Math.PI / 2 : 0);
  const inside = SLABS.some(([cx, cz, sw, sd]) => Math.abs(x + Math.sin(angle) * 2 - cx) < sw / 2 && Math.abs(z + Math.cos(angle) * 2 - cz) < sd / 2) ? 1 : -1;
  return <group position={[x, yOffset, z]} rotation={[0, rot + (alongZ ? Math.PI / 2 : 0), 0]}>
    <Box x={0} z={0} w={length} d={depth} h={1.05} y={0.42} color="#d6d4c9" />
    <Box x={0} z={0} w={length} d={depth} h={0.9} y={3.12} color="#d6d4c9" />
    {Array.from({ length: count }, (_, i) => {
      const p = -length / 2 + step * (i + 0.5);
      const entrance = !alongZ && z > 39 && Math.abs(x + p + 8) < 5;
      if (entrance) return <Box key={i} x={p} z={0} w={step} d={depth} y={1.47} h={1.65} color="#d6d4c9" />;
      return <group key={i}>
        {[-1, 1].map(side => <Box key={side} x={p + side * (step + opening) / 4} z={0} w={(step - opening) / 2} d={depth} y={1.47} h={1.65} color="#d6d4c9" />)}
        <mesh position={[p, 2.295, 0]}>
          <boxGeometry args={[opening, 1.65, 0.025]} />
          <meshPhysicalMaterial color="#d2e0df" roughness={0.08} metalness={0} transparent opacity={0.19} depthWrite={false} clearcoat={1} envMapIntensity={0.9} />
        </mesh>
        {[-1, 0, 1].map(side => <Box key={side} x={p + side * opening / 2} z={0} w={0.065} d={0.18} y={1.47} h={1.65} color="#f5f2e9" />)}
        <Box x={p} z={0} w={opening + 0.18} d={depth + 0.3} y={1.4} h={0.1} color="#e9e7df" />
        <Box x={p} z={0} w={opening} d={0.18} y={2.72} h={0.06} color="#f5f2e9" />
        <Box x={p} z={inside * (depth / 2 + 0.10)} w={1.25} d={0.16} y={0.66} h={0.5} color="#efeee7" material={{ roughness: 0.55 }} />
        <Box x={p + 0.55} z={inside * (depth / 2 + 0.13)} w={0.045} d={0.045} y={0.44} h={0.24} color="#b8b9b1" material={{ metalness: 0.5, roughness: 0.4 }} />
      </group>;
    })}
    <Box x={0} z={0} w={length + 0.12} d={depth + 0.12} h={0.16} y={0.47} color="#9aa0a0" />
  </group>;
}

const LIGHTS = [
  ...[-42, -30, -18, -6, 6, 17].map(z => [-47, z]),
  ...[-32, -20, -8, 4, 16].map(z => [17, z]),
  ...[-48, -32, -16, 0, 16, 32, 48].map(x => [x, 26]),
  [-8, 34],
];

export default function WalkInterior({ floor }) {
  const deskGeometry = useMemo(() => new RoundedBoxGeometry(1.8, 0.065, 0.8, 2, 0.014), []);
  useEffect(() => () => deskGeometry.dispose(), [deskGeometry]);
  const y = (floor - 1) * 4.2;
  const labels = useMemo(() => WALK_ROOMS.map(r => labelMap(roomNumber(r, floor), r.sub)), [floor]);
  const directory = useMemo(() => wayfindingMap(`← ${floor}01–${floor}10     ${floor}20–${floor}26 →`, 'КАБИНЕТЫ · ЛЕСТНИЦЫ'), [floor]);
  const stairSign = useMemo(() => wayfindingMap('ЛЕСТНИЦА', `${floor} ЭТАЖ · ПОДОЙДИТЕ К ПЛОЩАДКЕ`), [floor]);
  const desks = WALK_FURNITURE.filter(o => o.kind === 'desk');
  const chairs = WALK_FURNITURE.filter(o => o.kind === 'chair');
  return (
    <group position={[0, y, 0]}>
      <ambientLight intensity={0.3} color="#fff9ee" />
      {floor === 1 && <group>
        <Box x={-8} z={39.18} w={3.4} d={0.1} y={0.43} h={2.1} color="#7f9da5" material={{ roughness: 0.22, metalness: 0.3 }} />
        {[-1, 0, 1].map(side => <Box key={side} x={-8 + side * 1.7} z={39.08} w={0.07} d={0.1} y={0.43} h={2.12} color="#dbe0df" />)}
        {[-1, 1].map(side => <Box key={side} x={-8 + side * 0.22} z={38.99} w={0.04} d={0.07} y={1.05} h={0.6} color="#e9ece9" material={{ metalness: 0.7, roughness: 0.3 }} />)}
      </group>}
      {SLABS.map(([x, z, w, d], i) => <group key={i}>
        <Box x={x} z={z} w={w} d={d} h={0.18} y={4.12} color="#e9e7df" />
        <mesh position={[x, 4.115, z]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial {...surface('ceiling', w, d)} />
        </mesh>
        {floor > 1 && <Box x={x} z={z} w={w} d={d} h={y} y={-y} color="#d4c9ac" />}
      </group>)}
      <Instances limit={LIGHTS.length} range={LIGHTS.length}>
        <boxGeometry args={[0.58, 0.03, 1.18]} />
        <meshStandardMaterial color="#fff9e8" emissive="#fff1d3" emissiveIntensity={1.1} />
        {LIGHTS.map(([x, z], i) => <Instance key={i} position={[x, 4.08, z]} />)}
      </Instances>
      {[[-8, 26], [-47, -18], [17, -10]].map(([x, z]) => <pointLight key={x} position={[x, 3.85, z]} intensity={45} distance={30} decay={2} color="#fff4df" />)}
      <mesh position={[-8, 2.7, 20.76]}>
        <planeGeometry args={[5.8, 1.1]} />
        <meshStandardMaterial map={directory} roughness={0.85} />
      </mesh>
      {WALK_ROOMS.map((room, i) => room.door && (
        <group key={room.label} position={[room.door[0], 0, room.door[1]]} rotation={[0, room.door[2] === 'z' ? Math.PI / 2 : 0, 0]}>
          <Box x={0} z={0} w={1.8} d={0.42} y={3.45} h={0.67} color="#e4dfd3" />
          {[-1, 1].map(side => (
            <mesh key={side} position={[0, 3.0, side * 0.24]} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
              <planeGeometry args={[1.35, 0.68]} />
              <meshStandardMaterial map={labels[i]} transparent side={DoubleSide} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[0, -0.14, 0]}>
      <Instances geometry={deskGeometry} limit={desks.length} range={desks.length} castShadow receiveShadow>
        <meshStandardMaterial {...surface('oak', 1.8, 0.8)} />
        {desks.map((o, i) => <Instance key={i} position={[o.x, 1.29, o.z]} scale={[o.w / 1.8, 1, 1]} />)}
      </Instances>
      <Instances limit={desks.length * 2} range={desks.length * 2} castShadow>
        <boxGeometry args={[0.08, 0.035, 0.65]} />
        <meshStandardMaterial color="#687079" roughness={0.48} metalness={0.45} />
        {desks.flatMap((o, i) => [-1, 1].map(side => <Instance key={`${i}-${side}`} position={[o.x + side * (o.w / 2 - 0.15), 0.595, o.z]} />))}
      </Instances>
      <Instances limit={desks.length * 2} range={desks.length * 2}>
        <boxGeometry args={[0.045, 0.66, 0.045]} />
        <meshStandardMaterial color="#687079" roughness={0.48} metalness={0.45} />
        {desks.flatMap((o, i) => [-1, 1].map(side => <Instance key={`${i}-${side}`} position={[o.x + side * (o.w / 2 - 0.15), 0.91, o.z]} />))}
      </Instances>
      <Instances limit={chairs.length} range={chairs.length}>
        <boxGeometry args={[0.46, 0.055, 0.46]} />
        <meshStandardMaterial color="#52615e" roughness={0.72} />
        {chairs.map((o, i) => <Instance key={i} position={[o.x, 1.01, o.z]} />)}
      </Instances>
      <Instances limit={chairs.length} range={chairs.length}>
        <boxGeometry args={[0.46, 0.32, 0.055]} />
        <meshStandardMaterial color="#52615e" roughness={0.72} />
        {chairs.map((o, i) => <Instance key={i} position={[o.x, 1.28, o.z + 0.2]} />)}
      </Instances>
      <Instances limit={chairs.length * 4} range={chairs.length * 4} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.43, 8]} />
        <meshStandardMaterial color="#6f7370" metalness={0.65} roughness={0.34} />
        {chairs.flatMap((o, i) => [-1, 1].flatMap(a => [-1, 1].map(b => <Instance key={`${i}-${a}-${b}`} position={[o.x + a * 0.18, 0.795, o.z + b * 0.18]} />)))}
      </Instances>
      </group>
      {desks.filter((_, i) => i % 3 === 0).map((desk, i) => <group key={i}>
        <Box x={desk.x - 0.32} z={desk.z} w={0.26} d={0.34} h={0.012} y={1.184} color={['#687775', '#8b715b', '#696e80'][i % 3]} shadow={false} />
        <Box x={desk.x - 0.315} z={desk.z} w={0.25} d={0.325} h={0.028} y={1.196} color="#eae4d2" shadow={false} />
      </group>)}
      {WALK_FURNITURE.filter(o => o.kind === 'bookcase').map((o, i) => <group key={i} position={[o.x, 0.43, o.z]}>
        <Box x={-o.w / 2 + 0.035} z={0} w={0.07} d={o.d} h={o.h} color="#b69d76" material={surface('oak', o.d, o.h)} />
        {[-1, 1].map(side => <Box key={side} x={0} z={side * (o.d / 2 - 0.035)} w={o.w} d={0.07} h={o.h} color="#b69d76" material={surface('oak', o.d, o.h)} />)}
        {[0, 1, 2, 3, 4].map(row => <group key={row}>
          <Box x={0} z={0} w={o.w} d={o.d} h={0.04} y={row * 0.53} color="#b69d76" material={surface('oak', o.d, o.w)} />
          {row < 4 && Array.from({ length: 27 }, (_, k) => <Box key={k} x={0.08} z={-2.25 + k * 0.17} w={0.28} d={0.055 + (k % 3) * 0.025} h={0.29 + (k % 4) * 0.035} y={row * 0.53 + 0.04} color={['#5a6d68', '#8f6e54', '#d3c4a2', '#4d5866', '#8f8c6a'][(k + row) % 5]} shadow={false} />)}
        </group>)}
      </group>)}
      {WALK_FURNITURE.filter(o => o.kind === 'bench').map((o, i) => <group key={i}>
        <Box x={o.x} z={o.z} w={o.w} d={o.d} h={0.09} y={0.86} color="#a49271" material={surface('oak', o.w, o.d)} />
        <Box x={o.x} z={o.z - 0.27} w={o.w} d={0.07} h={0.33} y={1.0} color="#a49271" material={surface('oak', o.w, 0.33)} />
        {[-1, 1].map(side => <Box key={side} x={o.x + side * 1.3} z={o.z} w={0.055} d={o.d - 0.05} h={0.43} y={0.43} color="#5e6863" material={{ metalness: 0.45, roughness: 0.42 }} />)}
      </group>)}
      <InteriorDetails />
      {WALK_STAIRS.map((s, i) => (
        <group key={s.name}>
          <mesh position={[s.x, 3.45, s.z - 2.4]}>
            <planeGeometry args={[3.0, 0.6]} />
            <meshStandardMaterial map={stairSign} side={DoubleSide} roughness={0.85} />
          </mesh>
          {[-1, 1].map(side => <Box key={side} x={s.x + side * 1.1} z={s.z - 2.4} w={0.025} d={0.025} h={0.4} y={3.72} color="#718481" />)}
          <mesh position={[s.x, 0.46, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.1, 1.22, 40]} />
            <meshBasicMaterial color="#267888" />
          </mesh>
          <WalkStairwell x={i === 0 ? -53 : i === 1 ? 11 : 54.5} z={i === 2 ? 24 : s.z} topFloor={floor === 4} />
        </group>
      ))}
    </group>
  );
}

function InteriorDetails() {
  return <group>
    {/* Информационный стенд утоплен в алюминиевую рамку на стене холла. */}
    <Box x={-18} z={20.78} w={2.7} d={0.09} h={1.4} y={1.23} color="#666f69" material={{ metalness: 0.5, roughness: 0.4 }} />
    <Box x={-18} z={20.84} w={2.56} d={0.03} h={1.26} y={1.3} color="#8d8569" material={surface('oak', 2.5, 1.2)} />
    {[-0.85, -0.28, 0.3, 0.87].map((offset, i) => <group key={offset}>
      <Box x={-18 + offset} z={20.866} w={0.42} d={0.005} h={0.64} y={1.56 + (i % 2) * 0.06} color="#f2eee3" />
      {[0, 1, 2, 3, 4].map(line => <Box key={line} x={-18 + offset} z={20.872} w={line === 0 ? 0.26 : 0.3} d={0.003} h={line === 0 ? 0.026 : 0.009} y={2.05 - line * 0.072 + (i % 2) * 0.06} color={line === 0 ? '#4b6664' : '#92958e'} shadow={false} />)}
    </group>)}
    <group position={[0, 3.15, 20.79]}>
      <mesh><circleGeometry args={[0.26, 48]} /><meshStandardMaterial color="#4e5c57" metalness={0.3} roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.006]}><circleGeometry args={[0.235, 48]} /><meshStandardMaterial color="#efeee5" roughness={0.9} /></mesh>
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin(i * Math.PI / 6) * 0.20, Math.cos(i * Math.PI / 6) * 0.20, 0.01]} rotation={[0, 0, -i * Math.PI / 6]}><boxGeometry args={[0.012, 0.027, 0.005]} /><meshStandardMaterial color="#39483f" /></mesh>)}
      <mesh position={[-0.05, 0.025, 0.015]} rotation={[0, 0, Math.PI / 3]}><boxGeometry args={[0.018, 0.13, 0.01]} /><meshStandardMaterial color="#34443e" /></mesh>
      <mesh position={[0.067, 0.045, 0.02]} rotation={[0, 0, -Math.PI / 3]}><boxGeometry args={[0.013, 0.18, 0.01]} /><meshStandardMaterial color="#34443e" /></mesh>
    </group>
  </group>;
}

function WalkStairwell({ x, z, topFloor }) {
  return <group position={[x, 0, z]}>
    <Box x={0} z={0} w={3.6} d={4.8} h={0.08} y={0.45} color="#babbb5" />
    {!topFloor && [0, 1].flatMap(flight => Array.from({ length: 12 }, (_, step) => {
      const rise = (step + 1) * 0.175;
      const pz = flight === 0 ? -1.9 + step * 0.32 : 1.62 - step * 0.32;
      return <group key={`${flight}-${step}`}>
        <Box x={flight === 0 ? -0.85 : 0.85} z={pz} w={1.5} d={0.32} h={rise} y={0.53 + flight * 2.1} color="#b4b6b1" />
        <Box x={flight === 0 ? -0.85 : 0.85} z={pz - 0.14} w={1.5} d={0.025} h={0.018} y={0.53 + flight * 2.1 + rise} color="#687977" shadow={false} />
      </group>;
    }))}
    {!topFloor && <Box x={0} z={2.03} w={3.4} d={0.6} h={0.16} y={2.47} color="#b4b6b1" />}
  </group>;
}
