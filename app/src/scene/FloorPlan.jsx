import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { Box, TextPlane } from './primitives.jsx';
import Furniture from './Furniture.jsx';
import { INT, WALL_H, DOOR_H } from './palette.js';
import { tileMap, labelMap, exitSignMap } from './textures.js';
import { walker } from './walkerState.js';
import { SLABS, WALLS, ROOMS, DOOR_GAP } from '../data/buildingLayout.js';
import WalkInterior, { InteriorFacade } from './WalkInterior.jsx';
import { surface } from './materials.js';
const DOOR_W = DOOR_GAP - 0.12;


/* ============================================================
   Планировка 1-4 этажей по эвакуационной схеме.
   Реализована в виде Exploded Axonometric View:
   активный этаж отображается непрозрачным, остальные этажи
   разнесены по высоте и отображаются полупрозрачными.
   ============================================================ */

const FLOOR_TOP = 0.58;
const FLOOR_H = 4.2;

/* Лестница: три встречных пролёта (зигзаг) внутри той же лестничной
   клетки, что и раньше. Раньше был один пролёт высотой 1.36 м из
   требуемых 4.2 — и человек с камерой в графе навигации «доезжали»
   до следующего этажа по прямой вертикали, как на лифте, минуя саму
   лестницу. Три пролёта в сумме дают ровно высоту этажа. */
const STAIR_FLIGHTS = 3;
const STAIR_STEPS = 9;
const STAIR_STEP_RUN = 0.46;
const STAIR_STEP_RISE = FLOOR_H / (STAIR_FLIGHTS * STAIR_STEPS);

// Общая геометрия для отрисовки, мини-карты и коллизий.

const WINDOW_BANDS = [
  [-47, -51.3, 16, 0], [-57.3, -22, 50, Math.PI / 2], [-36.9, -28, 38, Math.PI / 2],
  [17, -41.3, 16, 0], [27.3, -14, 50, Math.PI / 2], [6.7, -20, 36, Math.PI / 2],
  [-34, 39.9, 40, 0], [30, 39.9, 44, 0], [57.3, 30, 16, Math.PI / 2],
];

const STAIRS = [[-53, -46, Math.PI / 2], [11, -36, Math.PI / 2], [50, 25, Math.PI / 2]];
const EXIT_SIGNS = [[-47, -50.6, 0], [17, -40.6, 0], [-8, 39.2, 0], [56.4, 26, Math.PI / 2]];
const FIRE_EXT = [[-49, -40], [-45, -16], [-49, 6], [15, -30], [19, -6], [-30, 23], [10, 23], [40, 23]];
const ELEC = [[-56, -44], [20, -40], [-56, 16], [50, 22]];
const ARROWS = [
  [-47, -42, 0], [-47, -30, 0], [-47, 8, Math.PI],
  [17, -32, 0], [17, -20, 0], [17, 8, Math.PI],
  [-36, 26, -Math.PI / 2], [-20, 26, -Math.PI / 2], [6, 26, Math.PI / 2],
  [44, 26, -Math.PI / 2], [-8, 30, Math.PI],
];
const ROOF_SLABS = [[-47, -16, 24, 74], [17, -11, 24, 64], [0, 30, 118, 22]];

/* ── Перекрытие с плиточным полом ── */
function Slab({ x, z, w, d, yOffset = 0, opacity = 1, isTransparent = false, immersive = false }) {
  const tiles = useMemo(() => tileMap(INT.corridor, INT.corridorTrim, 4), []);
  return (
    <group position={[0, yOffset, 0]}>
      <Box x={x} z={z} w={w} d={d} h={0.42} color={INT.slab}
           material={{ roughness: 0.95, transparent: isTransparent, opacity: opacity }} />
      <mesh position={[x, 0.43, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w - 0.6, d - 0.6]} />
        <meshStandardMaterial map={tiles} color={immersive ? '#ffffff' : INT.corridor} roughness={0.55} metalness={0}
                              {...(immersive ? surface('stone', w - 0.6, d - 0.6) : {})}
                              transparent={isTransparent} opacity={opacity} />
      </mesh>
    </group>
  );
}

