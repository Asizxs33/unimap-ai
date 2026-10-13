import { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { Box } from './primitives.jsx';

/* Обстановка помещений: парты, столы, стеллажи, стойка ресепшена. */

const DESK = { w: 2.2, d: 0.75, h: 0.06, top: 0.72 };
const COL_STEP = 3.4;
const ROW_STEP = 2.6;

/** Ряды парт по размеру аудитории — как в реальном классе, проход по центру */
function classroomDesks(room, floorY) {
  const cols = Math.max(1, Math.min(4, Math.floor(room.w / COL_STEP)));
  const rows = Math.max(1, Math.min(4, Math.floor(room.d / ROW_STEP)));
  const x0 = room.x - ((cols - 1) * COL_STEP) / 2;
  const z0 = room.z - ((rows - 1) * ROW_STEP) / 2 + 0.6;

  const desks = [];
  const chairs = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = x0 + c * COL_STEP;
      const z = z0 + r * ROW_STEP;
      desks.push([x, floorY + DESK.top, z]);
      chairs.push([x, floorY + 0.22, z + 0.85]);
    }
  }
  return { desks, chairs };
}

export default function Furniture({ rooms, yOffset = 0, opacity = 1, isTransparent = false }) {
  const FLOOR_Y = 0.58 + yOffset;

  const { desks, chairs, legs } = useMemo(() => {
    const d = [], c = [], l = [];
    for (const room of rooms) {
      if (room.kind !== 'classRoom') continue;
      const made = classroomDesks(room, FLOOR_Y);
      d.push(...made.desks);
      c.push(...made.chairs);
      for (const [x, , z] of made.desks) {
        l.push([x - DESK.w / 2 + 0.15, FLOOR_Y + 0.36, z]);
        l.push([x + DESK.w / 2 - 0.15, FLOOR_Y + 0.36, z]);
      }
    }
    return { desks: d, chairs: c, legs: l };
  }, [rooms, FLOOR_Y]);

  /* Кабинеты руководства: стол, кресло и шкаф вдоль стены */
  const offices = rooms.filter((r) => r.kind === 'adminRoom');

  return (
    <group>
      {/* Столешницы */}
      <Instances limit={desks.length} range={desks.length} castShadow receiveShadow>
        <boxGeometry args={[DESK.w, DESK.h, DESK.d]} />
        <meshStandardMaterial color="#c9b795" roughness={0.75} transparent={isTransparent} opacity={opacity} />
        {desks.map((p, i) => <Instance key={i} position={p} />)}
      </Instances>

      {/* Опоры столов */}
      <Instances limit={legs.length} range={legs.length}>
        <boxGeometry args={[0.1, 0.72, 0.1]} />
        <meshStandardMaterial color="#8b9098" roughness={0.6} metalness={0.3} transparent={isTransparent} opacity={opacity} />
        {legs.map((p, i) => <Instance key={i} position={p} />)}
      </Instances>

      {/* Стулья */}
      <Instances limit={chairs.length} range={chairs.length} castShadow>
        <boxGeometry args={[0.5, 0.44, 0.5]} />
        <meshStandardMaterial color="#3b4f6b" roughness={0.7} transparent={isTransparent} opacity={opacity} />
        {chairs.map((p, i) => <Instance key={i} position={p} />)}
      </Instances>

      {offices.map((r) => (
        <group key={`of${r.label}`}>
          <Box x={r.x} z={r.z - 1} w={2.6} d={1.1} h={0.1} y={FLOOR_Y + 0.72} color="#96683c"
               material={{ roughness: 0.7, transparent: isTransparent, opacity }} />
          <Box x={r.x} z={r.z - 1} w={2.4} d={0.9} h={0.72} y={FLOOR_Y} color="#7d5530"
               material={{ roughness: 0.8, transparent: isTransparent, opacity }} />
          <Box x={r.x} z={r.z + 0.2} w={0.6} d={0.6} h={0.9} y={FLOOR_Y} color="#2e3742"
               material={{ roughness: 0.6, transparent: isTransparent, opacity }} />
          <Box x={r.x + r.w / 2 - 0.6} z={r.z + r.d / 2 - 1.2} w={0.5} d={2.0} h={1.8} y={FLOOR_Y}
               color="#8a6f4c" material={{ roughness: 0.8, transparent: isTransparent, opacity }} />
        </group>
      ))}

      {/* Мебель первого этажа */}
      {yOffset === 0 && (
        <>
          <Library floorY={FLOOR_Y} opacity={opacity} isTransparent={isTransparent} />
          <Canteen floorY={FLOOR_Y} opacity={opacity} isTransparent={isTransparent} />
          <Reception floorY={FLOOR_Y} opacity={opacity} isTransparent={isTransparent} />
        </>
      )}
    </group>
  );
}

