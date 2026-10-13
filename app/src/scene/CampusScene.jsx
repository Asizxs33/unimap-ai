import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Lightformer, AdaptiveDpr, Stars } from '@react-three/drei';
import Building from './Building.jsx';
import FloorPlan from './FloorPlan.jsx';
import Site from './Site.jsx';
import Cinematic from './Cinematic.jsx';
import { RouteLine, Walker } from './Route.jsx';
import { useRouteCurve } from './useRouteCurve.js';
import { NODES } from '../data/campus.js';
import { SITE } from './palette.js';
import { lawnMap } from './textures.js';
import { LEVELS } from '../lib/quality.js';
import FreeWalk from './FreeWalk.jsx';

/* Положения камеры: [позиция, точка взгляда].
   Считаны от габаритов застройки (X -58..58, Z -52..40, высота 22) и
   угла обзора, а не подобраны на глаз — центр кадра совпадает с центром
   корпуса, поэтому здание не уезжает в угол. */
const VIEWS = {
  ext: [[112, 102, 118], [0, 9, -6]],
  iso: [[64, 118, 92], [0, 0, -6]],
  top: [[0, 205, -5.5], [0, 0, -6]],
  walk: null,   // камерой управляет Walker
};

/* Освещение дня и ночи */
const DAY = {
  sky: '#dce8f5',
  fog: [300, 640],
  sun: { pos: [86, 105, 72], intensity: 2.6, color: '#fff1dc' },
  fill: { pos: [-70, 46, -58], intensity: 0.55, color: '#c5d9ed' },
  hemi: ['#dceafa', '#8b8373', 0.65],
  ambient: 0.12,
};
const NIGHT = {
  sky: '#060b13',
  fog: [180, 460],
  sun: { pos: [-60, 90, -80], intensity: 0.6, color: '#2563eb' }, // Синий лунный свет
  fill: { pos: [60, 40, 70], intensity: 0.35, color: '#f59e0b' }, // Теплый желтый заполняющий свет окон
  hemi: ['#1e3a8a', '#d97706', 0.55],
  ambient: 0.16,
};

/** Плавный перелёт камеры при смене режима, по клику на кабинет и по сбросу вида */
function CameraRig({ mode, focus, resetTick, controlsRef, paused }) {
  const walkMode = mode === 'walk' || mode === 'explore';
  const { camera } = useThree();
  const goal = useRef(null);

  useEffect(() => {
    const preset = VIEWS[mode];
    goal.current = preset
      ? { pos: new THREE.Vector3(...preset[0]), target: new THREE.Vector3(...preset[1]) }
      : null;                                  // walk: цели нет, ведёт Walker
  }, [mode, resetTick]);

  /* Когда есть маршрут, кадрируем его целиком, а не только точку
     назначения: иначе камера утыкается в кабинет и путь не виден. */
  useEffect(() => {
    if (!focus || walkMode) return;
    const pts = focus.path?.map((id) => NODES[id]).filter(Boolean);
    if (pts?.length > 1) {
      const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
      const dist = Math.max(38, span * 1.15);
      goal.current = {
        pos: new THREE.Vector3(cx + dist * 0.55, 18 + dist * 0.72, cz + dist * 0.8),
        target: new THREE.Vector3(cx, 1, cz),
      };
      return;
    }
    goal.current = {
      pos: new THREE.Vector3(focus.x + 16, 24, focus.z + 22),
      target: new THREE.Vector3(focus.x, 1, focus.z),
    };
  }, [focus, walkMode]);

  useFrame(() => {
    /* Во время облёта камерой правит Cinematic, в режиме ходьбы — Walker.
       Без этой проверки перелёт к маршруту продолжался поверх вида от
       первого лица и утаскивал камеру вверх. */
    if (paused || walkMode) return;
    const g = goal.current;
    if (!g || !controlsRef.current) return;
    camera.position.lerp(g.pos, 0.08);
    controlsRef.current.target.lerp(g.target, 0.1);
    if (camera.position.distanceTo(g.pos) < 0.4) goal.current = null;
  });

  return null;
}

