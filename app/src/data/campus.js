/* Граф кампуса — узлы, рёбра и синонимы поиска.
   Программно расширен на 4 этажа для мультиэтажной навигации. */

const BASE_NODES = {
  // Главные входы/выходы (только на 1 этаже)
  'entrance':  { x: -8,  z: 34,  label: 'Главный вход', floor: 1 },
  'exitL':     { x: -47, z: -55, label: 'Выход (север-лево)', floor: 1 },
  'exitR':     { x: 17,  z: -45, label: 'Выход (север-право)', floor: 1 },
  'exitBS':    { x: -8,  z: 41,  label: 'Выход (юг)', floor: 1 },
  'exitBSR':   { x: 57,  z: 26,  label: 'Выход (восток)', floor: 1 },

  // Лестницы
  'stairsL':   { x: -53, z: -46, label: 'Лестница (лево)', floor: 1 },
  'stairsR':   { x: 11,  z: -36, label: 'Лестница (право)', floor: 1 },
  'stairsE':   { x: 50,  z: 31,  label: 'Лестница (восток)', floor: 1 },

  // Коридор левого крыла (вертикальный, x≈-47)
  'corrL_1':   { x: -47, z: -46, label: 'Коридор лево N', floor: 1 },
  'corrL_2':   { x: -47, z: -34, label: 'Коридор лево N2', floor: 1 },
  'corrL_3':   { x: -47, z: -22, label: 'Коридор лево центр', floor: 1 },
  'corrL_4':   { x: -47, z: -10, label: 'Коридор лево S1', floor: 1 },
  'corrL_5':   { x: -47, z:   2, label: 'Коридор лево S2', floor: 1 },
  'corrL_6':   { x: -47, z:  14, label: 'Коридор лево юг', floor: 1 },

  // Коридор правого крыла (вертикальный, x≈17)
  'corrR_1':   { x: 17,  z: -36, label: 'Коридор право N', floor: 1 },
  'corrR_2':   { x: 17,  z: -24, label: 'Коридор право N2', floor: 1 },
  'corrR_3':   { x: 17,  z: -12, label: 'Коридор право центр', floor: 1 },
  'corrR_4':   { x: 17,  z:   0, label: 'Коридор право S', floor: 1 },
  'corrR_5':   { x: 17,  z:  12, label: 'Коридор право юг', floor: 1 },

  // Нижний блок (горизонтальный коридор, z≈26)
  'corrB_1':   { x: -47, z: 26,  label: 'Нижний коридор запад', floor: 1 },
  'corrB_2':   { x: -28, z: 26,  label: 'Нижний коридор лево', floor: 1 },
  'corrB_3':   { x: -8,  z: 26,  label: 'Нижний коридор центр', floor: 1 },
  'corrB_4':   { x: 17,  z: 26,  label: 'Нижний коридор право', floor: 1 },
  'corrB_5':   { x: 38,  z: 26,  label: 'Нижний коридор восток', floor: 1 },
  'corrB_6':   { x: 52,  z: 26,  label: 'Нижний коридор край', floor: 1 },

  // Комнаты левого крыла — западная сторона
  'r101':      { x: -53, z: -34, label: 'Каб. 101 (Пост)', floor: 1 },
  'r102':      { x: -53, z: -22, label: 'Каб. 102 (Гардероб)', floor: 1 },
  'r110':      { x: -53, z: -10, label: 'Ауд. 110', floor: 1 },
  'r107':      { x: -53, z:   2, label: 'Ауд. 107', floor: 1 },
  'r108':      { x: -53, z:  12, label: 'WC', floor: 1 },
  // Комнаты левого крыла — восточная сторона
  'r103':      { x: -41, z: -34, label: 'Ауд. 103', floor: 1 },
  'r104':      { x: -41, z: -22, label: 'Ауд. 104', floor: 1 },
  'med':       { x: -41, z: -10, label: 'Медпункт', floor: 1 },
  'r105':      { x: -41, z:   2, label: 'Деканат 105', floor: 1 },
  'r106':      { x: -41, z:  12, label: 'Ауд. 106', floor: 1 },

  // Комнаты правого крыла
  'r121':      { x: 11,  z: -24, label: 'Ауд. 121', floor: 1 },
  'r123':      { x: 11,  z: -12, label: 'Ауд. 123', floor: 1 },
  'r125':      { x: 11,  z:   0, label: 'Ауд. 125', floor: 1 },
  'r120':      { x: 23,  z: -24, label: 'Ауд. 120', floor: 1 },
  'r122':      { x: 23,  z: -12, label: 'Ауд. 122', floor: 1 },
  'r124':      { x: 23,  z:   0, label: 'Ауд. 124', floor: 1 },
  'r126':      { x: 23,  z:  12, label: 'Ауд. 126', floor: 1 },

  // Нижний блок — комнаты (южная сторона)
  'r130':      { x: -34, z: 35,  label: 'Ауд. 130', floor: 1 },
  'r131':      { x: -18, z: 35,  label: 'Ауд. 131', floor: 1 },
  'r132':      { x: 14,  z: 35,  label: 'Конференц-зал', floor: 1 },
  'r133':      { x: 32,  z: 35,  label: 'Кафедра', floor: 1 },
  'r134':      { x: 46,  z: 35,  label: 'Ауд. 134', floor: 1 },
};

