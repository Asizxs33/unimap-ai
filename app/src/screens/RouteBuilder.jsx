import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaceSearch from '../components/PlaceSearch.jsx';
import { useApp } from '../state/AppState.jsx';
import { placeLabel, PLACE_BY_ID } from '../data/catalog.js';
import { arrivalTime } from '../lib/pathfinding.js';

const STEP_ICONS = {
  straight: 'straight', turn_left: 'turn_left', turn_right: 'turn_right',
  flag: 'trip_origin', place: 'place',
};

export default function RouteBuilder() {
  const { fromId, toId, setFromId, setToId, route, prefs, setPrefs } = useApp();
  const [fromText, setFromText] = useState(placeLabel(fromId));
  const [toText, setToText] = useState(toId ? placeLabel(toId) : '');
  const nav = useNavigate();

  const swap = () => {
    if (!toId) return;
    const a = fromId, b = toId;
    setFromId(b); setToId(a);
    setFromText(placeLabel(b)); setToText(placeLabel(a));
  };

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <h1>Построение маршрута</h1>
          <p>Первый этаж · {PLACE_BY_ID[fromId]?.wing ?? '—'}</p>
        </div>
      </header>

      <div className="screen-body">
        <div className="route-form">
          <div className="route-inputs">
            <PlaceSearch
              icon="my_location" value={fromText} onChange={setFromText}
              onSelect={(id) => id && setFromId(id)} placeholder="Откуда"
            />
            <PlaceSearch
              icon="location_on" value={toText} onChange={setToText}
              onSelect={(id) => id && setToId(id)} placeholder="Куда"
            />
          </div>
          <button className="icon-btn big" onClick={swap} title="Поменять местами">
            <span className="icon">swap_vert</span>
          </button>
        </div>

        <label className="switch-row">
          <span className="icon">accessible</span>
          <span className="switch-text">
            <strong>Только доступные маршруты</strong>
            <em>Обходить лестницы, если есть другой путь</em>
          </span>
          <input
            type="checkbox"
            checked={prefs.avoidStairs}
            onChange={(e) => setPrefs((p) => ({ ...p, avoidStairs: e.target.checked }))}
          />
          <span className="switch-track" />
        </label>

        {route ? (
          <>
            <div className="route-summary">
              <div className="route-stat">
                <strong>{route.minutes}</strong>
                <span>мин ходьбы</span>
              </div>
              <div className="route-meta">
                <p>{route.meters} м · {route.steps.length - 1} поворотов и участков</p>
                <p className="muted">
                  Прибытие примерно в {arrivalTime(route.minutes)}
                  {route.hasStairs ? ' · на пути есть лестница' : ' · без лестниц'}
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => nav('/navigate')}>
                <span className="icon">navigation</span> Начать
              </button>
            </div>

            <section>
              <h2 className="section-title">Пошагово</h2>
              <ol className="steps">
                {route.steps.map((s, i) => (
                  <li key={i}>
                    <span className="step-icon">
                      <span className="icon">{STEP_ICONS[s.dir] ?? 'straight'}</span>
                    </span>
                    <span className="step-text">
                      <strong>{s.text}</strong>
                      <em>{s.meta}</em>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : (
          <div className="empty">
            <span className="icon">route</span>
            <p>Выберите пункт назначения — маршрут построится автоматически</p>
          </div>
        )}
      </div>
    </div>
  );
}
