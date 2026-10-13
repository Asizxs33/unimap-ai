import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LESSONS, WEEK } from '../data/schedule.js';
import { PLACE_BY_ID } from '../data/catalog.js';
import { useApp } from '../state/AppState.jsx';

const STATUS = {
  done: { label: 'Прошла', icon: 'check_circle', cls: 'done' },
  now: { label: 'Сейчас', icon: 'radio_button_checked', cls: 'now' },
  next: { label: 'Далее', icon: 'schedule', cls: 'next' },
};

export default function Schedule() {
  const [day, setDay] = useState(WEEK.findIndex((d) => d.today));
  const { navigateTo } = useApp();
  const nav = useNavigate();

  const goToLesson = (roomId, idx) => {
    const prevLesson = LESSONS[idx - 1];
    const fromId = prevLesson ? prevLesson.room : 'entrance';
    navigateTo(roomId, fromId);
    nav('/map');
  };

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <h1>Расписание</h1>
          <p>Среда, 14 мая · 4 пары</p>
        </div>
        <span className="icon head-icon">calendar_month</span>
      </header>

      <div className="screen-body">
        <div className="week">
          {WEEK.map((d, i) => (
            <button key={d.day} className={`day${i === day ? ' on' : ''}`} onClick={() => setDay(i)}>
              <em>{d.day}</em>
              <strong>{d.date}</strong>
            </button>
          ))}
        </div>

        <div className="lessons">
          {LESSONS.map((l, idx) => {
            const place = PLACE_BY_ID[l.room];
            const st = STATUS[l.status];
            return (
              <article key={l.id} className={`lesson ${st.cls}`}>
                <div className="lesson-time">
                  <strong>{l.start}</strong>
                  <span>{l.end}</span>
                </div>
                <div className="lesson-body">
                  <div className="lesson-top">
                    <h3>{l.title}</h3>
                    <span className={`tag ${st.cls}`}>
                      <span className="icon" style={{ fontSize: 14 }}>{st.icon}</span> {st.label}
                    </span>
                  </div>
                  <p className="muted">{l.teacher}</p>
                  <p className="lesson-place">
                    <span className="icon" style={{ fontSize: 16 }}>location_on</span>
                    {place ? `${place.number ? place.number + ' · ' : ''}${place.name} · ${place.wing}` : l.room}
                  </p>
                  {l.status !== 'done' && (
                    <button className="btn btn-soft" onClick={() => goToLesson(l.room, idx)}>
                      <span className="icon">directions</span> Маршрут
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
