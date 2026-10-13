import { useNavigate } from 'react-router-dom';
import { LESSONS } from '../data/schedule.js';
import { PLACE_BY_ID } from '../data/catalog.js';
import { useApp } from '../state/AppState.jsx';
import { findPath, walkMinutes } from '../lib/pathfinding.js';

/** Уведомления строятся из расписания: ближайшая пара + время в пути до неё */
export default function Notifications() {
  const { navigateTo, fromId, prefs } = useApp();
  const nav = useNavigate();

  const upcoming = LESSONS.filter((l) => l.status !== 'done');

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <h1>Уведомления</h1>
          <p>{prefs.lessonReminders ? 'Напоминания включены' : 'Напоминания отключены в профиле'}</p>
        </div>
        <span className="icon head-icon">notifications_active</span>
      </header>

      <div className="screen-body">
        {upcoming.map((l) => {
          const place = PLACE_BY_ID[l.room];
          const path = findPath(fromId, l.room, { avoidStairs: prefs.avoidStairs });
          const mins = path ? walkMinutes(path) : null;
          const soon = l.status === 'now';

          return (
            <article key={l.id} className={`notice${soon ? ' urgent' : ''}`}>
              <div className="notice-head">
                <span className="icon">{soon ? 'notifications_active' : 'schedule'}</span>
                <strong>{soon ? 'Пара идёт сейчас' : 'Скоро начнётся'}</strong>
              </div>
              <h3>{l.title}</h3>
              <p className="muted">{l.teacher}</p>
              <div className="notice-rows">
                <p><span className="icon" style={{ fontSize: 16 }}>location_on</span>
                  {place ? `${place.name} · ${place.wing}` : l.room}</p>
                <p><span className="icon" style={{ fontSize: 16 }}>schedule</span>
                  {l.start} — {l.end}</p>
                {mins != null && (
                  <p><span className="icon" style={{ fontSize: 16 }}>directions_walk</span>
                    Идти примерно {mins} мин</p>
                )}
              </div>
              <div className="notice-actions">
                <button className="btn btn-primary" onClick={() => { navigateTo(l.room); nav('/navigate'); }}>
                  <span className="icon">directions</span> Построить маршрут
                </button>
                <button className="btn btn-ghost" onClick={() => nav('/schedule')}>
                  Расписание
                </button>
              </div>
            </article>
          );
        })}

        {!upcoming.length && (
          <div className="empty">
            <span className="icon">notifications_off</span>
            <p>На сегодня занятий больше нет</p>
          </div>
        )}
      </div>
    </div>
  );
}