/* ── Стена: тело + нащельник + плинтус ── */
function Wall({ x, z, w, d, external, rot = 0, yOffset = 0, opacity = 1, isTransparent = false, immersive = false }) {
  if (immersive && external) return <InteriorFacade x={x} z={z} w={w} d={d} rot={rot} yOffset={yOffset} />;
  const h = external || immersive ? 3.6 : WALL_H;
  const color = immersive ? '#ffffff' : external ? INT.outerWall : INT.innerWall;
  return (
    <group position={[x, yOffset, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.42 + h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.94} transparent={isTransparent} opacity={opacity} {...(immersive ? surface('plaster', Math.max(w, d), h) : {})} />
      </mesh>
      {immersive && <mesh position={[0, 1.02, 0]} receiveShadow>
        <boxGeometry args={[w + 0.012, 1.16, d + 0.012]} />
        <meshStandardMaterial color="#a8afa3" roughness={0.76} />
      </mesh>}
      <mesh position={[0, 0.42 + h + 0.05, 0]} castShadow>
        <boxGeometry args={[w + 0.14, 0.1, d + 0.14]} />
        <meshStandardMaterial color={immersive ? '#dddcd5' : INT.wallCap} roughness={0.7} transparent={isTransparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[w + 0.12, 0.16, d + 0.12]} />
        <meshStandardMaterial color={immersive ? '#777a70' : INT.wallCap} roughness={0.85} transparent={isTransparent} opacity={opacity} />
      </mesh>
    </group>
  );
}

/* ── Помещение: пол + табличка ── */
function Room({ room, texture, yOffset = 0, opacity = 1, isTransparent = false, immersive = false }) {
  const { x, z, w, d, kind } = room;
  return (
    <group position={[0, yOffset, 0]}>
      {!immersive && <mesh position={[x, 0.44, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w - 0.3, d - 0.3]} />
        <meshStandardMaterial color={INT[kind]} roughness={0.8} metalness={0.03}
                              transparent={isTransparent} opacity={opacity} />
      </mesh>}
      {!immersive && <TextPlane texture={texture} x={x} y={0.47} z={z} w={Math.min(w - 1.4, 5.0)} h={1.9}
                 transparent opacity={opacity} />}
    </group>
  );
}

/**
 * Дверь в проёме. Порог, полотно на петле.
 */
function Door({ x, z, axis, yOffset = 0, opacity = 1, isTransparent = false, immersive = false }) {
  const hinge = useRef();
  const open = useRef(0);
  const world = useMemo(() => new THREE.Vector3(x, yOffset + FLOOR_TOP, z), [x, yOffset, z]);

  useFrame((_, delta) => {
    if (!hinge.current) return;
    const near = walker.active && walker.pos.distanceTo(world) < 5.2;
    const want = near ? 1 : 0;
    open.current += (want - open.current) * Math.min(1, delta * 6);
    hinge.current.rotation.y = -open.current * (Math.PI / 2.1);
  });

  const alongZ = axis === 'z';

  return (
    <group position={[x, FLOOR_TOP + yOffset, z]} rotation={[0, alongZ ? Math.PI / 2 : 0, 0]}>
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} position={[sgn * (DOOR_GAP / 2 + 0.06), DOOR_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.12, DOOR_H + 0.12, 0.5]} />
          <meshStandardMaterial color={INT.doorFrame} roughness={0.7} transparent={isTransparent} opacity={opacity} />
        </mesh>
      ))}
      <mesh position={[0, DOOR_H + (WALL_H - DOOR_H) / 2 + 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[DOOR_GAP + 0.24, WALL_H - DOOR_H, 0.42]} />
        <meshStandardMaterial color={INT.innerWall} roughness={0.94} transparent={isTransparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[DOOR_GAP + 0.12, 0.04, 0.46]} />
        <meshStandardMaterial color={INT.wallCap} roughness={0.8} transparent={isTransparent} opacity={opacity} />
      </mesh>

      <group ref={hinge} position={[-DOOR_GAP / 2 + 0.06, 0, 0]}>
        <mesh position={[DOOR_W / 2, DOOR_H / 2, 0]} castShadow>
          <boxGeometry args={[DOOR_W, DOOR_H - 0.05, 0.06]} />
          <meshStandardMaterial color={immersive ? '#ffffff' : INT.door} roughness={0.66} transparent={isTransparent} opacity={opacity} {...(immersive ? surface('oak', DOOR_W, DOOR_H) : {})} />
        </mesh>
        <mesh position={[DOOR_W / 2, DOOR_H * 0.58, 0.04]}>
          <boxGeometry args={[DOOR_W - 0.26, DOOR_H * 0.46, 0.02]} />
          <meshStandardMaterial color={immersive ? '#c6b48f' : '#7a6549'} roughness={0.7} transparent={isTransparent} opacity={opacity} {...(immersive ? surface('oak', DOOR_W, DOOR_H) : {})} />
        </mesh>
        <mesh position={[DOOR_W - 0.16, 1.05, 0.08]}>
          <boxGeometry args={[0.18, 0.025, 0.04]} />
          <meshStandardMaterial color="#b5b8b1" metalness={0.8} roughness={0.3} transparent={isTransparent} opacity={opacity} />
        </mesh>
      </group>
    </group>
  );
}

