import * as THREE from 'three';

/* Позиция идущего человека, общая для всей сцены.

   Через неё двери узнают, что к ним подошли, и открываются. Держим в
   обычном объекте, а не в состоянии React: значение меняется каждый кадр,
   и перерисовывать из-за него дерево компонентов не нужно. */

export const walker = {
  pos: new THREE.Vector3(0, 0, 0),
  active: false,
};

export function setWalker(x, y, z, active = true) {
  walker.pos.set(x, y, z);
  walker.active = active;
}
