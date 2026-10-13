import { useMemo } from 'react';
import * as THREE from 'three';
import { Instances, Instance } from '@react-three/drei';
import { Box } from './primitives.jsx';
import { EXT, FLOOR_H, FLOORS, BLD_H } from './palette.js';
import { plasterMap, roofMap, facadeSignMap, ledMap } from './textures.js';

/* ============================================================
   Внешний облик корпуса.

   Что изменилось против первой версии:
   — окно теперь не наклеенный прямоугольник, а ниша: откос, рама,
     стекло в глубине, подоконник и вертикальный импост. Именно
     отсутствие глубины делало фасад «нарисованным»;
   — штукатурка получила процедурную текстуру, а пояски — фаску;
   — вместо ровного золота три близких тона по светлоте.
   ============================================================ */

const WIN = {
  step: 4.8,       // шаг по фасаду
  w: 2.2,          // ширина проёма
  h: 2.75,         // высота проёма
  depth: 0.42,     // насколько окно уходит в стену
  frame: 0.13,     // толщина рамы
};

/* ── Объём корпуса ── */
function Mass({ cx, cz, w, d, floors = FLOORS, tone = EXT.wall }) {
  const H = floors * FLOOR_H;
  const plaster = useMemo(() => plasterMap(tone), [tone]);
  const roof = useMemo(() => roofMap(EXT.roofTop), []);
  const bands = Array.from({ length: floors - 1 }, (_, i) => i + 1);

  return (
    <group>
      {/* Цоколь: тёмный, с выносом — здание «стоит», а не парит */}
      <Box x={cx} z={cz} w={w + 0.7} d={d + 0.7} h={0.55} color={EXT.plinthDark}
           material={{ roughness: 0.95 }} />
      <Box x={cx} z={cz} w={w} d={d} h={FLOOR_H - 0.55} y={0.55} color={EXT.plinth}
           material={{ roughness: 0.88 }} />

      {/* Основной объём со штукатуркой */}
      <mesh position={[cx, FLOOR_H + (H - FLOOR_H) / 2, cz]} castShadow receiveShadow>
        <boxGeometry args={[w, H - FLOOR_H, d]} />
        <meshStandardMaterial map={plaster} bumpMap={plaster} bumpScale={0.055} roughness={0.92} />
      </mesh>

      {/* Межэтажные пояски: две плоскости, чтобы поймать тень снизу */}
      {bands.map((f) => (
        <group key={f}>
          <Box x={cx} z={cz} w={w + 0.34} d={d + 0.34} h={0.26}
               y={f * FLOOR_H - 0.13} color={EXT.trim} material={{ roughness: 0.8 }} />
          <Box x={cx} z={cz} w={w + 0.16} d={d + 0.16} h={0.1}
               y={f * FLOOR_H + 0.13} color={EXT.wallCool} material={{ roughness: 0.9 }} shadow={false} />
        </group>
      ))}

      {/* Венчающий карниз с выносом и парапет */}
      <Box x={cx} z={cz} w={w + 1.5} d={d + 1.5} h={0.42} y={H} color={EXT.trim}
           material={{ roughness: 0.78 }} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box x={cx} z={cz + side * d / 2} w={w + 0.5} d={0.45} h={0.95} y={H + 0.42} color={tone} />
          <Box x={cx + side * w / 2} z={cz} w={0.45} d={d} h={0.95} y={H + 0.42} color={tone} />
          <Box x={cx} z={cz + side * d / 2} w={w + 0.65} d={0.62} h={0.09} y={H + 1.37} color="#8e9392" material={{ metalness: 0.55, roughness: 0.42 }} />
          <Box x={cx + side * w / 2} z={cz} w={0.62} d={d} h={0.09} y={H + 1.37} color="#8e9392" material={{ metalness: 0.55, roughness: 0.42 }} />
        </group>
      ))}

      {/* Кровля с мембраной */}
      <mesh position={[cx, H + 0.44, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={roof} bumpMap={roof} bumpScale={0.035} roughness={0.98} />
      </mesh>
    </group>
  );
}

