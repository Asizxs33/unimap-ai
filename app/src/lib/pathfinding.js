import { NODES, EDGES, ALIASES, NODE_ALIASES } from '../data/campus.js';

/* Список смежности строим один раз при загрузке модуля */
const adj = {};
for (const [a, b] of EDGES) {
  if (!NODES[a] || !NODES[b]) continue;
  const w = Math.hypot(NODES[a].x - NODES[b].x, (NODES[a].y ?? 0) - (NODES[b].y ?? 0), NODES[a].z - NODES[b].z);
  (adj[a] ||= []).push([b, w]);
  (adj[b] ||= []).push([a, w]);
}

/* Узлы с лестницами — для режима «только доступные маршруты» */
const isStairNode = (id) => id.startsWith('stairs');
const STAIR_PENALTY = 400;   // метров штрафа: обход находится, если он вообще есть

/**
 * Кратчайший путь по коридорам (Дейкстра).
 * `avoidStairs` не запрещает лестницы, а делает их дорогими: если обход
 * существует, маршрут пойдёт по нему, если нет — путь всё равно построится.
 */
export function findPath(start, goal, { avoidStairs = false } = {}) {
  start = NODE_ALIASES[start] ?? start;
  goal = NODE_ALIASES[goal] ?? goal;
  if (!NODES[start] || !NODES[goal]) return null;
  const dist = {}, prev = {}, queue = new Set(Object.keys(NODES).filter((k) => !NODE_ALIASES[k]));
  for (const k of queue) dist[k] = Infinity;
  dist[start] = 0;

  while (queue.size) {
    let u = null, best = Infinity;
    for (const k of queue) if (dist[k] < best) { best = dist[k]; u = k; }
    if (u === null || best === Infinity || u === goal) break;
    queue.delete(u);
    for (const [v, w] of adj[u] || []) {
      if (!queue.has(v)) continue;
      const penalty = avoidStairs && isStairNode(v) && v !== goal ? STAIR_PENALTY : 0;
      const alt = dist[u] + w + penalty;
      if (alt < dist[v]) { dist[v] = alt; prev[v] = u; }
    }
  }

  if (dist[goal] === Infinity) return null;
  const path = [];
  for (let cur = goal; cur != null; cur = prev[cur]) path.unshift(cur);
  return path;
}

/** Есть ли на маршруте лестницы */
export function pathHasStairs(path) {
  return !!path?.some((id) => isStairNode(id));
}

/** Время в пути в минутах при скорости шага 1.35 м/с */
export function walkMinutes(path) {
  const meters = pathLength(path);
  return Math.max(1, Math.round(meters / 1.35 / 60));
}

/** Время прибытия «10:42» через N минут от текущего момента */
export function arrivalTime(minutes, now = new Date()) {
  const t = new Date(now.getTime() + minutes * 60000);
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

/** Поиск узла по номеру кабинета, синониму или части названия */
export function resolveQuery(q) {
  if (!q) return null;
  const k = q.toLowerCase().trim();
  if (NODES[k]) return k;
  if (ALIASES[k]) return ALIASES[k];
  for (const id in NODES) {
    if (NODES[id].label.toLowerCase().includes(k)) return id;
  }
  return null;
}

/** Пошаговые подсказки: «прямо», «поверните налево» и т.д. */
export function buildSteps(path) {
  if (!path?.length) return [];
  const pts = path.map((id) => NODES[id]);
  return path.map((id, i) => {
    const node = NODES[id];
    let dir = 'straight';
    let text = `Идите: ${node.label}`;

    if (i === 0) {
      text = `Старт: ${node.label}`;
      dir = 'flag';
    } else if (i === path.length - 1) {
      text = `Финиш: ${node.label}`;
      dir = 'place';
    } else {
      const a = pts[i - 1], b = pts[i], c = pts[i + 1] ?? b;
      const v1x = b.x - a.x, v1z = b.z - a.z;
      const v2x = c.x - b.x, v2z = c.z - b.z;
      const cross = v1x * v2z - v1z * v2x;
      const dot = v1x * v2x + v1z * v2z;
      const angle = Math.atan2(Math.abs(cross), dot);
      if (angle > 0.38) {
        dir = cross > 0 ? 'turn_left' : 'turn_right';
        text = `Поверните ${cross > 0 ? 'налево' : 'направо'} (${node.label})`;
      } else {
        text = `Прямо · ${node.label}`;
      }
    }

    const dist = i > 0 ? Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z) : 0;
    return {
      text,
      dir,
      meta: dist > 0 ? `${dist.toFixed(1)} м · шаг ${i}/${path.length - 1}` : 'Начало маршрута',
    };
  });
}

/** Полная длина маршрута в метрах */
export function pathLength(path) {
  if (!path || path.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    const a = NODES[path[i - 1]], b = NODES[path[i]];
    sum += Math.hypot(a.x - b.x, (a.y ?? 0) - (b.y ?? 0), a.z - b.z);
  }
  return sum;
}