const BASE_EDGES = [
  // Главный вход (юг, центр нижнего блока)
  ['entrance', 'corrB_3'], ['entrance', 'exitBS'],

  // Нижний коридор (горизонталь)
  ['corrB_1', 'corrB_2'], ['corrB_2', 'corrB_3'],
  ['corrB_3', 'corrB_4'], ['corrB_4', 'corrB_5'],
  ['corrB_5', 'corrB_6'],
  ['corrB_6', 'exitBSR'], ['corrB_6', 'stairsE'],

  // Левое крыло коридор (вертикаль) + стыковка с нижним блоком
  ['corrL_1', 'corrL_2'], ['corrL_2', 'corrL_3'],
  ['corrL_3', 'corrL_4'], ['corrL_4', 'corrL_5'],
  ['corrL_5', 'corrL_6'], ['corrL_6', 'corrB_1'],
  ['corrL_1', 'stairsL'], ['corrL_1', 'exitL'],

  // Правое крыло коридор + стыковка
  ['corrR_1', 'corrR_2'], ['corrR_2', 'corrR_3'],
  ['corrR_3', 'corrR_4'], ['corrR_4', 'corrR_5'],
  ['corrR_5', 'corrB_4'],
  ['corrR_1', 'stairsR'], ['corrR_1', 'exitR'],

  // Двери комнат — левое крыло
  ['corrL_2', 'r101'], ['corrL_2', 'r103'],
  ['corrL_3', 'r102'], ['corrL_3', 'r104'],
  ['corrL_4', 'r110'], ['corrL_4', 'med'],
  ['corrL_5', 'r107'], ['corrL_5', 'r105'],
  ['corrL_6', 'r108'], ['corrL_6', 'r106'],

  // Двери комнат — правое крыло
  ['corrR_2', 'r121'], ['corrR_2', 'r120'],
  ['corrR_3', 'r123'], ['corrR_3', 'r122'],
  ['corrR_4', 'r125'], ['corrR_4', 'r124'],
  ['corrR_5', 'r126'],

  // Двери — нижний блок
  ['corrB_2', 'r130'], ['corrB_3', 'r131'],
  ['corrB_4', 'r132'], ['corrB_5', 'r133'],
  ['corrB_5', 'r134'],
];

const FLOOR_H = 4.2;

// Функция для сопоставления ID на конкретный этаж f
function mapNodeId(id, f) {
  if (id === 'entrance' || id.startsWith('exit')) {
    return f === 1 ? id : null;
  }
  if (id === 'med') {
    return f === 1 ? 'med' : `r${f}09`;
  }
  if (id.startsWith('r1')) {
    return id.replace(/^r1/, 'r' + f);
  }
  if (id.startsWith('stairs')) {
    return `${id}_${f}`;
  }
  if (id.startsWith('corr')) {
    return f === 1 ? id : `${id}_${f}`;
  }
  return null;
}

// Генерация полного набора узлов и рёбер
export const NODES = {};
export const EDGES = [];
export const ALIASES = {
  'главный вход': 'entrance',
  'вход': 'entrance',
  'entrance': 'entrance',
  'медпункт': 'med',
  'мед': 'med',
  'медицина': 'med',
  'аптека': 'med',
  'выход': 'exitBS',
  'выход юг': 'exitBS',
  'выход север': 'exitR',
  'выход лево': 'exitL',
  'выход восток': 'exitBSR',
};

