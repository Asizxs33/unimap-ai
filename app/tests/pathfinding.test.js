import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NODES, EDGES, ALIASES } from '../src/data/campus.js';
import { PLACES, PLACE_BY_ID, searchPlaces } from '../src/data/catalog.js';
import {
  findPath, pathHasStairs, pathLength, walkMinutes, resolveQuery, buildSteps, arrivalTime,
} from '../src/lib/pathfinding.js';

test('рёбра ссылаются только на существующие узлы', () => {
  for (const [a, b] of EDGES) {
    assert.ok(NODES[a], `нет узла ${a}`);
    assert.ok(NODES[b], `нет узла ${b}`);
  }
});

test('у каждого места из справочника есть узел графа', () => {
  for (const p of PLACES) assert.ok(NODES[p.id], `нет узла для ${p.id}`);
});

test('от главного входа достижимо каждое место из справочника', () => {
  for (const p of PLACES) {
    const path = findPath('entrance', p.id);
    assert.ok(path, `нет маршрута до ${p.id}`);
    assert.equal(path[0], 'entrance');
    assert.equal(path.at(-1), p.id);
  }
});

test('алиасы ведут на существующие узлы', () => {
  for (const [k, id] of Object.entries(ALIASES)) assert.ok(NODES[id], `${k} → ${id}`);
});

test('маршрут до самого себя — один узел', () => {
  assert.deepEqual(findPath('entrance', 'entrance'), ['entrance']);
});

test('неизвестные узлы дают null', () => {
  assert.equal(findPath('entrance', 'nope'), null);
  assert.equal(findPath('nope', 'entrance'), null);
});

test('короткие имена лестниц (stairsL) работают как stairsL_1', () => {
  assert.ok(PLACE_BY_ID.stairsL);
  const path = findPath('entrance', 'stairsL');
  assert.ok(path, 'маршрут до stairsL должен строиться');
  assert.equal(path.at(-1), 'stairsL_1');
});

test('на верхний этаж маршрут идёт по лестнице', () => {
  const path = findPath('entrance', 'r405');
  assert.ok(path);
  assert.ok(pathHasStairs(path));
  assert.equal(NODES[path.at(-1)].floor, 4);
});

test('avoidStairs не мешает построить маршрут, если обхода нет', () => {
  assert.ok(findPath('entrance', 'r405', { avoidStairs: true }));
});

test('маршрут на одном этаже обходится без лестниц', () => {
  const path = findPath('entrance', 'r105', { avoidStairs: true });
  assert.ok(path);
  assert.equal(pathHasStairs(path), false);
});

test('длина и время в пути', () => {
  assert.equal(pathLength(['entrance']), 0);
  assert.equal(pathLength(null), 0);
  const path = findPath('entrance', 'r105');
  assert.ok(pathLength(path) > 0);
  assert.ok(walkMinutes(path) >= 1);
});

test('arrivalTime форматирует ЧЧ:ММ', () => {
  assert.equal(arrivalTime(5, new Date(2026, 0, 1, 9, 58)), '10:03');
});

test('resolveQuery понимает номер, синоним и часть названия', () => {
  assert.equal(resolveQuery('105'), 'r105');
  assert.equal(resolveQuery('Медпункт'), 'med');
  assert.equal(resolveQuery(''), null);
  assert.equal(resolveQuery('qqqqqq'), null);
});

test('buildSteps начинается стартом и заканчивается финишем', () => {
  const path = findPath('entrance', 'r105');
  const steps = buildSteps(path);
  assert.equal(steps.length, path.length);
  assert.equal(steps[0].dir, 'flag');
  assert.equal(steps.at(-1).dir, 'place');
  assert.deepEqual(buildSteps([]), []);
});

test('searchPlaces: точный номер первым', () => {
  assert.equal(searchPlaces('105')[0].id, 'r105');
  assert.deepEqual(searchPlaces('   '), []);
});