/*
 * Фасады: [ось, плоскость, от, до, наружу, пропуски, параметры].
 *
 * Окна больше не заполняют каждую доступную стену одинаковой сеткой.
 * У наружных фасадов есть группы по 2–3 окна и глухие простенки между
 * ними, у дворовых стен первый этаж оставлен спокойнее, а на торцах
 * проёмов меньше. Такой ритм показывает реальные секции здания.
 */
const FACADES = [
  ['x', 40, -58, 58, 1, [[-23, 7], [35, 43]], { group: 3, ground: true }],
  ['x', 20, -58, 58, -1, [[-59, -35], [5, 29]], { group: 3, ground: false }],
  ['z', 58, 20, 40, 1, [], { group: 2, ground: false }],
  ['z', -58, 20, 40, -1, [], { group: 2, ground: false }],
  ['z', -58, -52, 20, -1, [[-27, -17]], { group: 3, ground: true }],
  ['z', -36, -52, 18, 1, [[-28, -18]], { group: 2, ground: false }],
  ['x', -52, -58, -36, -1, [], { group: 2, ground: false }],
  ['z', 28, -42, 20, 1, [[-18, -8]], { group: 3, ground: true }],
  ['z', 6, -42, 18, -1, [[-18, -8]], { group: 2, ground: false }],
  ['x', -42, 6, 28, -1, [], { group: 2, ground: false }],
  ['x', 42, -21, 5, 1, [[-15, -1]], { group: 2, ground: false }],
];

/** Позиции всех окон корпуса */
function useWindowSlots() {
  return useMemo(() => {
    const out = [];
    for (const [axis, fixed, from, to, normal, skip, options] of FACADES) {
      const span = to - from;
      const n = Math.max(0, Math.floor(span / WIN.step));
      const pad = (span - n * WIN.step) / 2 + WIN.step / 2;
      for (let f = 0; f < FLOORS; f++) {
        if (f === 0 && !options.ground) continue;
        const y = f * FLOOR_H + FLOOR_H / 2 - 0.1;
        for (let i = 0; i < n; i++) {
          const p = from + pad + i * WIN.step;
          if (skip.some(([a, b]) => p > a && p < b)) continue;
          /* Последнее место в каждой группе остаётся глухим простенком. */
          if ((i + 1) % (options.group + 1) === 0) continue;
          out.push({
            x: axis === 'x' ? p : fixed,
            z: axis === 'x' ? fixed : p,
            y,
            rot: axis === 'x' ? 0 : Math.PI / 2,
            n: normal,
          });
        }
      }
    }
    return out;
  }, []);
}

/**
 * Окна инстансами: пять слоёв на проём (ниша, стекло, рама сверху/снизу,
 * импост, подоконник), но каждый слой — один инстансированный меш.
 */
