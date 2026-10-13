import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState.jsx';
import { arrivalTime } from '../lib/pathfinding.js';
import { PLACE_BY_ID } from '../data/catalog.js';

const STEP_ICONS = {
  straight: 'straight', turn_left: 'turn_left', turn_right: 'turn_right',
  flag: 'trip_origin', place: 'place',
};

/** Активная навигация: крупная подсказка текущего шага и прогресс по маршруту */
export default function ActiveNavigation() {
  const { route, clearRoute } = useApp();
  const [i, setI] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const nav = useNavigate();

  useEffect(() => { setI(0); }, [route?.toLabel]);

  const step = route?.steps[i];

  useEffect(() => {
    if (!audioEnabled || !step?.text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(step.text);
      utterance.lang = 'ru-RU';
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error(err);
    }
  }, [i, step?.text, audioEnabled]);

  if (!route) {
    return (
      <div className="screen">
        <div className="screen-body">
          <div className="empty">
            <span className="icon">navigation</span>
            <p>Маршрут не выбран</p>
            <button className="btn btn-primary" onClick={() => nav('/search')}>
              <span className="icon">search</span> Выбрать место
            </button>
          </div>
        </div>
      </div>
    );
  }

  const last = i === route.steps.length - 1;
  const done = route.steps.slice(0, i + 1);
  const walked = done.reduce((sum, s) => {
    const m = /^([\d.]+) м/.exec(s.meta);
    return sum + (m ? parseFloat(m[1]) : 0);
  }, 0);
  const left = Math.max(0, Math.round(route.meters - walked));
  const minutesLeft = Math.max(1, Math.round(left / 1.35 / 60));
  const progress = Math.min(100, Math.round((walked / route.meters) * 100));
  const place = PLACE_BY_ID[route.path.at(-1)];

  return (
    <div className="screen nav-screen">
      <header className="nav-head">
        <button className="icon-btn ghost" onClick={() => nav('/map')} title="К карте">
          <span className="icon">arrow_back</span>
        </button>
        <div className="nav-dest">
          <strong>{place?.name ?? route.toLabel}</strong>
          <span>{place?.wing}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`icon-btn ghost${audioEnabled ? ' on' : ''}`}
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Выключить озвучку' : 'Включить озвучку'}
          >
            <span className="icon">{audioEnabled ? 'volume_up' : 'volume_off'}</span>
          </button>
          <button className="icon-btn ghost" onClick={() => { clearRoute(); nav('/map'); }} title="Завершить">
            <span className="icon">close</span>
          </button>
        </div>
      </header>

      <div className="nav-hero">
        <span className="icon nav-hero-icon">{STEP_ICONS[step.dir] ?? 'straight'}</span>
        <h1>{step.text}</h1>
        <p>{step.meta}</p>
      </div>

      <div className="nav-progress">
        <div className="nav-progress-bar"><i style={{ width: `${progress}%` }} /></div>
        <div className="nav-figures">
          <div><strong>{minutesLeft}</strong><span>мин</span></div>
          <div><strong>{left}</strong><span>м осталось</span></div>
          <div><strong>{arrivalTime(minutesLeft)}</strong><span>прибытие</span></div>
        </div>
      </div>

      {route.hasStairs && (
        <div className="nav-warn">
          <span className="icon">stairs</span>
          На маршруте есть лестница — включите «доступные маршруты», если нужен обход
        </div>
      )}

      <div className="nav-actions">
        <button className="btn btn-ghost" disabled={i === 0} onClick={() => setI((v) => v - 1)}>
          <span className="icon">arrow_back</span> Назад
        </button>
        {last ? (
          <button className="btn btn-primary" onClick={() => { clearRoute(); nav('/map'); }}>
            <span className="icon">check</span> Я на месте
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setI((v) => v + 1)}>
            Дальше <span className="icon">arrow_forward</span>
          </button>
        )}
      </div>

      <ol className="steps compact">
        {route.steps.map((s, idx) => (
          <li key={idx} className={idx === i ? 'on' : idx < i ? 'past' : ''}>
            <button onClick={() => setI(idx)}>
              <span className="step-icon"><span className="icon">{STEP_ICONS[s.dir] ?? 'straight'}</span></span>
              <span className="step-text"><strong>{s.text}</strong><em>{s.meta}</em></span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
