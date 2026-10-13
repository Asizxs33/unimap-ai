import * as THREE from 'three';

/* Процедурные текстуры на canvas. Ровная заливка — главная причина
   «пластикового» вида: без мелкой неоднородности материал не читается.
   Всё генерируется один раз и кэшируется. */

const cache = new Map();
const once = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

function canvas(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function finish(c, repeat = 1) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Мелкий шум — кладём поверх цвета, чтобы поверхность не была идеально ровной */
function grain(ctx, size, amount, alpha) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
    if (alpha != null) d[i + 3] = alpha;
  }
  ctx.putImageData(img, 0, 0);
}

/** Штукатурка фасада: тон + зерно + слабые вертикальные потёки */
export function plasterMap(base = '#d9c08a') {
  return once(`plaster-${base}`, () => {
    const S = 512;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    // слабые вертикальные полосы — следы опалубки
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = 0.03 + Math.random() * 0.04;
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      const x = Math.random() * S;
      ctx.fillRect(x, 0, 1 + Math.random() * 3, S);
    }
    ctx.globalAlpha = 1;
    grain(ctx, S, 16);
    return finish(c, 3);
  });
}

/** Пол коридора: керамогранит крупной плиткой со швами */
export function tileMap(base = '#cfd3d8', grout = '#a9aeb6', cells = 4) {
  return once(`tile-${base}-${cells}`, () => {
    const S = 512;
    const step = S / cells;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, S, S);
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        // каждая плитка чуть отличается по светлоте — как настоящая партия
        const v = 1 + (Math.random() - 0.5) * 0.06;
        ctx.fillStyle = shade(base, v);
        ctx.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
      }
    }
    grain(ctx, S, 10);
    return finish(c, 6);
  });
}

/** Кровельная мембрана: тёмная, с редкими стыками полотен */
export function roofMap(base = '#8d8878') {
  return once(`roof-${base}`, () => {
    const S = 256;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(0,0,0,.16)';
    ctx.lineWidth = 2;
    for (let y = 0; y < S; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
    }
    grain(ctx, S, 14);
    return finish(c, 8);
  });
}

/** Асфальт парковки */
export function asphaltMap(base = '#7e838a') {
  return once(`asphalt-${base}`, () => {
    const S = 256;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    grain(ctx, S, 34);
    return finish(c, 10);
  });
}

/** Газон: пятнистая зелень, чтобы не было ровного «сукна» */
export function lawnMap(base = '#728a5c', dry = '#8a9668') {
  return once('lawn', () => {
    const S = 256;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 260; i++) {
      ctx.globalAlpha = 0.05 + Math.random() * 0.13;
      ctx.fillStyle = Math.random() > 0.5 ? dry : '#4f6642';
      const r = 6 + Math.random() * 26;
      ctx.beginPath();
      ctx.arc(Math.random() * S, Math.random() * S, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    grain(ctx, S, 20);
    return finish(c, 12);
  });
}

/** Пешеходная плитка */
export function pavingMap(base = '#c8c6bf') {
  return once('paving', () => {
    const S = 256;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = '#b0aea6';
    ctx.fillRect(0, 0, S, S);
    const step = S / 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const off = y % 2 ? step / 2 : 0;
        ctx.fillStyle = shade(base, 1 + (Math.random() - 0.5) * 0.08);
        ctx.fillRect(x * step + off + 1, y * step + 1, step - 2, step - 2);
      }
    }
    grain(ctx, S, 12);
    return finish(c, 14);
  });
}

/** Табличка на полу помещения: номер + назначение */
export function labelMap(text, sub = '') {
  return once(`label-${text}-${sub}`, () => {
    const [c, ctx] = canvas(256);
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    roundRect(ctx, 18, 62, 220, 132, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,30,48,.22)';
    ctx.lineWidth = 3;
    roundRect(ctx, 18, 62, 220, 132, 10);
    ctx.stroke();

    ctx.fillStyle = '#1b2536';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${sub ? 74 : 86}px "JetBrains Mono", monospace`;
    ctx.fillText(text || '', 128, sub ? 112 : 128);
    if (sub) {
      ctx.font = '600 27px Inter, sans-serif';
      ctx.fillStyle = '#5b667a';
      ctx.fillText(sub, 128, 166);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

/** Знак ШЫҒУ над эвакуационным выходом */
export function exitSignMap() {
  return once('exit-sign', () => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1c6b45';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 244, 116);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 52px Inter, sans-serif';
    ctx.fillText('ШЫҒУ', 128, 48);
    ctx.font = '600 30px Inter, sans-serif';
    ctx.fillText('ВЫХОД', 128, 94);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

/** Вывеска университета на фасаде */
export function facadeSignMap() {
  return once('facade-sign', () => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 88;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#c2952f';
    ctx.fillRect(0, 0, 1024, 88);
    ctx.fillStyle = 'rgba(0,0,0,.14)';
    ctx.fillRect(0, 74, 1024, 14);
    ctx.fillStyle = '#2e2205';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 37px Inter, sans-serif';
    ctx.fillText('ӘБУ ЖӘНІБЕКОВ АТЫНДАҒЫ ПЕДАГОГИКАЛЫҚ УНИВЕРСИТЕТІ', 512, 42);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

/** LED-экран над входом */
export function ledMap() {
  return once('led', () => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 288;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 512, 288);
    grd.addColorStop(0, '#0b2447');
    grd.addColorStop(0.55, '#1d5390');
    grd.addColorStop(1, '#081b38');
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 288);
    g.fillStyle = 'rgba(255,255,255,.10)';
    for (let i = 0; i < 7; i++) g.fillRect(40 + i * 66, 158, 42, 92);
    g.fillStyle = '#f2f6fc';
    g.textAlign = 'center';
    g.font = '700 58px Inter, sans-serif';
    g.fillText('UniMap AI', 256, 88);
    g.font = '600 24px Inter, sans-serif';
    g.fillStyle = '#a9c4e6';
    g.fillText('ЦИФРЛЫҚ КАМПУС', 256, 128);
    // сетка пикселей — экран, а не картинка
    g.fillStyle = 'rgba(0,0,0,.18)';
    for (let y = 0; y < 288; y += 3) g.fillRect(0, y, 512, 1);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

/* ── вспомогательное ── */

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * k)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * k)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * k)));
  return `rgb(${r},${g},${b})`;
}

export function wayfindingMap(title, subtitle) {
  return once(`wayfinding-${title}-${subtitle}`, () => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#245451'; ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#edf2df'; ctx.textAlign = 'center';
    ctx.font = '600 65px Arial, sans-serif'; ctx.fillText(title, 512, 117, 960);
    ctx.fillStyle = '#b9d0bd'; ctx.font = '500 27px Arial, sans-serif'; ctx.fillText(subtitle, 512, 193, 960);
    return finish(c);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