function Windows({ night }) {
  const slots = useWindowSlots();

  /* Ночью горит примерно каждое третье окно — детерминированно,
     чтобы картинка не мерцала между перерисовками */
  const lit = useMemo(
    () => slots.map((s, i) => ((i * 2654435761) % 100) / 100 < 0.34),
    [slots],
  );

  /* Инстансу нужны позиция и поворот в мировых координатах.
     Смещение вглубь стены считаем по нормали фасада. */
  const layer = (offset, forRot0, forRot90) => slots.map((s) => {
    const along = s.rot === 0 ? forRot0 : forRot90;
    return {
      pos: [
        s.x + (s.rot === 0 ? along.x : s.n * offset),
        s.y + along.y,
        s.z + (s.rot === 0 ? s.n * offset : along.x),
      ],
      rot: [0, s.rot, 0],
    };
  });

  const zero = { x: 0, y: 0 };
  /* Стена — сплошной объём, вырезать в ней проём нечем, поэтому окно
     собирается СНАРУЖИ: тёмная подложка у поверхности, стекло чуть
     впереди, а глубину дают выступающие отлив, перемычка и импост —
     они отбрасывают тень на стекло. Всё, что задвинуть внутрь, стена
     просто закроет. */
  const reveal = layer(0.035, zero, zero);
  const glass = layer(0.09, zero, zero);
  const mullion = layer(0.20, zero, zero);
  const lintel = layer(0.22, { x: 0, y: WIN.h / 2 + 0.07 }, { x: 0, y: WIN.h / 2 + 0.07 });
  const sill = layer(0.30, { x: 0, y: -WIN.h / 2 - 0.06 }, { x: 0, y: -WIN.h / 2 - 0.06 });
  const jambs = [-1, 1].flatMap(side => layer(0.2, { x: side * WIN.w / 2, y: 0 }, { x: side * WIN.w / 2, y: 0 }));
  const rails = [-1, 1].flatMap(side => layer(0.2, { x: 0, y: side * WIN.h / 2 }, { x: 0, y: side * WIN.h / 2 }));
  const transoms = layer(0.20, { x: 0, y: 0.62 }, { x: 0, y: 0.62 });

  return (
    <group>
      {/* Задняя стенка ниши — тёмная, создаёт глубину проёма */}
      <Instances limit={reveal.length} range={reveal.length} receiveShadow>
        <boxGeometry args={[WIN.w + 0.26, WIN.h + 0.26, 0.05]} />
        <meshStandardMaterial color={night ? '#141c28' : '#6f6a5c'} roughness={0.95} />
        {reveal.map((it, i) => <Instance key={i} position={it.pos} rotation={it.rot} />)}
      </Instances>

      {/* Стекло в глубине проёма. Ночью светящиеся окна вынесены
          в отдельный меш — так их подхватывает Bloom */}
      <Instances limit={glass.length} range={glass.length}>
        <boxGeometry args={[WIN.w, WIN.h, 0.08]} />
        <meshStandardMaterial
          color={night ? '#0d1622' : '#ffffff'}
          roughness={0.19} metalness={0.38} envMapIntensity={1.3}
        />
        {glass.map((it, i) => (
          (!night || !lit[i]) ? <Instance key={i} position={it.pos} rotation={it.rot} color={night ? '#ffffff' : ['#496573', '#607b86', '#354b57', '#7c8e92'][i % 4]} /> : null
        ))}
      </Instances>
      {night && (
        <Instances limit={glass.length} range={glass.length}>
          <boxGeometry args={[WIN.w, WIN.h, 0.08]} />
          <meshBasicMaterial color="#ffd89b" toneMapped={false} />
          {glass.map((it, i) => (
            lit[i] ? <Instance key={i} position={it.pos} rotation={it.rot} /> : null
          ))}
        </Instances>
      )}

      {/* Вертикальный импост — делит окно на две створки */}
      <Instances limit={jambs.length} range={jambs.length} castShadow receiveShadow>
        <boxGeometry args={[WIN.frame, WIN.h + 0.15, 0.22]} />
        <meshStandardMaterial color={EXT.frame} roughness={0.55} metalness={0.15} />
        {jambs.map((it, i) => <Instance key={i} position={it.pos} rotation={it.rot} />)}
      </Instances>
      <Instances limit={rails.length + transoms.length} range={rails.length + transoms.length} castShadow>
        <boxGeometry args={[WIN.w, 0.10, 0.20]} />
        <meshStandardMaterial color={EXT.frame} roughness={0.55} metalness={0.15} />
        {[...rails, ...transoms].map((it, i) => <Instance key={i} position={it.pos} rotation={it.rot} />)}
      </Instances>
      <Instances limit={mullion.length} range={mullion.length} castShadow>
        <boxGeometry args={[WIN.frame, WIN.h, 0.1]} />
        <meshStandardMaterial color={EXT.frame} roughness={0.6} />
        {mullion.map((it, i) => <Instance key={i} position={it.pos} rotation={it.rot} />)}
      </Instances>

      {/* Подоконник с выносом — ловит тень под окном */}
      <Instances limit={sill.length} range={sill.length} castShadow receiveShadow>
        <boxGeometry args={[WIN.w + 0.46, 0.14, 0.38]} />
        <meshStandardMaterial color={EXT.trim} roughness={0.78} />
        {sill.map((it, i) => <Instance key={i} position={it.pos} rotation={it.rot} />)}
      </Instances>

      {/* Перемычка сверху */}
      <Instances limit={lintel.length} range={lintel.length} castShadow>
        <boxGeometry args={[WIN.w + 0.36, 0.18, 0.26]} />
        <meshStandardMaterial color={EXT.trim} roughness={0.8} />
        {lintel.map((it, i) => <Instance key={i} position={it.pos} rotation={it.rot} />)}
      </Instances>
    </group>
  );
}

