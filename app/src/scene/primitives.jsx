import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Коробка, заданная как в исходной сцене: центр по X/Z, основание по Y.
 * Так координаты из эвакуационной схемы переносятся один в один.
 */
export function Box({
  x, z, w, d, h, y = 0,
  color, shadow = true, material, children, ...rest
}) {
  return (
    <mesh
      position={[x, y + h / 2, z]}
      castShadow={shadow}
      receiveShadow={shadow}
      {...rest}
    >
      <boxGeometry args={[w, h, d]} />
      {children ?? <meshStandardMaterial color={color} roughness={0.85} {...material} />}
    </mesh>
  );
}

/** Плоская подпись на полу (текстура из canvas) */
export function TextPlane({ texture, x, y, z, w, h, ...rest }) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent {...rest} />
    </mesh>
  );
}

/** Текстура-этикетка кабинета: крупный номер и подпись под ним */
export function useLabelTexture(text, sub = '', bg = '#ffffffcc', fg = '#1a2c42') {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${sub ? 100 : 112}px Inter, sans-serif`;
    ctx.fillText(text || '', 128, sub ? 105 : 128);
    if (sub) {
      ctx.font = '700 34px Inter, sans-serif';
      ctx.fillStyle = '#5a6470';
      ctx.fillText(sub, 128, 196);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }, [text, sub, bg, fg]);
}

/** Кэш текстур для набора подписей — один хук на весь список кабинетов */
export function useLabelTextures(items) {
  return useMemo(() => {
    const make = (text, sub, bg, fg) => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${sub ? 100 : 112}px Inter, sans-serif`;
      ctx.fillText(text || '', 128, sub ? 105 : 128);
      if (sub) {
        ctx.font = '700 34px Inter, sans-serif';
        ctx.fillStyle = '#5a6470';
        ctx.fillText(sub, 128, 196);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 4;
      return tex;
    };
    return items.map((it) => make(it.label, it.sub ?? '', '#ffffffcc', '#1a2c42'));
  }, [items]);
}
