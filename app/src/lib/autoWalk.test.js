import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutoTour, stepAutoTour } from './autoWalk.js';
import { canStand, WALK_ROOMS } from './walkPhysics.js';

test('automatic tour visits both wings and returns to the lobby without collisions', () => {
  const pose = { x: -8, z: 34, yaw: 0, pitch: 0.4 };
  const tour = createAutoTour(pose);
  assert.ok(tour);
  let left = false, right = false, east = false, running = true;
  for (let frame = 0; frame < 20000 && running; frame++) {
    const previous = { ...pose };
    running = stepAutoTour(pose, tour, 1 / 30);
    assert.ok(canStand(pose.x, pose.z));
    assert.ok(Math.hypot(pose.x - previous.x, pose.z - previous.z) <= 2.2 / 30 + 1e-6);
    left ||= pose.x < -46 && pose.z < -43;
    right ||= pose.x > 16 && pose.z < -33;
    east ||= pose.x > 47;
  }
  assert.equal(running, false);
  assert.equal(tour.index, tour.path.length);
  assert.ok(left && right && east);
  assert.ok(Math.hypot(pose.x + 8, pose.z - 34) < 0.04);
});

test('automatic tour can connect from inside a room through its doorway', () => {
  const room = WALK_ROOMS.find(r => r.label === '131');
  const start = { x: room.door[0], z: room.door[1] + 1.1, yaw: Math.PI, pitch: 0 };
  assert.ok(canStand(start.x, start.z));
  const tour = createAutoTour(start);
  assert.ok(tour);
  for (let i = 0; i < 1500 && Math.hypot(start.x + 8, start.z - 26) > 0.1; i++) {
    assert.ok(stepAutoTour(start, tour, 1 / 30));
    assert.ok(canStand(start.x, start.z));
  }
  assert.ok(Math.hypot(start.x + 8, start.z - 26) < 0.1);
});