/** Лестничный марш: зигзаг из трёх пролётов на всю высоту этажа */
function Stairs({ x, z, rot, yOffset = 0, opacity = 1, isTransparent = false }) {
  const { treads, risers } = useMemo(() => {
    const treads = [];
    const risers = [];
    for (let k = 0; k < STAIR_FLIGHTS; k++) {
      const dir = k % 2 === 0 ? 1 : -1;          // чередуем направление — зигзаг
      const zStart = dir === 1 ? -1.9 : 1.78;
      const yBase = 0.62 + k * STAIR_STEPS * STAIR_STEP_RISE;
      for (let i = 0; i < STAIR_STEPS; i++) {
        const zPos = zStart + dir * i * STAIR_STEP_RUN;
        const yPos = yBase + i * STAIR_STEP_RISE;
        treads.push([0, yPos, zPos]);
        risers.push([0, yPos - 0.09, zPos - (dir * STAIR_STEP_RUN) / 2]);
      }
    }
    return { treads, risers };
  }, []);

  return (
    <group position={[x, yOffset, z]} rotation={[0, rot, 0]}>
      <Box x={0} z={0} w={5.6} d={4.6} h={0.14} y={0.42} color={INT.stairs}
           material={{ roughness: 0.9, transparent: isTransparent, opacity: opacity }} />

      <Instances limit={treads.length} range={treads.length} castShadow receiveShadow>
        <boxGeometry args={[5.0, 0.1, STAIR_STEP_RUN]} />
        <meshStandardMaterial color={INT.stairs} roughness={0.85} transparent={isTransparent} opacity={opacity} />
        {treads.map((p, i) => <Instance key={i} position={p} />)}
      </Instances>
      <Instances limit={risers.length} range={risers.length}>
        <boxGeometry args={[5.0, 0.17, 0.08]} />
        <meshStandardMaterial color="#8b9098" roughness={0.9} transparent={isTransparent} opacity={opacity} />
        {risers.map((p, i) => <Instance key={i} position={p} />)}
      </Instances>

      {[2.6, -2.6].map((rx) => (
        <mesh key={rx} position={[rx, (0.42 + FLOOR_H) / 2, 0]}>
          <boxGeometry args={[0.09, FLOOR_H, 0.12]} />
          <meshStandardMaterial color="#9aa3ad" metalness={0.6} roughness={0.35} transparent={isTransparent} opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

/** Табло эвакуационного выхода */
function ExitSign({ x, z, rot, texture, yOffset = 0, opacity = 1, isTransparent = false }) {
  return (
    <group position={[x, yOffset, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 2.55, 0]} castShadow>
        <boxGeometry args={[2.3, 0.72, 0.16]} />
        <meshStandardMaterial color="#1a3a2c" roughness={0.6} transparent={isTransparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 2.55, 0.1]}>
        <planeGeometry args={[2.1, 0.6]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent={isTransparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 3.0, 0]}>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#7d848c" metalness={0.5} roughness={0.5} transparent={isTransparent} opacity={opacity} />
      </mesh>
    </group>
  );
}

/* ── Оборудование через инстансы ── */
function Equipment({ yOffset = 0, opacity = 1, isTransparent = false }) {
  return (
    <group>
      <Instances limit={FIRE_EXT.length} range={FIRE_EXT.length} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.1, 0.28]} />
        <meshStandardMaterial color="#b9bfc7" roughness={0.55} metalness={0.25} transparent={isTransparent} opacity={opacity} />
        {FIRE_EXT.map(([x, z], i) => <Instance key={i} position={[x, FLOOR_TOP + yOffset + 0.85, z]} />)}
      </Instances>
      <Instances limit={FIRE_EXT.length} range={FIRE_EXT.length} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.72, 12]} />
        <meshStandardMaterial color={INT.fire} roughness={0.42} metalness={0.3} transparent={isTransparent} opacity={opacity} />
        {FIRE_EXT.map(([x, z], i) => <Instance key={i} position={[x, FLOOR_TOP + yOffset + 0.82, z + 0.02]} />)}
      </Instances>

      <Instances limit={ELEC.length} range={ELEC.length} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.1, 0.22]} />
        <meshStandardMaterial color="#aeb4bc" roughness={0.5} metalness={0.35} transparent={isTransparent} opacity={opacity} />
        {ELEC.map(([x, z], i) => <Instance key={i} position={[x, FLOOR_TOP + yOffset + 1.3, z]} />)}
      </Instances>
      <Instances limit={ELEC.length} range={ELEC.length}>
        <coneGeometry args={[0.16, 0.28, 3]} />
        <meshStandardMaterial color={INT.electric} roughness={0.5} transparent={isTransparent} opacity={opacity} />
        {ELEC.map(([x, z], i) => <Instance key={i} position={[x, FLOOR_TOP + yOffset + 2.05, z + 0.12]} />)}
      </Instances>

      {ARROWS.map(([x, z, rot], i) => (
        <group key={i} position={[x, 0.45 + yOffset, z]} rotation={[0, rot, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.34, 3.6]} />
            <meshStandardMaterial color={INT.exit} roughness={0.6} transparent={isTransparent} opacity={opacity} />
          </mesh>
          <mesh position={[0, 0, -2.35]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.62, 3]} />
            <meshStandardMaterial color={INT.exit} roughness={0.6} transparent={isTransparent} opacity={opacity} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Аптечка */
function MedBox({ x, z, yOffset = 0, opacity = 1, isTransparent = false }) {
  return (
    <group position={[x, FLOOR_TOP + yOffset, z]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.6, 0.3]} />
        <meshStandardMaterial color="#e8eaec" roughness={0.55} transparent={isTransparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 1.5, 0.17]}>
        <boxGeometry args={[0.4, 0.1, 0.03]} />
        <meshStandardMaterial color="#b6222c" roughness={0.5} transparent={isTransparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 1.5, 0.17]}>
        <boxGeometry args={[0.1, 0.4, 0.03]} />
        <meshStandardMaterial color="#b6222c" roughness={0.5} transparent={isTransparent} opacity={opacity} />
      </mesh>
    </group>
  );
}

