import * as THREE from 'three';

const sources = new Map();
const repeats = new Map();
const SIZE = 512;

function randomSource() {
  let seed = 91837;
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

function makeSurface(kind) {
  if (sources.has(kind)) return sources.get(kind);
  const random = randomSource();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const height = document.createElement('canvas');
  height.width = height.height = SIZE;
  const h = height.getContext('2d');
  const rough = document.createElement('canvas');
  rough.width = rough.height = SIZE;
  const r = rough.getContext('2d');
  ctx.fillStyle = kind === 'oak' ? '#af8f63' : kind === 'stone' ? '#c8c4b7' : '#e9e6df';
  ctx.fillRect(0, 0, SIZE, SIZE);
  h.fillStyle = '#909090'; h.fillRect(0, 0, SIZE, SIZE);
  r.fillStyle = kind === 'stone' ? '#979797' : kind === 'oak' ? '#b7b7b7' : '#e8e8e8';
  r.fillRect(0, 0, SIZE, SIZE);
  if (kind === 'stone') {
    // Мелкая каменная крошка; швы каждые 60 см, а не растянутые на весь корпус.
    for (let i = 0; i < 15000; i++) {
      const x = random() * SIZE, y = random() * SIZE, radius = 0.25 + random() * 1.4;
      ctx.fillStyle = ['#a5a198', '#b3b0a5', '#ddd9ce', '#eeeae0'][i % 4];
      ctx.globalAlpha = 0.2 + random() * 0.45;
      ctx.beginPath(); ctx.ellipse(x, y, radius * 1.4, radius, random() * Math.PI, 0, Math.PI * 2); ctx.fill();
      h.fillStyle = i % 2 ? '#959595' : '#8b8b8b'; h.fillRect(x, y, radius, radius);
      r.fillStyle = i % 2 ? '#919191' : '#a3a3a3'; r.fillRect(x, y, radius * 2, radius * 2);
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'oak') {
    for (let i = 0; i < 750; i++) {
      const y = random() * SIZE;
      ctx.strokeStyle = i % 3 ? 'rgba(74,47,20,.09)' : 'rgba(246,223,174,.16)';
      ctx.lineWidth = 0.25 + random(); ctx.beginPath();
      for (let x = 0; x <= SIZE; x += 8) {
        const wave = y + Math.sin(x / SIZE * Math.PI * 2 + y * 0.1) * (2 + Math.sin(y * 0.03) * 1.5);
        if (!x) ctx.moveTo(x, wave); else ctx.lineTo(x, wave);
      }
      ctx.stroke();
    }
  } else {
    const image = ctx.getImageData(0, 0, SIZE, SIZE);
    const relief = h.getImageData(0, 0, SIZE, SIZE);
    for (let i = 0; i < image.data.length; i += 4) {
      const n = (random() - 0.5) * 7;
      for (let c = 0; c < 3; c++) { image.data[i + c] += n; relief.data[i + c] += n * 2; }
    }
    ctx.putImageData(image, 0, 0); h.putImageData(relief, 0, 0);
  }
  if (kind === 'stone' || kind === 'ceiling') {
    const gap = kind === 'stone' ? 3.0 : 2;
    for (const context of [ctx, h, r]) {
      context.fillStyle = context === h ? '#282828' : context === r ? '#ebebeb' : kind === 'stone' ? '#858278' : '#bdbfb9';
      context.fillRect(0, 0, SIZE, gap); context.fillRect(0, 0, gap, SIZE);
    }
  }
  const texture = (c, color = false) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const value = { map: texture(canvas, true), bumpMap: texture(height), roughnessMap: texture(rough) };
  sources.set(kind, value);
  return value;
}

/** Все размеры в метрах; одинаковый материал сохраняет масштаб на разных поверхностях. */
export function surface(kind, width = 1, depth = 1) {
  const unit = kind === 'stone' || kind === 'ceiling' ? 0.6 : kind === 'oak' ? 2 : 1;
  const key = `${kind}:${width}:${depth}`;
  if (!repeats.has(key)) {
    const maps = Object.fromEntries(Object.entries(makeSurface(kind)).map(([name, original]) => {
      const t = original.clone(); t.repeat.set(width / unit, depth / unit); return [name, t];
    }));
    repeats.set(key, { ...maps, roughness: 1, bumpScale: kind === 'stone' ? 0.012 : kind === 'oak' ? 0.003 : 0.008 });
  }
  return repeats.get(key);
}