/** Угол обзора: узкий для общих планов, широкий для вида от первого лица */
function FieldOfView({ mode }) {
  const camera = useThree((st) => st.camera);
  useEffect(() => {
    camera.fov = mode === 'explore' ? 72 : mode === 'walk' ? 58 : 42;
    camera.updateProjectionMatrix();
  }, [camera, mode]);
  return null;
}

/* В режиме разработки отдаём сцену в window — так её можно
   проверить из консоли (сколько мешей, какие материалы, тени). */
function DevProbe() {
  const store = useThree((s) => s);
  const { scene, gl, camera, advance, invalidate, size } = store;
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__unimap = { scene, gl, camera, advance, invalidate, size };
    return () => { delete window.__unimap; };
  }, [scene, gl, camera, advance, invalidate, size]);
  return null;
}

/** Невидимые сферы-хитбоксы: по ним ловим клик на кабинет */
function NodePicker({ enabled, onPick }) {
  if (!enabled) return null;
  return (
    <group>
      {Object.entries(NODES).map(([id, n]) => (
        <mesh
          key={id}
          position={[n.x, 1.2, n.z]}
          onClick={(e) => { e.stopPropagation(); onPick(id); }}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[2, 8, 6]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      ))}
    </group>
  );
}

function CameraRotationListener() {
  useFrame(({ camera }) => {
    const angle = Math.atan2(camera.position.x, camera.position.z) * (180 / Math.PI);
    document.documentElement.style.setProperty('--cam-rotation', `${angle}deg`);
  });
  return null;
}

/**
 * Свет: одно направленное «солнце» плюс собранное из светоформеров окружение.
 *
 * SoftShadows (PCSS) из drei здесь НЕ используется намеренно: на three 0.185
 * он вызывает удалённую unpackRGBAToDepth, шейдер MeshStandardMaterial не
 * компилируется и сцена не рисуется вообще. Мягкость берём размером карты и
 * shadow-radius.
 */
function Lighting({ preset, level, night }) {
  const p = preset;
  /* Окружение освещает сцену через IBL и не зависит от солнца — если его
     не приглушить, ночью здание остаётся дневным при чёрном небе. */
  const envK = night ? 0.1 : 1;
  return (
    <>
      <hemisphereLight args={p.hemi} />
      <ambientLight intensity={p.ambient} />

      <directionalLight
        position={p.sun.pos}
        intensity={p.sun.intensity}
        color={p.sun.color}
        castShadow={level.shadows}
        shadow-mapSize={[level.shadowMap, level.shadowMap]}
        shadow-bias={-0.0008}
        shadow-normalBias={0.035}
        shadow-radius={4}
        shadow-camera-left={-140}
        shadow-camera-right={140}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
        shadow-camera-near={1}
        shadow-camera-far={420}
      />
      <directionalLight position={p.fill.pos} intensity={p.fill.intensity} color={p.fill.color} />

      {level.env && !night && <Suspense fallback={null}>
        <Environment files="/environment/park_parking_1k.hdr" environmentIntensity={0.55} environmentRotation={[0, 0.8, 0]} />
      </Suspense>}
      {level.env && night && (
        <Environment key={night ? "n" : "d"} resolution={128} frames={1}>
          <Lightformer intensity={1.1 * envK} color={night ? "#3b5a8c" : "#eaf2ff"} position={[0, 12, 0]} scale={[24, 24, 1]}
                       rotation={[-Math.PI / 2, 0, 0]} />
          <Lightformer intensity={0.7 * envK} color="#fff1d6" position={[10, 6, 8]} scale={[14, 8, 1]} />
          <Lightformer intensity={0.45 * envK} color="#a8c4e4" position={[-12, 5, -8]} scale={[14, 8, 1]}
                       rotation={[0, Math.PI, 0]} />
        </Environment>
      )}
    </>
  );
}

/** Земля: газон на всю округу плюс отмостка по контуру застройки */
function Ground({ level }) {
  const lawn = useMemo(() => lawnMap(SITE.lawn, SITE.lawnDry), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow={level.shadows}>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial map={lawn} color={SITE.ground} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 6]} receiveShadow={level.shadows}>
        <planeGeometry args={[150, 122]} />
        <meshStandardMaterial color={SITE.plaza} roughness={0.95} />
      </mesh>
    </>
  );
}

