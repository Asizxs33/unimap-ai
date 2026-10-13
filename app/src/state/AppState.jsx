import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { findPath, walkMinutes, pathLength, pathHasStairs, buildSteps } from '../lib/pathfinding.js';
import { PLACE_BY_ID, placeLabel } from '../data/catalog.js';
import { NODES } from '../data/campus.js';

/* Общее состояние приложения: маршрут, избранное, недавнее, настройки.
   Раньше каждый экран жил сам по себе — теперь любой из них может
   построить маршрут, и карта его подхватит. */

const AppCtx = createContext(null);

const STORE_KEY = 'unimap.v1';

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function AppProvider({ children }) {
  const saved = useMemo(loadStore, []);

  const [fromId, setFromId] = useState('entrance');
  const [toId, setToId] = useState(null);
  const [activeFloor, setActiveFloor] = useState(1);
  const [favorites, setFavorites] = useState(saved.favorites ?? ['r105', 'r131']);
  const [recent, setRecent] = useState(saved.recent ?? []);
  const [prefs, setPrefs] = useState({
    avoidStairs: false,
    lessonReminders: true,
    guest: false,
    ...(saved.prefs ?? {}),
  });

  /* Сохраняем в браузере — маршрутные предпочтения и избранное переживают перезагрузку */
  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ favorites, recent, prefs }));
  }, [favorites, recent, prefs]);

  const path = useMemo(
    () => (toId ? findPath(fromId, toId, { avoidStairs: prefs.avoidStairs }) : null),
    [fromId, toId, prefs.avoidStairs],
  );

  const route = useMemo(() => {
    if (!path) return null;
    return {
      path,
      steps: buildSteps(path),
      meters: Math.round(pathLength(path)),
      minutes: walkMinutes(path),
      hasStairs: pathHasStairs(path),
      fromLabel: placeLabel(fromId),
      toLabel: placeLabel(toId),
    };
  }, [path, fromId, toId]);

  const pushRecent = useCallback((id) => {
    if (!PLACE_BY_ID[id]) return;
    setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 6));
  }, []);

  /** Построить маршрут — вызывается из расписания, чата, поиска, уведомлений */
  const navigateTo = useCallback((id, from) => {
    if (from) {
      setFromId(from);
      const fromNode = NODES[from];
      if (fromNode?.floor) setActiveFloor(fromNode.floor);
    }
    setToId(id);
    pushRecent(id);
    const toNode = NODES[id];
    if (toNode?.floor) setActiveFloor(toNode.floor);
  }, [pushRecent]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, []);

  const clearRoute = useCallback(() => setToId(null), []);

  const value = useMemo(() => ({
    fromId, toId, setFromId, setToId,
    activeFloor, setActiveFloor,
    route, navigateTo, clearRoute,
    favorites, toggleFavorite,
    recent, pushRecent,
    prefs, setPrefs,
  }), [fromId, toId, activeFloor, route, navigateTo, clearRoute, favorites, toggleFavorite, recent, pushRecent, prefs]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp должен вызываться внутри <AppProvider>');
  return ctx;
}
