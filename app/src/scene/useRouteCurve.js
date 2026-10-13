import { useMemo } from 'react';
import * as THREE from 'three';
import { NODES } from '../data/campus.js';

/** Сглаженная кривая маршрута по узлам графа.
    Хук лежит отдельно от компонентов: рядом с ними он ломал
    Fast Refresh и заставлял Vite перезагружать страницу целиком. */
export function useRouteCurve(path) {
  return useMemo(() => {
    if (!path || path.length < 2) return null;
    const pts = path.map((id) => new THREE.Vector3(NODES[id].x, (NODES[id].y ?? 0) + 0.55, NODES[id].z));
    return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  }, [path]);
}
