import { NODES } from './campus.js';

/* Справочник помещений — единый источник для поиска, расписания, чата и карты.
   Программно расширен на 4 этажа для полной интеграции навигации. */

export const CATEGORIES = {
  study: { label: 'Аудитории', icon: 'auto_stories', color: '#dbe1ff' },
  admin: { label: 'Офисы', icon: 'corporate_fare', color: '#ffe8a3' },
  service: { label: 'Сервисы', icon: 'local_cafe', color: '#cdebd9' },
  tech: { label: 'Технические', icon: 'settings_accessibility', color: '#f5c4c8' },
  transit: { label: 'Входы и лестницы', icon: 'sensor_door', color: '#e2e8f0' },
};

// Базовый список помещений 1-го этажа
const BASE_PLACES = [
  // ── Левое крыло ──
  { id: 'r101', number: '101', name: 'Пожарный пост', cat: 'service', wing: 'Левое крыло', icon: 'health_and_safety', note: 'Круглосуточно', tags: ['охрана', 'пост', 'пожарный'] },
  { id: 'r102', number: '102', name: 'Гардероб', cat: 'service', wing: 'Левое крыло', icon: 'style', note: 'Сентябрь — май', tags: ['гардероб', 'одежда'] },
  { id: 'r103', number: '103', name: 'Аудитория 103', cat: 'study', wing: 'Левое крыло', icon: 'auto_stories', note: '48 мест', tags: ['лекционная'] },
  { id: 'r104', number: '104', name: 'Аудитория 104', cat: 'study', wing: 'Левое крыло', icon: 'auto_stories', note: '48 мест', tags: ['лекционная'] },
  { id: 'med', number: 'Мед', name: 'Медпункт', cat: 'service', wing: 'Левое крыло', icon: 'vaccines', note: 'Первая помощь · 08:00–18:00', tags: ['медицина', 'врач', 'аптека', 'медпункт'] },
  { id: 'r105', number: '105', name: 'Деканат', cat: 'admin', wing: 'Левое крыло', icon: 'workspace_premium', note: 'Приём 09:00–17:00', tags: ['деканат', 'документы', 'справка'] },
  { id: 'r106', number: '106', name: 'Аудитория 106', cat: 'study', wing: 'Левое крыло', icon: 'auto_stories', note: '32 места', tags: ['семинарская'] },
  { id: 'r107', number: '107', name: 'Аудитория 107', cat: 'study', wing: 'Левое крыло', icon: 'auto_stories', note: '48 мест', tags: ['лекционная'] },
  { id: 'r108', number: '108', name: 'Санузел', cat: 'tech', wing: 'Левое крыло', icon: 'settings_accessibility', note: 'Есть доступная кабина', tags: ['туалет', 'wc', 'уборная'] },
  { id: 'r110', number: '110', name: 'Аудитория 110', cat: 'study', wing: 'Левое крыло', icon: 'auto_stories', note: '60 мест · проектор', tags: ['лекционная', 'большая'] },

  // ── Правое крыло ──
  { id: 'r120', number: '120', name: 'Аудитория 120', cat: 'study', wing: 'Правое крыло', icon: 'auto_stories', note: '48 мест', tags: ['лекционная'] },
  { id: 'r121', number: '121', name: 'Аудитория 121', cat: 'study', wing: 'Правое крыло', icon: 'auto_stories', note: '48 мест', tags: ['лекционная'] },
  { id: 'r122', number: '122', name: 'Аудитория 122', cat: 'study', wing: 'Правое крыло', icon: 'auto_stories', note: '48 мест', tags: ['лекционная'] },
  { id: 'r123', number: '123', name: 'Учебная часть', cat: 'admin', wing: 'Правое крыло', icon: 'quick_reference_all', note: 'Приём 09:00–16:00', tags: ['учебная часть', 'справка'] },
  { id: 'r124', number: '124', name: 'Аудитория 124', cat: 'study', wing: 'Правое крыло', icon: 'auto_stories', note: '48 мест', tags: ['лекционная'] },
  { id: 'r125', number: '125', name: 'Компьютерный класс', cat: 'study', wing: 'Правое крыло', icon: 'developer_board', note: '24 места · ПК', tags: ['компьютер', 'информатика', 'пк'] },
  { id: 'r126', number: '126', name: 'Аудитория 126', cat: 'study', wing: 'Правое крыло', icon: 'auto_stories', note: '32 места', tags: ['семинарская'] },

  // ── Нижний блок ──
  { id: 'r130', number: '130', name: 'Аудитория 130', cat: 'study', wing: 'Нижний блок', icon: 'co_present', note: '72 места', tags: ['поточная'] },
  { id: 'r131', number: '131', name: 'Библиотека', cat: 'service', wing: 'Нижний блок', icon: 'library_books', note: 'Читальный зал · 09:00–19:00', tags: ['библиотека', 'книги', 'читальный'] },
  { id: 'r132', number: '132', name: 'Конференц-зал', cat: 'admin', wing: 'Нижний блок', icon: 'cast_for_education', note: '120 мест', tags: ['зал', 'конференция', 'актовый'] },
  { id: 'r133', number: '133', name: 'Кафедра', cat: 'admin', wing: 'Нижний блок', icon: 'emoji_objects', note: 'Преподаватели', tags: ['кафедра', 'преподаватель'] },
  { id: 'r134', number: '134', name: 'Столовая', cat: 'service', wing: 'Нижний блок', icon: 'local_cafe', note: '08:00–17:00', tags: ['столовая', 'еда', 'буфет', 'обед'] },

  // ── Входы, выходы, лестницы ──
  { id: 'entrance', number: '', name: 'Главный вход', cat: 'transit', wing: 'Южный фасад', icon: 'sensor_door', note: 'Турникеты · ресепшен', tags: ['вход', 'ресепшен'] },
  { id: 'exitBS', number: '', name: 'Выход (юг)', cat: 'transit', wing: 'Южный фасад', icon: 'exit_to_app', note: 'Основной эвакуационный', tags: ['выход', 'эвакуация'] },
  { id: 'exitL', number: '', name: 'Выход (север-лево)', cat: 'transit', wing: 'Левое крыло', icon: 'exit_to_app', note: 'Торец крыла', tags: ['выход', 'эвакуация'] },
  { id: 'exitR', number: '', name: 'Выход (север-право)', cat: 'transit', wing: 'Правое крыло', icon: 'exit_to_app', note: 'Торец крыла', tags: ['выход', 'эвакуация'] },
  { id: 'exitBSR', number: '', name: 'Выход (восток)', cat: 'transit', wing: 'Нижний блок', icon: 'exit_to_app', note: 'К парковке', tags: ['выход', 'парковка'] },
  { id: 'stairsL', number: '', name: 'Лестница (лево)', cat: 'transit', wing: 'Левое крыло', icon: 'stairs_2', note: 'На 2–4 этажи', tags: ['лестница'] },
  { id: 'stairsR', number: '', name: 'Лестница (право)', cat: 'transit', wing: 'Правое крыло', icon: 'stairs_2', note: 'На 2–4 этажи', tags: ['лестница'] },
  { id: 'stairsE', number: '', name: 'Лестница (восток)', cat: 'transit', wing: 'Нижний блок', icon: 'stairs_2', note: 'На 2–4 этажи', tags: ['лестница'] },
];

