import { canStand, movePlayer } from './walkPhysics.js';

const TOUR = [
  [-8, 26], [-47, 26], [-47, -44], [-47, 26],
  [17, 26], [17, -34], [17, 26], [48, 26], [-8, 26], [-8, 34],
];
const free = new Map();
const key = p => `${p.x},${p.z}`;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function clearSegment(a, b) {
  const steps = Math.max(1, Math.ceil(distance(a, b) / 0.08));
  for (let i = 0; i <= steps; i++) {
    if (!canStand(a.x + (b.x - a.x) * i / steps, a.z + (b.z - a.z) * i / steps)) return false;
  }
  return true;
}

function gridFree(p) {
  const id = key(p);
  if (!free.has(id)) free.set(id, canStand(p.x, p.z));
  return free.get(id);
}

function findPath(start, end) {
  if (clearSegment(start, end)) return [{ ...end }];
  const candidates = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const p = { x: Math.round(start.x * 2) / 2 + dx / 2, z: Math.round(start.z * 2) / 2 + dz / 2 };
    if (gridFree(p) && clearSegment(start, p)) candidates.push(p);
  }
  candidates.sort((a, b) => distance(start, a) - distance(start, b));
  if (!candidates.length) return null;
  const first = candidates[0], queue = [first], parents = new Map([[key(first), null]]);
  for (let head = 0; head < queue.length; head++) {
    const p = queue[head];
    if (distance(p, end) < 0.01) {
      const path = [];
      for (let node = p; node; node = parents.get(key(node))) path.push(node);
      path.reverse(); path.unshift({ x: start.x, z: start.z });
      for (let i = path.length - 2; i > 0; i--) {
        const a = path[i - 1], b = path[i], c = path[i + 1];
        if ((b.x - a.x) * (c.z - b.z) === (b.z - a.z) * (c.x - b.x)) path.splice(i, 1);
      }
      // Remove grid corners only when the entire shortcut is walkable.
      const smooth = [path[0]];
      for (let i = 0; i < path.length - 1;) {
        let next = path.length - 1;
        while (next > i + 1 && !clearSegment(path[i], path[next])) next--;
        smooth.push(path[next]); i = next;
      }
      return smooth.slice(1);
    }
    for (const [dx, dz] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) {
      const next = { x: p.x + dx, z: p.z + dz }, id = key(next);
      if (parents.has(id) || !gridFree(next) || !clearSegment(p, next)) continue;
      parents.set(id, p); queue.push(next);
    }
  }
  return null;
}

export function createAutoTour(start) {
  const path = [];
  let previous = start;
  for (const [x, z] of TOUR) {
    const target = { x, z }, leg = findPath(previous, target);
    if (!leg) return null;
    path.push(...leg); previous = target;
  }
  return { path, index: 0, stalled: 0 };
}

export function stepAutoTour(pose, tour, dt) {
  while (tour.index < tour.path.length && distance(pose, tour.path[tour.index]) < 0.035) tour.index++;
  if (tour.index >= tour.path.length) return false;
  const target = tour.path[tour.index], dx = target.x - pose.x, dz = target.z - pose.z;
  const desired = Math.atan2(-dx, -dz);
  const turn = Math.atan2(Math.sin(desired - pose.yaw), Math.cos(desired - pose.yaw));
  pose.yaw += Math.max(-dt * 1.25, Math.min(dt * 1.25, turn));
  pose.pitch *= Math.exp(-dt * 3);
  // Face the next corridor before walking, avoiding sideways camera motion.
  if (Math.abs(turn) > 0.12) return true;
  const length = Math.hypot(dx, dz), step = Math.min(length, dt * 2.2);
  const next = movePlayer(pose, dx / length * step, dz / length * step);
  tour.stalled = distance(pose, next) < step * 0.1 ? tour.stalled + dt : 0;
  pose.x = next.x; pose.z = next.z;
  return tour.stalled < 1.5;
}