/** Планировка 1-4 этажей в стеке. */
export default function FloorPlan({ visible = true, roofVisible = false, level, activeFloor = 1, immersive = false }) {
  const exitTexture = useMemo(() => exitSignMap(), []);

  // Предварительно генерируем текстуры надписей кабинетов для каждого этажа
  const roomTexturesByFloor = useMemo(() => {
    const res = {};
    for (let f = 1; f <= 4; f++) {
      res[f] = ROOMS.map((r) => {
        let label = r.label;
        let sub = r.sub;
        if (f > 1) {
          if (r.label === 'Холл') {
            label = 'Холл';
          } else if (r.label === 'Мед' || r.label === 'med') {
            label = `${f}09`;
            sub = 'Лаборатория';
          } else {
            label = r.label.replace(/^1/, f);
            if (label === `${f}05`) sub = f === 2 ? 'Физ.Деканат' : f === 3 ? 'Мат.Деканат' : 'Ректор';
            else if (label === `${f}23`) sub = 'Кафедра';
            else if (label === `${f}31`) sub = f === 2 ? 'Коворкинг' : f === 3 ? 'Библиотека' : 'Архив';
            else if (label === `${f}34`) sub = 'Буфет';
          }
        }
        return labelMap(label, sub);
      });
    }
    return res;
  }, []);

  const doors = useMemo(() => ROOMS.filter((r) => r.door), []);

  if (!visible) return null;

  return (
    <group>
      {[1, 2, 3, 4].map((f) => {
        if (immersive && f !== activeFloor) return null;
        const isActive = f === activeFloor;
        const opacity = isActive ? 1.0 : 0.15;
        const isTransparent = !isActive;
        const yOffset = (f - 1) * FLOOR_H;

        // Фильтруем комнаты текущего этажа для передачи в Furniture
        const floorRooms = ROOMS.map((r) => {
          let label = r.label;
          let sub = r.sub;
          let kind = r.kind;
          if (f > 1) {
            if (r.label === 'Мед' || r.label === 'med') {
              label = `${f}09`;
              sub = 'Лаборатория';
              kind = 'classRoom'; // на верхних этажах это учебные лаборатории
            } else if (r.label.startsWith('1')) {
              label = r.label.replace(/^1/, f);
              if (label === `${f}01`) kind = f === 4 ? 'techRoom' : 'adminRoom';
              else if (label === `${f}02`) kind = 'adminRoom';
            }
          }
          return { ...r, label, sub, kind };
        });

        return (
          <group key={f}>
            {/* Перекрытия */}
            {SLABS.map(([x, z, w, d], i) => (
              <Slab key={`s${i}`} x={x} z={z} w={w} d={d} yOffset={yOffset} opacity={opacity} isTransparent={isTransparent} immersive={immersive} />
            ))}

            {/* Стены */}
            {WALLS.map(([x, z, w, d, ext, rot], i) => (
              <Wall key={`w${i}`} x={x} z={z} w={w} d={d} external={ext} rot={rot ?? 0} yOffset={yOffset} opacity={opacity} isTransparent={isTransparent} immersive={immersive} />
            ))}

            {/* Кабинеты и надписи */}
            {ROOMS.map((r, i) => (
              <Room
                key={r.label + i}
                room={{ ...r, kind: floorRooms[i].kind }}
                immersive={immersive}
                texture={roomTexturesByFloor[f][i]}
                yOffset={yOffset}
                opacity={opacity}
                isTransparent={isTransparent}
              />
            ))}

            {/* Двери */}
            {doors.map((r) => (
              <Door key={`d${r.label}`} x={r.door[0]} z={r.door[1]} axis={r.door[2]} yOffset={yOffset} opacity={opacity} isTransparent={isTransparent} immersive={immersive} />
            ))}

            {/* Мебель */}
            {!immersive && level?.furniture !== false && (
              <Furniture rooms={floorRooms} yOffset={yOffset} opacity={opacity} isTransparent={isTransparent} />
            )}

            {/* Ленточное остекление */}
            {!immersive && WINDOW_BANDS.map(([x, z, w, a], i) => (
              <group key={`win${i}`} position={[x, yOffset, z]} rotation={[0, a, 0]}>
                <mesh position={[0, 2.5, 0]}>
                  <boxGeometry args={[w, 1.5, 0.12]} />
                  <meshStandardMaterial
                    color={INT.glass} roughness={0.12} metalness={0.5}
                    transparent opacity={opacity * 0.55} envMapIntensity={1.4}
                  />
                </mesh>
                <mesh position={[0, 1.7, 0]}>
                  <boxGeometry args={[w, 0.14, 0.2]} />
                  <meshStandardMaterial color={INT.wallCap} roughness={0.7} transparent={isTransparent} opacity={opacity} />
                </mesh>
              </group>
            ))}

            {/* Лестницы (отрисовываем на 1, 2 и 3 этажах, они ведут вверх) */}
            {!immersive && f < 4 && STAIRS.map(([x, z, r], i) => (
              <Stairs key={`st${i}`} x={x} z={z} rot={r} yOffset={yOffset} opacity={opacity} isTransparent={isTransparent} />
            ))}

            {/* Табло выхода и аптечки */}
            {EXIT_SIGNS.map(([x, z, r], i) => (
              <ExitSign key={`ex${i}`} x={x} z={z} rot={r} texture={exitTexture} yOffset={yOffset} opacity={opacity} isTransparent={isTransparent} />
            ))}

            <Equipment yOffset={yOffset} opacity={opacity} isTransparent={isTransparent} />
            {immersive && <WalkInterior floor={f} />}

            {f === 1 && (
              <>
                <MedBox x={-41} z={-14} yOffset={yOffset} opacity={opacity} isTransparent={isTransparent} />
                {/* Входная группа первого этажа */}
                <Box x={-8} z={40.1} w={12} d={0.3} h={3.0} y={0.5} color={INT.glass}
                     material={{ roughness: 0.12, metalness: 0.5, transparent: true, opacity: 0.5 }} />
                <Box x={-8} z={40.5} w={16.4} d={5.2} h={0.34} y={3.5} color={INT.roof}
                     material={{ roughness: 0.85 }} />
              </>
            )}

            {/* Кровля (только на верхнем 4 этаже) */}
            {f === 4 && (
              <group visible={roofVisible}>
                {ROOF_SLABS.map(([x, z, w, d], i) => (
                  <Box key={`rf${i}`} x={x} z={z} w={w + 0.8} d={d + 0.8} h={0.4} y={WALL_H + 0.6 + yOffset}
                       color={INT.roof} material={{ roughness: 0.9, transparent: true, opacity: opacity * 0.85 }} />
                ))}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