export const PLACES = [];

// Генерируем помещения для всех 4 этажей
for (let f = 1; f <= 4; f++) {
  for (const p of BASE_PLACES) {
    if (p.id === 'entrance' || p.id.startsWith('exit')) {
      if (f === 1) {
        PLACES.push(p);
      }
      continue;
    }

    if (p.id.startsWith('stairs')) {
      PLACES.push({
        id: `${p.id}_${f}`,
        number: '',
        name: `${p.name} (${f} этаж)`,
        cat: 'transit',
        wing: p.wing,
        icon: 'stairs',
        note: f < 4 ? `Ведет на ${f + 1} этаж` : `Спуск на ${f - 1} этаж`,
        tags: [...p.tags, `${f} этаж`, `этаж ${f}`],
      });
      continue;
    }

    let id = p.id;
    let number = p.number;
    let name = p.name;
    let note = p.note;
    let tags = [...p.tags, `${f} этаж`, `этаж ${f}`];
    let cat = p.cat;

    if (f > 1) {
      if (id === 'med') {
        id = `r${f}09`;
        number = `${f}09`;
        name = `Лаборатория ${f}09`;
        note = 'Практические и лабораторные занятия';
        tags.push('лаборатория', 'кабинет');
      } else if (id.startsWith('r1')) {
        const num = id.slice(2);
        id = `r${f}${num}`;
        number = `${f}${num}`;
        
        // Кастомные названия для верхних этажей, чтобы придать глубины
        if (num === '05') {
          name = f === 2 ? 'Деканат Физики' : f === 3 ? 'Деканат Математики' : 'Кабинет Ректора';
          note = f === 4 ? 'Приемная ректора · 10:00–16:00' : 'Прием студентов';
        } else if (num === '23') {
          name = `Офис кафедры ${f}23`;
          note = 'Преподавательская';
        } else if (num === '31') {
          name = f === 2 ? 'Коворкинг зона' : f === 3 ? 'Читальный зал №2' : 'Архив библиотеки';
          note = 'Место для самостоятельной работы';
        } else if (num === '32') {
          name = `Зал заседаний ${f}32`;
          note = 'Конференции и совещания';
        } else if (num === '33') {
          name = `Кафедра ${f}33`;
          note = 'Преподаватели';
        } else if (num === '34') {
          name = `Буфет ${f}34`;
          note = '09:00–16:00';
        } else if (num === '01') {
          name = f === 2 ? 'IT-Департамент' : f === 3 ? 'Студенческий совет' : 'Серверная';
          cat = f === 4 ? 'tech' : 'admin';
        } else if (num === '02') {
          name = f === 2 ? 'Кафедра информатики' : f === 3 ? 'Методический отдел' : 'Кабинет проректора';
          cat = 'admin';
        } else {
          name = `Аудитория ${number}`;
        }
      }
    }

    PLACES.push({ id, number, name, cat, wing: p.wing, icon: p.icon, note, tags });
  }
}

