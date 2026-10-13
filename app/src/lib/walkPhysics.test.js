import test from 'node:test';
import assert from 'node:assert/strict';
import { canStand, movePlayer, circleHitsBox, walkContext, WALK_ROOMS, WALK_STAIRS, WALK_FURNITURE } from './walkPhysics.js';

test('player can leave the entrance through the lobby doorway', () => {
  assert.ok(canStand(-8, 34));
  const p = movePlayer({ x: -8, z: 34 }, 0, -8);
  assert.ok(Math.abs(p.z - 26) < 0.01);
});

test('movement cannot tunnel through a wall or leave the building', () => {
  const p = movePlayer({ x: 0, z: 26 }, 0, 100);
  assert.ok(p.z < 30.1);
  assert.equal(canStand(0, -20), false);
  assert.equal(canStand(100, 100), false);
});

test('furniture blocks movement and diagonal walls use their rotation', () => {
  const desk = WALK_FURNITURE[0];
  assert.equal(canStand(desk.x, desk.z), false);
  assert.equal(circleHitsBox(2, -2, [0, 0, 8, 0.4, true, Math.PI / 4]), true);
  assert.equal(circleHitsBox(2, 2, [0, 0, 8, 0.4, true, Math.PI / 4]), false);
});

test('every classroom doorway and stair landing is reachable from the entrance', () => {
  // Flood fill actual collision geometry, including furniture; not just the navigation graph.
  const step = 0.5, queue = [[-8, 34]], visited = new Set(['-8,34']);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const nx = x + dx, nz = z + dz, key = `${nx},${nz}`;
      if (!visited.has(key) && canStand(nx, nz)) { visited.add(key); queue.push([nx, nz]); }
    }
  }
  for (const room of WALK_ROOMS.filter(r => r.door)) {
    assert.ok(visited.has(`${room.door[0]},${room.door[1]}`), `Door ${room.label} is unreachable`);
    const inside = room.door[2] === 'z'
      ? [room.door[0] + Math.sign(room.x - room.door[0]), room.door[1]]
      : [room.door[0], room.door[1] + 1];
    assert.ok(visited.has(inside.join(',')), `Room ${room.label} cannot be entered`);
  }
  for (const stair of WALK_STAIRS) assert.ok(visited.has(`${stair.x},${stair.z}`), stair.name);
});

test('stair and exit actions only appear nearby and exit is on ground floor', () => {
  assert.ok(walkContext(-47, -46, 2).stairs);
  assert.equal(walkContext(-8, 34, 1).stairs, undefined);
  assert.equal(walkContext(-8, 37.5, 1).exit, true);
  assert.equal(walkContext(-8, 37.5, 2).exit, false);
});