// Заполняем узлы
for (let f = 1; f <= 4; f++) {
  const y = (f - 1) * FLOOR_H;
  for (const [id, n] of Object.entries(BASE_NODES)) {
    const newId = mapNodeId(id, f);
    if (!newId || NODES[newId]) continue;

    // Формируем красивое название
    let label = n.label;
    if (f > 1) {
      if (id === 'med') {
        label = `Лаборатория ${f}09`;
      } else if (id.startsWith('r1')) {
        const num = id.slice(2);
        if (id === 'r105') label = `Деканат ${f}05`;
        else if (id === 'r123') label = `Офис кафедры ${f}23`;
        else if (id === 'r131') label = `Библиотека ур. ${f}`;
        else if (id === 'r132') label = `Зал заседаний ${f}32`;
        else if (id === 'r133') label = `Кафедра ${f}33`;
        else if (id === 'r134') label = `Буфет ${f}34`;
        else label = `Ауд. ${f}${num}`;
      } else if (id.startsWith('stairs')) {
        const side = id === 'stairsL' ? 'лево' : id === 'stairsR' ? 'право' : 'восток';
        label = `Лестница (${side}) ${f} эт.`;
      } else {
        label = `${n.label} (${f} этаж)`;
      }
    } else {
      // Для первого этажа приводим лестницы к формату stairsX_1 внутри
      if (id.startsWith('stairs')) {
        label = `${n.label} 1 эт.`;
      }
    }

    NODES[newId] = {
      x: n.x,
      y: y,
      z: n.z,
      label: label,
      floor: f,
    };
  }
}

// Алиасы для лестниц 1-го этажа, чтобы не ломать старый код
NODES['stairsL'] = NODES['stairsL_1'];
NODES['stairsR'] = NODES['stairsR_1'];
NODES['stairsE'] = NODES['stairsE_1'];

// Заполняем рёбра по этажам
for (let f = 1; f <= 4; f++) {
  for (const [u, v] of BASE_EDGES) {
    const newU = mapNodeId(u, f);
    const newV = mapNodeId(v, f);
    if (newU && newV && NODES[newU] && NODES[newV]) {
      EDGES.push([newU, newV]);
    }
  }
}

// Связи лестниц между этажами: не прямая вертикаль, а два излома
// («туда-обратно»), синхронизированные с зигзагом лестницы в
// FloorPlan.jsx (три встречных пролёта). Раньше это было одно ребро
// с нулевым смещением по X/Z — человек и камера поднимались строго
// вертикально, как в лифте, и лестница на пути не читалась вообще.
const STAIR_BASES = ['stairsL', 'stairsR', 'stairsE'];
for (let f = 1; f <= 3; f++) {
  const floorY = (f - 1) * FLOOR_H;
  for (const base of STAIR_BASES) {
    const bottom = `${base}_${f}`;
    const top = `${base}_${f + 1}`;
    if (!NODES[bottom] || !NODES[top]) continue;

    const turn1 = `${base}_${f}_turn1`;
    const turn2 = `${base}_${f}_turn2`;
    // Первый пролёт: +1.9 по X от подножия лестницы, подъём на треть этажа
    NODES[turn1] = {
      x: NODES[bottom].x + 1.9, y: floorY + FLOOR_H / 3, z: NODES[bottom].z,
      label: NODES[bottom].label, floor: f,
    };
    // Второй пролёт (встречный): -1.9 по X, подъём на две трети этажа
    NODES[turn2] = {
      x: NODES[bottom].x - 1.9, y: floorY + (FLOOR_H / 3) * 2, z: NODES[bottom].z,
      label: NODES[bottom].label, floor: f,
    };
    EDGES.push([bottom, turn1], [turn1, turn2], [turn2, top]);
  }
}

// Заполняем поисковые алиасы для ВСЕХ комнат на всех этажах
for (const [id, n] of Object.entries(NODES)) {
  if (id.startsWith('r') && id !== 'recent') {
    const num = id.slice(1); // например, '103', '203'
    ALIASES[num] = id;
    if (n.label.toLowerCase().includes('деканат')) {
      ALIASES[`деканат ${n.floor}`] = id;
      if (n.floor === 1) ALIASES['деканат'] = id;
    }
  }
}
// Добавим классические лестницы
ALIASES['лестница'] = 'stairsL_1';
ALIASES['лестница лево'] = 'stairsL_1';
ALIASES['лестница право'] = 'stairsR_1';
ALIASES['лестница восток'] = 'stairsE_1';