function Library({ floorY, opacity = 1, isTransparent = false }) {
  // Кабинет 131 нижнего блока: x -18, z 35, 12 × 8
  const shelves = [-22, -19, -16, -13];
  return (
    <group>
      {shelves.map((x) => (
        <Box key={x} x={x} z={35.5} w={0.6} d={5.4} h={2.0} y={floorY}
             color="#6d5236" material={{ roughness: 0.85, transparent: isTransparent, opacity }} />
      ))}
      <Box x={-18} z={32.2} w={4.0} d={0.8} h={0.95} y={floorY} color="#96683c"
           material={{ roughness: 0.7, transparent: isTransparent, opacity }} />
    </group>
  );
}

function Canteen({ floorY, opacity = 1, isTransparent = false }) {
  // Кабинет 134: x 46, z 35, 10 × 8
  const tables = [[43, 33.5], [43, 36.5], [48, 33.5], [48, 36.5]];
  return (
    <group>
      {tables.map(([x, z]) => (
        <group key={`${x}-${z}`}>
          <mesh position={[x, floorY + 0.74, z]} castShadow receiveShadow>
            <cylinderGeometry args={[1.0, 1.0, 0.08, 16]} />
            <meshStandardMaterial color="#d6cdb8" roughness={0.7} transparent={isTransparent} opacity={opacity} />
          </mesh>
          <mesh position={[x, floorY + 0.37, z]}>
            <cylinderGeometry args={[0.12, 0.2, 0.74, 10]} />
            <meshStandardMaterial color="#8b9098" metalness={0.4} roughness={0.5} transparent={isTransparent} opacity={opacity} />
          </mesh>
        </group>
      ))}
      {/* Линия раздачи */}
      <Box x={50} z={35} w={1.2} d={6.0} h={0.95} y={floorY} color="#a9b3bd"
           material={{ roughness: 0.5, metalness: 0.3, transparent: isTransparent, opacity }} />
    </group>
  );
}

function Reception({ floorY, opacity = 1, isTransparent = false }) {
  // Холл главного входа: x -8, z 34
  return (
    <group>
      <Box x={-8} z={36.5} w={6.0} d={1.0} h={1.05} y={floorY} color="#223a63"
           material={{ roughness: 0.55, transparent: isTransparent, opacity }} />
      <Box x={-8} z={36.5} w={6.4} d={1.3} h={0.1} y={floorY + 1.05} color="#c9b795"
           material={{ roughness: 0.6, transparent: isTransparent, opacity }} />
      {/* Турникеты у входа */}
      {[-12, -8, -4].map((x) => (
        <group key={x}>
          <Box x={x} z={39} w={0.5} d={1.6} h={1.0} y={floorY} color="#8b9098"
               material={{ metalness: 0.5, roughness: 0.45, transparent: isTransparent, opacity }} />
          <Box x={x} z={39} w={0.35} d={0.35} h={0.12} y={floorY + 1.0} color="#1c6b45"
               material={{ emissive: '#0a3d2a', emissiveIntensity: 0.25, transparent: isTransparent, opacity }} />
        </group>
      ))}
      {/* Диваны ожидания */}
      {[[-14, 33], [-2, 33]].map(([x, z]) => (
        <Box key={x} x={x} z={z} w={2.4} d={0.9} h={0.5} y={floorY} color="#44608a"
             material={{ roughness: 0.8, transparent: isTransparent, opacity }} />
      ))}
    </group>
  );
}
