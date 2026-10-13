/* Перекрытия секций: [x, z, ширина, глубина] */
export const SLABS = [
  [-47, -16, 22, 72],
  [17, -11, 22, 62],
  [0, 30, 116, 20],
];

export const DOOR_GAP = 1.55;   // ширина проёма под дверное полотно

/**
 * Стена вдоль коридора, разрезанная проёмами в местах дверей.
 */
function corridorWall(axis, fixed, from, to, doors) {
  const segs = [];
  let cursor = from;
  for (const d of [...doors].sort((a, b) => a - b)) {
    const gapStart = d - DOOR_GAP / 2;
    if (gapStart > cursor + 0.2) segs.push([cursor, gapStart]);
    cursor = d + DOOR_GAP / 2;
  }
  if (to > cursor + 0.2) segs.push([cursor, to]);
  return segs.map(([a, b]) => (axis === 'z'
    ? [fixed, (a + b) / 2, 0.4, b - a, false]
    : [(a + b) / 2, fixed, b - a, 0.4, false]));
}

/* Стены: [x, z, ширина, глубина, наружная?, поворот?] */
export const WALLS = [
  [-47, -51.2, 22, 1.0, true],
  [-57.2, -16, 1.0, 72, true],
  [-36.8, -16, 1.0, 72, true],
  [-53.5, -48.5, 10, 1.0, true, -Math.PI / 5],
  [17, -41.2, 22, 1.0, true],
  [6.8, -11, 1.0, 62, true],
  [27.2, -11, 1.0, 62, true],
  [0, 39.8, 116, 1.0, true],
  [-57.2, 30, 1.0, 20, true],
  [57.2, 30, 1.0, 20, true],
  [-15, 20.2, 45.6, 1.0, true],
  [42.2, 20.2, 31.5, 1.0, true],
  ...[-40, -28, -16, -4, 8].flatMap((z) => [
    [-54.5, z, 5.5, 0.4, false],
    [-39.7, z, 5.5, 0.4, false],
  ]),
  ...[-30, -18, -6, 6].flatMap((z) => [
    [9.5, z, 5.5, 0.4, false],
    [24.5, z, 5.5, 0.4, false],
  ]),
  ...[-42, -26, -10, 4, 24, 40].map((x) => [x, 35.5, 0.4, 9, false]),

  ...corridorWall('z', -51.5, -50.5, 19, [-34, -22, -10, 2, 12]),
  ...corridorWall('z', -42.5, -50.5, 19, [-34, -22, -10, 2, 12]),
  ...corridorWall('z', 12.5, -40.5, 18, [-24, -12, 0]),
  ...corridorWall('z', 21.5, -40.5, 18, [-24, -12, 0, 12]),
  ...corridorWall('x', 30.5, -56.5, 56.5, [-34, -18, -8, 14, 32, 46]),
];

/* Кабинеты 1-го этажа. По ним генерируются верхние этажи */
export const ROOMS = [
  { label: '101', sub: 'Пост', x: -53, z: -34, w: 7, d: 10, kind: 'serviceRoom', door: [-51.5, -34, 'z'] },
  { label: '102', sub: 'Гардероб', x: -53, z: -22, w: 7, d: 10, kind: 'serviceRoom', door: [-51.5, -22, 'z'] },
  { label: '110', sub: '', x: -53, z: -10, w: 7, d: 10, kind: 'classRoom', door: [-51.5, -10, 'z'] },
  { label: '107', sub: '', x: -53, z: 2, w: 7, d: 10, kind: 'classRoom', door: [-51.5, 2, 'z'] },
  { label: '108', sub: 'WC', x: -53, z: 12, w: 7, d: 8, kind: 'techRoom', door: [-51.5, 12, 'z'] },
  { label: '103', sub: '', x: -41, z: -34, w: 7, d: 10, kind: 'classRoom', door: [-42.5, -34, 'z'] },
  { label: '104', sub: '', x: -41, z: -22, w: 7, d: 10, kind: 'classRoom', door: [-42.5, -22, 'z'] },
  { label: 'Мед', sub: '', x: -41, z: -10, w: 7, d: 10, kind: 'serviceRoom', door: [-42.5, -10, 'z'] },
  { label: '105', sub: 'Деканат', x: -41, z: 2, w: 7, d: 10, kind: 'adminRoom', door: [-42.5, 2, 'z'] },
  { label: '106', sub: '', x: -41, z: 12, w: 7, d: 8, kind: 'classRoom', door: [-42.5, 12, 'z'] },
  { label: '121', sub: '', x: 11, z: -24, w: 7, d: 10, kind: 'classRoom', door: [12.5, -24, 'z'] },
  { label: '123', sub: '', x: 11, z: -12, w: 7, d: 10, kind: 'adminRoom', door: [12.5, -12, 'z'] },
  { label: '125', sub: '', x: 11, z: 0, w: 7, d: 10, kind: 'classRoom', door: [12.5, 0, 'z'] },
  { label: '120', sub: '', x: 23, z: -24, w: 7, d: 10, kind: 'classRoom', door: [21.5, -24, 'z'] },
  { label: '122', sub: '', x: 23, z: -12, w: 7, d: 10, kind: 'classRoom', door: [21.5, -12, 'z'] },
  { label: '124', sub: '', x: 23, z: 0, w: 7, d: 10, kind: 'classRoom', door: [21.5, 0, 'z'] },
  { label: '126', sub: '', x: 23, z: 12, w: 7, d: 8, kind: 'classRoom', door: [21.5, 12, 'z'] },
  { label: '130', sub: '', x: -34, z: 35, w: 14, d: 8, kind: 'classRoom', door: [-34, 30.5, 'x'] },
  { label: '131', sub: 'Библиотека', x: -18, z: 35, w: 12, d: 8, kind: 'classRoom', door: [-18, 30.5, 'x'] },
  { label: '132', sub: 'Зал', x: 14, z: 35, w: 16, d: 8, kind: 'adminRoom', door: [14, 30.5, 'x'] },
  { label: '133', sub: 'Кафедра', x: 32, z: 35, w: 12, d: 8, kind: 'adminRoom', door: [32, 30.5, 'x'] },
  { label: '134', sub: 'Столовая', x: 46, z: 35, w: 10, d: 8, kind: 'classRoom', door: [46, 30.5, 'x'] },
  { label: 'Холл', sub: '', x: -8, z: 34, w: 10, d: 9, kind: 'lobbyRoom' },
];