/* postprocessing — ~400 КБ gzip, самый тяжёлый кусок сборки. Грузим его
   отдельным чанком только когда сцена реально смонтирована, а не вместе
   с общим бандлом (иначе он тянулся бы даже на онбординге и на «Лёгком»
   качестве, где эффекты всё равно выключены). */
const PostFX = lazy(() => import('./PostFX.jsx'));

/**
 * Сцена кампуса. Режимы:
 *   ext  — внешний вид корпуса
 *   iso  — план 1 этажа под углом
 *   top  — план сверху
 *   walk — от третьего лица за идущим человеком
 */
export default function CampusScene({
  mode, path, roofVisible, focus, resetTick, onPickNode,
  quality = 'high', night = false, intro = false, onIntroEnd, activeFloor = 1,
  walkInput, walkPaused, onWalkStatus, onWalkAction, onWalkPause,
}) {
  const controlsRef = useRef();
  const curve = useRouteCurve(path);
  const isExterior = mode === 'ext';
  const isExploring = mode === 'explore';
  const selectedLevel = LEVELS[quality] ?? LEVELS.high;
  const level = isExploring ? { ...selectedLevel, shadowMap: Math.min(selectedLevel.shadowMap, 2048) } : selectedLevel;
  const preset = night ? NIGHT : DAY;

  return (
    <Canvas
      shadows
      dpr={level.dpr}
      camera={{ fov: 42, near: 0.12, far: 900, position: VIEWS.ext[0] }}
      gl={{ antialias: !level.post, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[preset.sky]} />
      <fog attach="fog" args={[preset.sky, preset.fog[0], preset.fog[1]]} />
      {night && <Stars radius={400} depth={60} count={1800} factor={7} fade speed={0.6} />}

      <Lighting preset={preset} level={level} night={night} />
      <Ground level={level} />
      {level.site && <Site night={night} />}

      {isExterior && <Building night={night} level={level} />}
      {!isExterior && <FloorPlan roofVisible={roofVisible} level={level} activeFloor={activeFloor} immersive={isExploring} />}

      {!isExploring && <RouteLine curve={curve} visible={!isExterior} />}
      {!isExploring && <Walker
        curve={curve}
        visible={!isExterior}
        followCamera={mode === 'walk'}
        controlsRef={controlsRef}
      />}
      {isExploring && <FreeWalk input={walkInput} floor={activeFloor} resetTick={resetTick} paused={walkPaused}
        onStatus={onWalkStatus} onAction={onWalkAction} onPause={onWalkPause} />}

      <NodePicker enabled={!isExterior && !isExploring} onPick={onPickNode} />

      <Cinematic active={intro} onEnd={onIntroEnd} />
      <CameraRig
        mode={mode} focus={focus} resetTick={resetTick}
        controlsRef={controlsRef} paused={intro}
      />
      {/* В режиме ходьбы OrbitControls не монтируем вовсе: даже при
          enabled={false} он каждый кадр вызывает update() и пересчитывает
          camera.position из своих внутренних сферических координат —
          это перебивало камеру, которую двигает Walker, и держало её в
          точке последнего вида (отсюда "камера смотрит вниз"). */}
      {mode !== 'walk' && !isExploring && (
        <OrbitControls
          ref={controlsRef}
          enabled={!intro}
          enableDamping
          dampingFactor={0.07}
          minDistance={8}
          maxDistance={330}
          maxPolarAngle={Math.PI / 2.06}
          makeDefault
        />
      )}

      <FieldOfView mode={mode} />
      <CameraRotationListener />
      <DevProbe />
      {/* Не рендерим даже Suspense-обёртку на «Лёгком» качестве — иначе
          чанк PostFX всё равно скачался бы, просто чтобы вернуть null. */}
      {level.post && (
        <Suspense fallback={null}>
          <PostFX level={level} night={night} interior={isExploring} />
        </Suspense>
      )}
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  );
}
