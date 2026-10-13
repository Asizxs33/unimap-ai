import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CampusScene from '../scene/CampusScene.jsx';
import BottomSheet, { SNAPS } from '../components/BottomSheet.jsx';
import { NODES } from '../data/campus.js';
import { PLACE_BY_ID, placeLabel, searchPlaces } from '../data/catalog.js';
import { useApp } from '../state/AppState.jsx';
import { arrivalTime } from '../lib/pathfinding.js';
import { LEVELS, loadLevel, saveLevel } from '../lib/quality.js';
import WalkHUD from '../components/WalkHUD.jsx';
import SceneErrorBoundary from '../components/SceneErrorBoundary.jsx';

const MODES = [
  ['ext', 'corporate_fare', 'Здание'],
  ['iso', 'layers', 'План'],
  ['top', 'space_dashboard', 'Сверху'],
  ['explore', 'directions_walk', 'Прогулка'],
];

const QUICK_IDS = ['entrance', 'r105', 'r131', 'r134', 'med', 'r108', 'exitBS'];

export default function Map3D() {
  const {
    fromId, toId, setFromId, setToId, route, clearRoute,
    favorites, toggleFavorite, pushRecent, prefs, setPrefs,
    activeFloor, setActiveFloor,
  } = useApp();

  const [mode, setMode] = useState('ext');
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeField, setActiveField] = useState('to');
  const [selected, setSelected] = useState(null);
  const [roofVisible, setRoofVisible] = useState(false);
  const [focus, setFocus] = useState(null);
  const [resetTick, setResetTick] = useState(0);
  const [night, setNight] = useState(false);
  const walkInput = useMemo(() => ({ forward: 0, side: 0, turn: 0 }), []);
  const [walkStatus, setWalkStatus] = useState(null);
  const [walkPaused, setWalkPaused] = useState(false);
  const [walkInfo, setWalkInfo] = useState(null);
  const isExploring = mode === 'explore';
  const enterBuilding = () => {
    setIntro(false); setSearchFocused(false); setSelected(null);
    setWalkStatus(null); setWalkInfo(null); setWalkPaused(false);
    setActiveFloor(1); setResetTick(v => v + 1); setMode('explore');
  };
  const leaveBuilding = useCallback(() => {
    setMode('ext'); setIntro(false); setWalkInfo(null); setWalkPaused(false);
  }, []);
  const walkAction = useCallback((action, context) => {
    if (context?.stairs) {
      setActiveFloor(f => Math.max(1, Math.min(4, f + (action === 'down' ? -1 : 1))));
    } else if (action === 'interact' && context?.exit) {
      leaveBuilding();
    } else if (action === 'interact' && context?.room) {
      setWalkInfo(context.room);
    }
  }, [setActiveFloor, leaveBuilding]);
  const pauseWalk = useCallback(() => {
    setWalkInfo(null); setWalkPaused(v => !v);
  }, []);
  const [quality, setQuality] = useState(loadLevel);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [intro, setIntro] = useState(() => !sessionStorage.getItem('unimap.introSeen'));
  const [snap, setSnap] = useState(SNAPS.peek);
  const [params] = useSearchParams();
  const [toast, setToast] = useState('');
  const toastTimer = useRef();
  const searchInputRef = useRef(null);
  const nav = useNavigate();

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* Ссылка вида /map?to=r105 сразу строит маршрут. На этом держатся
     QR-коды у входов и пересылка «вот где деканат» одним сообщением. */
  useEffect(() => {
    const to = params.get('to');
    const from = params.get('from');
    if (from && NODES[from]) setFromId(from);
    if (to && NODES[to]) { setToId(to); pushRecent(to); setIntro(false); }
    if (params.get('night') === '1') setNight(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const share = useCallback(async () => {
    const url = new URL(`${location.origin}/map`);
    url.searchParams.set('from', fromId);
    if (toId) url.searchParams.set('to', toId);
    const text = toId ? `Маршрут до «${placeLabel(toId)}»` : 'Карта корпуса';
    try {
      if (navigator.share) await navigator.share({ title: 'UniMap AI', text, url: url.toString() });
      else { await navigator.clipboard.writeText(url.toString()); showToast('Ссылка скопирована'); }
    } catch { /* пользователь закрыл окно «Поделиться» — это не ошибка */ }
  }, [fromId, toId, showToast]);

  const endIntro = useCallback(() => {
    setIntro(false);
    sessionStorage.setItem('unimap.introSeen', '1');
  }, []);

  const pickQuality = useCallback((id) => {
    setQuality(id); saveLevel(id); setQualityOpen(false);
    showToast(`Качество: ${LEVELS[id].label}`);
  }, [showToast]);

  /* Маршрут мог прийти с другого экрана — подхватываем и наводим камеру */
  useEffect(() => {
    if (toId) {
      setIntro(false);
      setMode((m) => (m === 'ext' ? 'iso' : m));
      const n = NODES[toId];
      if (n) setFocus({ x: n.x, z: n.z, path: route?.path, at: Date.now() });
    }
  }, [toId, route?.path]);

  /* Открыть поиск: шторка разворачивается на весь экран и в ней сразу
     видно избранное и быстрые места — раньше по тапу оставалась одна
     подсказка «начните вводить», и до списка нужно было ещё догадаться
     дотянуться. */
  const openSearch = useCallback(() => {
    setSearchFocused(true);
    setSnap(SNAPS.full);
    if (document.activeElement !== searchInputRef.current) searchInputRef.current?.focus();
  }, []);

  const closeSearch = useCallback(() => {
    setSearchFocused(false);
    setQuery('');
    searchInputRef.current?.blur();
    setSnap(SNAPS.peek); // закрыли поиск — шторка возвращается к краешку
  }, []);

  const pickTarget = useCallback((id) => {
    if (!id) return;
    if (activeField === 'from') { setFromId(id); setActiveField('to'); }
    else { setToId(id); pushRecent(id); }
    closeSearch();
    setSnap(SNAPS.peek);
  }, [activeField, setFromId, setToId, pushRecent, closeSearch]);

  /* Клик по помещению в 3D — карточка с описанием и кнопкой маршрута */
  const onPickNode = useCallback((id) => {
    const place = PLACE_BY_ID[id];
    if (place) { setSelected(place); setSnap(SNAPS.half); return; }
    const n = NODES[id];
    if (n) showToast(n.label);
  }, [showToast]);

  const routeToSelected = () => {
    if (!selected) return;
    setToId(selected.id);
    pushRecent(selected.id);
    setSelected(null);
    if (mode === 'ext') setMode('iso');
    setSnap(SNAPS.peek);
  };

  const searchResults = useMemo(() => (query.trim() ? searchPlaces(query, 20) : []), [query]);

  /* Что показывает шторка — приоритет: живой поиск > карточка объекта >
     сводка маршрута > обычный список быстрых мест. Один источник правды,
     а не набор независимых оверлеев поверх карты, как раньше. */
  const sheetMode = searchFocused ? 'search' : selected ? 'place' : route ? 'route' : 'idle';

  /* В обычном состоянии шторки нет вовсе: карта видна целиком, а список
     мест приезжает по тапу на поиск или по выбору помещения. Раньше
     здесь всегда торчал peek-краешек с избранным — он отъедал низ карты
     и повторял то, что и так открывается поиском. */
  const sheetOpen = sheetMode !== 'idle';

  return (
    <div className={`stage stage-2gis${isExploring ? ' stage-explore' : ''}${selected ? ' has-selected' : ''}${route ? ' has-route' : ''}`}>
      <SceneErrorBoundary onLowQuality={() => setQuality('low')}>
      <CampusScene
        mode={mode}
        path={route?.path ?? null}
        roofVisible={roofVisible}
        focus={focus}
        resetTick={resetTick}
        onPickNode={onPickNode}
        quality={quality}
        night={night}
        intro={intro}
        onIntroEnd={endIntro}
        activeFloor={activeFloor}
        walkInput={walkInput}
        walkPaused={walkPaused || !!walkInfo}
        onWalkStatus={setWalkStatus}
        onWalkAction={walkAction}
        onWalkPause={pauseWalk}
      />
      </SceneErrorBoundary>

      {isExploring && <WalkHUD input={walkInput} status={walkStatus} floor={activeFloor}
        paused={walkPaused} info={walkInfo} onPause={pauseWalk} onAction={walkAction} onExit={leaveBuilding}
        onReset={() => { setActiveFloor(1); setResetTick(v => v + 1); setWalkPaused(false); }}
        onCloseInfo={() => setWalkInfo(null)} />}
      {mode === 'ext' && !searchFocused && !sheetOpen && <button className="explore-entry" onClick={enterBuilding}>Войти в здание · Прогулка от первого лица →</button>}

      {/* ── Плавающий поиск сверху ─────────────────────────────── */}
      {!isExploring && <div className="overlay map-search-row">
        {/* Тап по всей строке, а не только по самому полю: открываем шторку
            и отдаём фокус вводу — попасть пальцем в 48-пиксельный input
            мимо иконки лупы было отдельным упражнением. */}
        <div
          className={`map-search glass${searchFocused ? ' focused' : ''}`}
          onPointerDown={openSearch}
        >
          <span className="icon">search</span>
          <input
            ref={searchInputRef}
            value={query}
            placeholder={activeField === 'from' ? 'Откуда идём?' : 'Куда идём? Номер или название'}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={openSearch}
          />
          {(query || searchFocused) && (
            <button className="map-search-clear" onClick={closeSearch} aria-label="Закрыть поиск">
              <span className="icon">close</span>
            </button>
          )}
        </div>
        {mode !== 'ext' && !searchFocused && (
          <div className="floor-pill glass">
            {[4, 3, 2, 1].map((f) => (
              <button
                key={f}
                className={activeFloor === f ? 'active' : ''}
                onClick={() => setActiveFloor(f)}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>}

      {!searchFocused && !isExploring && (
        <div className="overlay view-modes glass map-modes">
          {MODES.map(([id, icon, label]) => (
            <button key={id} className={mode === id ? 'active' : ''} onClick={() => { setIntro(false); if (id === 'explore') enterBuilding(); else setMode(id); }}>
              <span className="icon" style={{ fontSize: 16 }}>{icon}</span> {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Плавающие круглые кнопки управления картой ─────────── */}
      {!searchFocused && !isExploring && (
        <div className="overlay controls">
          <div className="control-btn glass compass-btn" title="Север">
            <span className="compass-rose" style={{ transform: 'rotate(calc(-1 * var(--cam-rotation, 0deg)))' }}>
              <span className="compass-pointer">N</span>
            </span>
          </div>
          <button
            className="control-btn glass"
            title="Сбросить вид"
            onClick={() => { setFocus(null); setResetTick((t) => t + 1); }}
          >
            <span className="icon">center_focus_strong</span>
          </button>
          <button
            className="control-btn glass"
            title={mode === 'ext' ? 'Показать план этажа' : 'Скрыть/показать крышу'}
            onClick={() => (mode === 'ext' ? setMode('iso') : setRoofVisible((v) => !v))}
          >
            <span className="icon">layers</span>
          </button>
          <button
            className={`control-btn glass${night ? ' on' : ''}`}
            title={night ? 'Дневной свет' : 'Ночной вид'}
            onClick={() => setNight((v) => !v)}
          >
            <span className="icon">{night ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button className="control-btn glass" title="Поделиться маршрутом" onClick={share}>
            <span className="icon">share</span>
          </button>
          <div className="quality-wrap">
            <button
              className="control-btn glass"
              title={`Качество: ${LEVELS[quality].label}`}
              onClick={() => setQualityOpen((v) => !v)}
            >
              <span className="icon">display_settings</span>
            </button>
            {qualityOpen && (
              <div className="quality-menu">
                <p className="quality-title">Качество графики</p>
                {Object.values(LEVELS).map((l) => (
                  <button
                    key={l.id}
                    className={`quality-row${quality === l.id ? ' on' : ''}`}
                    onClick={() => pickQuality(l.id)}
                  >
                    <strong>{l.label}</strong>
                    <em>{l.hint}</em>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="control-btn glass" title="Уведомления" onClick={() => nav('/alerts')}>
            <span className="icon">campaign</span>
          </button>
        </div>
      )}

      {intro && !isExploring && (
        <div className="overlay intro-hint glass">
          <span className="icon">3d_rotation</span>
          Обзор корпуса — коснитесь, чтобы взять управление
        </div>
      )}

      <div className={`toast${toast ? ' show' : ''}`}>{toast || '—'}</div>

      {/* ── Шторка снизу: единственное место для контента ──────── */}
      {sheetOpen && !isExploring && (
        <BottomSheet snap={snap} onSnapChange={setSnap} className={`sheet-${sheetMode}`}>
          {sheetMode === 'search' && (
            <SearchSheet
              results={searchResults}
              query={query}
              favorites={favorites}
              onPick={pickTarget}
              onToggleFavorite={toggleFavorite}
              onSeeAll={() => nav('/search')}
            />
          )}

          {sheetMode === 'place' && selected && (
            <PlaceSheet
              place={selected}
              isFavorite={favorites.includes(selected.id)}
              onToggleFavorite={() => toggleFavorite(selected.id)}
              onRoute={routeToSelected}
              onClose={() => setSelected(null)}
            />
          )}

          {sheetMode === 'route' && route && (
            <RouteSheet
              route={route}
              avoidStairs={prefs.avoidStairs}
              onToggleAvoidStairs={(v) => setPrefs((p) => ({ ...p, avoidStairs: v }))}
              onStart={() => nav('/navigate')}
              onClear={clearRoute}
              onChangeFrom={() => { setActiveField('from'); setSearchFocused(true); setSnap(SNAPS.full); requestAnimationFrame(() => searchInputRef.current?.focus()); }}
            />
          )}

        </BottomSheet>
      )}
    </div>
  );
}

/* ── Содержимое шторки: живой поиск ────────────────────────────── */
function SearchSheet({ results, query, favorites, onPick, onToggleFavorite, onSeeAll }) {
  /* Пустой запрос — не пустой экран: показываем то же, что и в обычном
     состоянии шторки, чтобы по тапу на поиск сразу можно было ткнуть в
     избранное, а не набирать номер кабинета вслепую. */
  if (!query.trim()) {
    return <IdleSheet favorites={favorites} onPick={onPick} onSeeAll={onSeeAll} />;
  }
  return (
    <div className="sheet-list">
      {results.length === 0 && (
        <p className="sheet-hint">Ничего не нашли по запросу «{query}»</p>
      )}
      {results.map((p) => (
        <PlaceRow key={p.id} place={p} fav={favorites.includes(p.id)}
                  onGo={() => onPick(p.id)} onFav={() => onToggleFavorite(p.id)} />
      ))}
    </div>
  );
}

/* ── Содержимое шторки: обычное состояние (быстрые места) ────────── */
function IdleSheet({ favorites, onPick, onSeeAll }) {
  return (
    <div className="sheet-list">
      {favorites.length > 0 && (
        <>
          <div className="sheet-section-row">
            <h3 className="sheet-section">Избранное</h3>
            <button className="sheet-section-link" onClick={onSeeAll}>Все места</button>
          </div>
          {favorites.map((id) => PLACE_BY_ID[id] && (
            <PlaceRow key={id} place={PLACE_BY_ID[id]} fav onGo={() => onPick(id)} />
          ))}
        </>
      )}

      <h3 className="sheet-section">Быстрые места</h3>
      {QUICK_IDS.map((id) => (
        <PlaceRow key={id} place={PLACE_BY_ID[id]} onGo={() => onPick(id)} />
      ))}
    </div>
  );
}

/* ── Содержимое шторки: карточка выбранного помещения ─────────────── */
function PlaceSheet({ place, isFavorite, onToggleFavorite, onRoute, onClose }) {
  return (
    <div className="sheet-place">
      <div className="sheet-place-head">
        <span className="plate large" data-cat={place.cat}>
          {place.number || <span className="icon">{place.icon}</span>}
        </span>
        <div className="sheet-place-title">
          <strong>{place.name}</strong>
          <span>{place.wing}{place.note ? ` · ${place.note}` : ''}</span>
        </div>
        <button className="icon-btn ghost" onClick={onClose} aria-label="Закрыть">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="sheet-place-actions">
        <button className="btn btn-primary big" onClick={onRoute}>
          <span className="icon">navigation</span> Маршрут
        </button>
        <button className={`icon-btn big${isFavorite ? ' on' : ''}`} onClick={onToggleFavorite} title="В избранное">
          <span className="icon">{isFavorite ? 'star' : 'star_border'}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Содержимое шторки: сводка маршрута ────────────────────────────── */
function RouteSheet({ route, avoidStairs, onToggleAvoidStairs, onStart, onClear, onChangeFrom }) {
  return (
    <div className="sheet-route">
      <div className="sheet-route-head">
        <div>
          <span className="sheet-route-from" onClick={onChangeFrom}>
            <span className="icon" style={{ fontSize: 15 }}>my_location</span> {route.fromLabel}
          </span>
          <strong>{route.toLabel}</strong>
        </div>
        <button className="icon-btn ghost" onClick={onClear} aria-label="Сбросить маршрут">
          <span className="icon">close</span>
        </button>
      </div>

      <div className="sheet-route-figures">
        <div><strong>{route.minutes}</strong><span>мин</span></div>
        <div><strong>{route.meters}</strong><span>м</span></div>
        <div><strong>{arrivalTime(route.minutes)}</strong><span>прибытие</span></div>
      </div>

      <label className="switch-row compact">
        <span className="icon">accessible</span>
        <span className="switch-text"><strong>Обходить лестницы</strong></span>
        <input type="checkbox" checked={avoidStairs} onChange={(e) => onToggleAvoidStairs(e.target.checked)} />
        <span className="switch-track" />
      </label>

      <button className="btn btn-primary big sheet-route-start" onClick={onStart}>
        <span className="icon">navigation</span> Начать навигацию
      </button>
    </div>
  );
}

function PlaceRow({ place, onGo, fav, onFav }) {
  if (!place) return null;
  return (
    <div className="place-row">
      <span className="plate" data-cat={place.cat}>
        {place.number || <span className="icon">{place.icon}</span>}
      </span>
      <button className="place-main" onClick={onGo}>
        <strong>{place.name}</strong>
        <span>{place.wing}{place.note ? ` · ${place.note}` : ''}</span>
      </button>
      {onFav && (
        <button className={`icon-btn${fav ? ' on' : ''}`} onClick={onFav} title="В избранное">
          <span className="icon">{fav ? 'star' : 'star_border'}</span>
        </button>
      )}
      <button className="icon-btn primary" onClick={onGo} title="Маршрут">
        <span className="icon">navigation</span>
      </button>
    </div>
  );
}
