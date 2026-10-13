/* Определение мощности устройства.

   Без этого приложением нельзя пользоваться «всем»: на бюджетном телефоне
   постобработка и тень 4096 дают единицы кадров в секунду. Уровень
   определяется один раз и запоминается, но его всегда можно переключить
   вручную — автоматика ошибается, а решать пользователю. */

export const LEVELS = {
  high: {
    id: 'high',
    label: 'Высокое',
    hint: 'Затенение, отражения, тени 4K',
    post: true,
    shadows: true,
    shadowMap: 4096,
    env: true,
    dpr: [1, 1.75],
    site: true,
    furniture: true,
  },
  medium: {
    id: 'medium',
    label: 'Среднее',
    hint: 'Тени 2K, без затенения в углах',
    post: false,
    shadows: true,
    shadowMap: 2048,
    env: true,
    dpr: [1, 1.35],
    site: true,
    furniture: true,
  },
  low: {
    id: 'low',
    label: 'Лёгкое',
    hint: 'Без теней и мебели — для слабых телефонов',
    post: false,
    shadows: false,
    shadowMap: 1024,
    env: false,
    dpr: [0.75, 1],
    site: false,
    furniture: false,
  },
};

const STORE_KEY = 'unimap.quality';

/** Грубая, но дешёвая оценка: ядра, память, тип устройства и рендерер GPU */
export function detectLevel() {
  if (typeof navigator === 'undefined') return 'medium';

  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = navigator.deviceMemory ?? 4;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 700;
  const mobile = coarse && narrow;
  const saveData = navigator.connection?.saveData === true;

  if (saveData) return 'low';
  if (mem <= 2 || cores <= 2) return 'low';

  // Имя GPU выдаёт заведомо слабые интегрированные чипы
  let renderer = '';
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && ext) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '');
  } catch {
    /* расширение может быть закрыто настройками приватности — не страшно */
  }
  const weakGpu = /mali-4|mali-t|adreno \(tm\) [2-4]\d\d|powervr|swiftshader|llvmpipe/i.test(renderer);
  if (weakGpu) return 'low';

  if (mobile) return mem >= 6 && cores >= 6 ? 'medium' : 'low';
  if (mem <= 4 || cores <= 4) return 'medium';
  return 'high';
}

/** Сохранённый выбор пользователя, иначе автоопределение */
export function loadLevel() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && LEVELS[saved]) return saved;
  } catch { /* приватный режим — просто определим заново */ }
  return detectLevel();
}

export function saveLevel(id) {
  try { localStorage.setItem(STORE_KEY, id); } catch { /* не критично */ }
}