/* ── Входная группа ── */
function Entrance({ night = false }) {
  const sign = useMemo(() => facadeSignMap(), []);
  const led = useMemo(() => ledMap(), []);

  return (
    <group>
      {/* Витраж первого этажа: рама + стекло, а не одна плита */}
      <Box x={-8} z={42.4} w={22.6} d={0.5} h={3.8} y={0.3} color={EXT.plinthDark}
           material={{ roughness: 0.7 }} />
      <Box x={-8} z={42.55} w={21.4} d={0.16} h={3.3} y={0.55} color={EXT.glass}
           material={{ roughness: 0.1, metalness: 0.6, envMapIntensity: 1.8 }} />
      {[-16.5, -11, -5, 0.5].map((x) => (
        <Box key={x} x={x} z={42.62} w={0.16} d={0.14} h={3.3} y={0.55} color={EXT.frame}
             material={{ roughness: 0.6 }} />
      ))}

      {/* Портал и козырёк с подшивкой снизу */}
      <Box x={-8} z={42.6} w={24.6} d={1.0} h={0.85} y={4.0} color={EXT.gold}
           material={{ roughness: 0.42, metalness: 0.55 }} />
      <Box x={-8} z={45.0} w={26.5} d={5.6} h={0.42} y={5.1} color={EXT.trim}
           material={{ roughness: 0.8 }} />
      <Box x={-8} z={45.0} w={25.6} d={5.0} h={0.12} y={4.98} color={EXT.wallCool}
           material={{ roughness: 0.9 }} shadow={false} />

      {/* Колонны козырька с базой и капителью */}
      {[-18, -12, -4, 2].map((x) => (
        <group key={x}>
          <Box x={x} z={47.0} w={1.2} d={1.2} h={0.22} color={EXT.trim} material={{ roughness: 0.8 }} />
          <mesh position={[x, 2.7, 47.0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.46, 4.9, 20]} />
            <meshStandardMaterial color={EXT.wallWarm} roughness={0.9} />
          </mesh>
          <Box x={x} z={47.0} w={1.1} d={1.1} h={0.2} y={5.0} color={EXT.trim} material={{ roughness: 0.8 }} />
        </group>
      ))}

      {/* Крыльцо: три ступени с подступенками */}
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <Box x={-8} z={48.6 + i * 1.1} w={26 - i * 1.4} d={1.1} h={0.16}
               y={0.9 - i * 0.3} color="#c2c0b8" material={{ roughness: 0.95 }} />
          <Box x={-8} z={49.1 + i * 1.1} w={26 - i * 1.4} d={0.12} h={0.3}
               y={0.6 - i * 0.3} color="#a9a79f" material={{ roughness: 0.95 }} shadow={false} />
        </group>
      ))}

      {/* Вывеска */}
      <mesh position={[-8, 4.42, 43.14]}>
        <planeGeometry args={[23.4, 2.0]} />
        <meshStandardMaterial map={sign} roughness={0.45} metalness={0.5} envMapIntensity={1.2} />
      </mesh>

      {/* LED-экран, утопленный в рамку */}
      <Box x={-8} z={42.3} w={12.4} d={0.42} h={7.4} y={7.9} color={EXT.plinthDark}
           material={{ roughness: 0.7 }} />
      <mesh position={[-8, 11.6, 42.53]}>
        <planeGeometry args={[11.2, 6.3]} />
        <meshBasicMaterial map={led} toneMapped={false} />
      </mesh>

      {night && (
        <>
          <pointLight position={[-8, 6, 46]} color="#ffd89b" intensity={38} distance={40} decay={2} />
          <pointLight position={[-8, 12, 46]} color="#7fb0ff" intensity={26} distance={44} decay={2} />
        </>
      )}

      {/* Флаги на кронштейнах */}
      {[-14, -8, -2].map((x, i) => (
        <group key={x}>
          <mesh position={[x, 17.6, 42.8]} rotation={[0, 0, Math.PI / 3.1]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 5, 8]} />
            <meshStandardMaterial color={EXT.trim} metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[x + 1.55, 19.4, 43.4]} castShadow>
            <planeGeometry args={[2.4, 1.4]} />
            <meshStandardMaterial
              color={i === 1 ? '#1f9fb5' : '#22508f'}
              side={THREE.DoubleSide} roughness={0.85}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Оборудование на кровле — силуэт сверху перестаёт быть пустой плитой */
function RoofPlant() {
  const units = [
    [-47, -34], [-47, -6], [-47, 10], [17, -28], [17, 2], [-30, 30], [24, 30], [46, 30],
  ];
  return (
    <group>
      {units.map(([x, z], i) => (
        <group key={i}>
          <Box x={x} z={z} w={3.2} d={2.2} h={1.4} y={BLD_H + 0.44} color="#9aa0a8"
               material={{ roughness: 0.6, metalness: 0.4 }} />
          <mesh position={[x, BLD_H + 1.93, z]} castShadow>
            <cylinderGeometry args={[0.85, 0.85, 0.18, 16]} />
            <meshStandardMaterial color="#7f858d" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Парапетное ограждение по краю нижнего блока */}
      <Box x={0} z={40} w={111} d={0.1} h={0.1} y={BLD_H + 2.36} color="#8b9199" material={{ metalness: 0.5, roughness: 0.5 }} />
      {Array.from({ length: 24 }, (_, i) => (
        <Box key={`r${i}`} x={-55 + i * 4.8} z={40} w={0.1} d={0.1} h={1.0}
             y={BLD_H + 1.46} color="#8b9199" material={{ metalness: 0.5, roughness: 0.5 }} shadow={false} />
      ))}
    </group>
  );
}

/** Внешний облик корпуса: П-образный объём в 4 этажа */
export default function Building({ visible = true, night = false }) {
  return (
    <group visible={visible}>
      <Mass cx={0} cz={30} w={116} d={20} tone={EXT.wall} />
      <Mass cx={-47} cz={-16} w={22} d={72} tone={EXT.wallCool} />
      <Mass cx={17} cz={-11} w={22} d={62} tone={EXT.wallCool} />

      {/* Центральный ризалит над входом — на полтона светлее и с аттиком */}
      <Mass cx={-8} cz={31} w={30} d={22} tone={EXT.wallWarm} />
      <Box x={-8} z={31} w={24} d={16} h={3.4} y={BLD_H + 1.0} color={EXT.wallWarm}
           material={{ roughness: 0.92 }} />
      <Box x={-8} z={31} w={25.6} d={17.6} h={0.5} y={BLD_H + 4.4} color={EXT.trim}
           material={{ roughness: 0.8 }} />

      <Windows night={night} />
      <Entrance night={night} />
      <RoofPlant />
    </group>
  );
}
