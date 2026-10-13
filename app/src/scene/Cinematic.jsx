import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Медленный облёт корпуса при первом открытии.
 *
 * Прерывается на первом же действии пользователя — колесо, перетаскивание,
 * касание, клавиша. Ролик, который нельзя пропустить, раздражает больше,
 * чем радует, поэтому выход из него мгновенный.
 */
export default function Cinematic({ active, center = [0, 9, -6], radius = 208, onEnd }) {
  const { camera, gl } = useThree();
  const angle = useRef(Math.PI * 0.28);
  const running = useRef(active);
  const target = useRef(new THREE.Vector3(...center));

  useEffect(() => { running.current = active; }, [active]);

  useEffect(() => {
    if (!active) return undefined;
    const stop = () => {
      if (!running.current) return;
      running.current = false;
      onEnd?.();
    };
    const el = gl.domElement;
    const events = ['pointerdown', 'wheel', 'touchstart', 'keydown'];
    events.forEach((e) => el.addEventListener(e, stop, { passive: true }));
    window.addEventListener('keydown', stop);
    return () => {
      events.forEach((e) => el.removeEventListener(e, stop));
      window.removeEventListener('keydown', stop);
    };
  }, [active, gl, onEnd]);

  useFrame((_, delta) => {
    if (!running.current) return;
    const dt = Math.min(0.08, delta);
    angle.current += dt * 0.085;

    const elev = 0.46 + Math.sin(angle.current * 0.6) * 0.08;
    camera.position.set(
      target.current.x + Math.sin(angle.current) * radius * Math.cos(elev),
      target.current.y + Math.sin(elev) * radius,
      target.current.z + Math.cos(angle.current) * radius * Math.cos(elev),
    );
    camera.lookAt(target.current);
  });

  return null;
}