export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]));
PLACE_BY_ID['stairsL'] = PLACE_BY_ID['stairsL_1'];
PLACE_BY_ID['stairsR'] = PLACE_BY_ID['stairsR_1'];
PLACE_BY_ID['stairsE'] = PLACE_BY_ID['stairsE_1'];

/** Отображаемое имя: «105 · Деканат» либо просто название */
export function placeLabel(id) {
  const p = PLACE_BY_ID[id];
  if (!p) return NODES[id]?.label ?? id;
  return p.number ? `${p.number} · ${p.name}` : p.name;
}

/**
 * Живой поиск по номеру, названию, крылу и синонимам.
 * Точные совпадения по номеру идут первыми — так «105» находит деканат сразу.
 */
export function searchPlaces(query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  for (const p of PLACES) {
    const number = p.number.toLowerCase();
    const name = p.name.toLowerCase();
    let score = 0;
    if (number && number === q) score = 100;
    else if (number && number.startsWith(q)) score = 90;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (p.tags.some((t) => t.startsWith(q))) score = 55;
    else if (p.tags.some((t) => t.includes(q))) score = 40;
    else if (p.wing.toLowerCase().includes(q)) score = 20;
    if (score) scored.push({ place: p, score });
  }
  scored.sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name));
  return scored.slice(0, limit).map((s) => s.place);
}
