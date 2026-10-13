import { SLABS, WALLS, ROOMS } from '../data/buildingLayout.js';

export const PLAYER_RADIUS = 0.27;
export const EYE_HEIGHT = 1.68;
export const FLOOR_HEIGHT = 4.2;
export const WALK_STAIRS = [
  { x: -47, z: -46, name: 'Лестница левого крыла' },
  { x: 17, z: -36, name: 'Лестница правого крыла' },
  { x: 50, z: 26, name: 'Лестница восточного крыла' },
];

// Точные границы помещений между наружной и коридорной стенами.
export const WALK_ROOMS = ROOMS.map(room => {
  if (!room.door || room.door[2] === 'x') return room;
  const [doorX] = room.door;
  const outerX = doorX === -51.5 ? -56.7 : doorX === -42.5 ? -37.3 : doorX === 12.5 ? 7.3 : 26.7;
  return { ...room, x: (doorX + outerX) / 2, w: Math.abs(doorX - outerX) - 0.4 };
});

export function roomNumber(room, floor) {
  if (room.label === 'Мед') return floor === 1 ? 'Медпункт' : `${floor}09`;
  return room.label.replace(/^1/, String(floor));
}

// Те же объекты используются для мебели в сцене и для столкновений.
export const WALK_FURNITURE = WALK_ROOMS.filter(r => r.door).flatMap(room => {
  const items = [];
  const alongZ = room.door[2] === 'z';
  for (const side of [-1, 1]) {
    const x = alongZ ? room.x : room.x + side * Math.min(3.2, room.w / 3);
    const z = alongZ ? room.z + side * 2.5 : room.z + 1.5;
    items.push({ x, z, w: Math.min(1.8, room.w - 1.2), d: 0.8, h: 0.76, kind: 'desk' });
    items.push({ x, z: z + 0.85, w: 0.48, d: 0.48, h: 0.85, kind: 'chair' });
  }
  return items;
}).concat([
  { x: -25.35, z: 35.5, w: 0.8, d: 5, h: 2.25, kind: 'bookcase' },
  { x: -23, z: 21.8, w: 3.6, d: 0.65, h: 0.85, kind: 'bench' },
]);

export function circleHitsBox(x, z, box, radius = PLAYER_RADIUS) {
  const [cx, cz, width, depth, , angle = 0] = box;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const dx = x - cx, dz = z - cz;
  const lx = cos * dx - sin * dz;
  const lz = sin * dx + cos * dz;
  const nx = Math.max(-width / 2, Math.min(width / 2, lx));
  const nz = Math.max(-depth / 2, Math.min(depth / 2, lz));
  return (lx - nx) ** 2 + (lz - nz) ** 2 < radius ** 2;
}

const OBSTACLES = [
  ...WALLS,
  ...WALK_FURNITURE.map(o => [o.x, o.z, o.w, o.d]),
  // Лестничные марши: переход активируется с площадки, через них не проходим.
  [-53, -46, 4.6, 5.6], [11, -36, 4.6, 5.6], [54.5, 24, 3.8, 5.0],
];

export function canStand(x, z) {
  // Проверяем окружность по периметру, чтобы не свалиться за край плиты.
  for (const [dx, dz] of [[0, 0], [PLAYER_RADIUS, 0], [-PLAYER_RADIUS, 0], [0, PLAYER_RADIUS], [0, -PLAYER_RADIUS]]) {
    if (!SLABS.some(([cx, cz, w, d]) => Math.abs(x + dx - cx) <= w / 2 && Math.abs(z + dz - cz) <= d / 2)) return false;
  }
  return !OBSTACLES.some(box => circleHitsBox(x, z, box));
}

export function movePlayer(position, dx, dz) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.1));
  let { x, z } = position;
  for (let i = 0; i < steps; i++) {
    const nextX = x + dx / steps;
    if (canStand(nextX, z)) x = nextX;
    const nextZ = z + dz / steps;
    if (canStand(x, nextZ)) z = nextZ;
  }
  return { x, z };
}

export function walkContext(x, z, floor) {
  const stairs = WALK_STAIRS.find(s => Math.hypot(x - s.x, z - s.z) < 3.2);
  const room = WALK_ROOMS.find(r => r.door && Math.abs(x - r.x) < r.w / 2 && Math.abs(z - r.z) < r.d / 2);
  const door = WALK_ROOMS.find(r => r.door && Math.hypot(x - r.door[0], z - r.door[1]) < 2.2);
  const label = room ? `Кабинет ${roomNumber(room, floor)}` : z > 30 ? 'Входной холл' : z > 19 ? 'Главный коридор' : x < 0 ? 'Левое крыло' : 'Правое крыло';
  return { stairs, room: room || door, label, exit: floor === 1 && Math.hypot(x + 8, z - 37.5) < 2.4 };
}
