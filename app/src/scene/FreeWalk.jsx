import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { movePlayer, walkContext, EYE_HEIGHT, FLOOR_HEIGHT } from '../lib/walkPhysics.js';
import { setWalker, walker } from './walkerState.js';
import { createAutoTour, stepAutoTour } from '../lib/autoWalk.js';

const MOVE_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);

export default function FreeWalk({ input, floor, resetTick, paused, onStatus, onAction, onPause }) {
  const { camera, gl } = useThree();
  const pose = useRef({ x: -8, z: 34, yaw: 0, pitch: 0 });
  const keys = useRef(new Set());
  const elapsed = useRef(0);
  const tour = useRef(null);
  const callbacks = useRef({ onStatus, onAction, onPause });
  callbacks.current = { onStatus, onAction, onPause };

  useEffect(() => {
    pose.current = { x: -8, z: 34, yaw: 0, pitch: 0 };
    input.auto = false; tour.current = null;
    elapsed.current = 1;
  }, [resetTick, input]);

  useEffect(() => {
    if (paused) { keys.current.clear(); input.forward = input.side = input.turn = 0; input.tap = null; }
  }, [paused, input]);

  useEffect(() => {
    const canvas = gl.domElement;
    let drag = null;
    const clear = () => { keys.current.clear(); drag = null; input.forward = input.side = input.turn = 0; input.tap = null; };
    const blur = () => { clear(); input.auto = false; };
    const editable = target => target?.closest?.('input, textarea, select, [contenteditable="true"]');
    const keydown = event => {
      if (editable(event.target)) return;
      if (event.code === 'Escape') { clear(); callbacks.current.onPause(); return; }
      if (paused) return;
      if (MOVE_CODES.has(event.code)) { event.preventDefault(); keys.current.add(event.code); input.auto = false; }
      if (!event.repeat && ['KeyE', 'KeyR'].includes(event.code)) {
        const p = pose.current;
        callbacks.current.onAction(event.code === 'KeyR' ? 'down' : 'interact', walkContext(p.x, p.z, floor));
      }
    };
    const keyup = event => keys.current.delete(event.code);
    const down = event => {
      if (paused || (event.pointerType === 'mouse' && event.button !== 0)) return;
      canvas.setPointerCapture(event.pointerId);
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const move = event => {
      if (!drag || drag.id !== event.pointerId || paused) return;
      input.auto = false;
      pose.current.yaw -= (event.clientX - drag.x) * 0.004;
      pose.current.pitch = Math.max(-1.1, Math.min(1.1, pose.current.pitch - (event.clientY - drag.y) * 0.003));
      drag.x = event.clientX; drag.y = event.clientY;
    };
    const up = () => { drag = null; };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', blur);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('lostpointercapture', up);
    return () => {
      clear(); walker.active = false;
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', blur);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('lostpointercapture', up);
    };
  }, [gl, input, paused, floor]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05), p = pose.current, k = keys.current;
    if (!input.auto) tour.current = null;
    if (!paused) {
      const tap = input.tap; input.tap = null;
      if (tap || input.forward || input.side || input.turn || k.size) input.auto = false;
      if (input.auto) {
        if (!tour.current) tour.current = createAutoTour(p);
        if (!tour.current || !stepAutoTour(p, tour.current, dt)) input.auto = false;
      } else {
      if (tap?.field === 'turn') p.yaw += tap.value * 0.22;
      p.yaw += ((k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0) + input.turn) * dt * 1.65;
      const fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) + input.forward;
      const side = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0) + input.side;
      const length = Math.max(1, Math.hypot(fwd, side));
      const distance = dt * (k.has('ShiftLeft') || k.has('ShiftRight') ? 4.4 : 2.6) / length;
      const forwardDistance = fwd * distance + (tap?.field === 'forward' ? tap.value * 0.65 : 0);
      const sideDistance = side * distance + (tap?.field === 'side' ? tap.value * 0.65 : 0);
      const next = movePlayer(p, -Math.sin(p.yaw) * forwardDistance + Math.cos(p.yaw) * sideDistance, -Math.cos(p.yaw) * forwardDistance - Math.sin(p.yaw) * sideDistance);
      p.x = next.x; p.z = next.z;
      }
    }
    const y = (floor - 1) * FLOOR_HEIGHT + 0.58;
    camera.position.set(p.x, y + EYE_HEIGHT, p.z);
    camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ');
    setWalker(p.x, y, p.z, true);
    elapsed.current += dt;
    if (elapsed.current > 0.12) {
      elapsed.current = 0;
      callbacks.current.onStatus({ ...p, floor, auto: !!input.auto, ...walkContext(p.x, p.z, floor) });
    }
  });
  return null;
}
