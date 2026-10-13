import { useNavigate } from 'react-router-dom';
import { PROFILE } from '../data/schedule.js';
import { PLACE_BY_ID } from '../data/catalog.js';
import { useApp } from '../state/AppState.jsx';

export default function Profile() {
  const { favorites, toggleFavorite, prefs, setPrefs, recent, navigateTo } = useApp();
  const nav = useNavigate();

  const set = (key) => (e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }));
  const go = (id) => { navigateTo(id); nav('/map'); };

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <h1>Профиль</h1>
          <p>Настройки маршрутов и сохранённые места</p>
        </div>
      </header>

      <div className="screen-body">
        <div className="profile-card">
          <div className="avatar"><span className="icon">person</span></div>
          <div>
            <h2>{PROFILE.name}</h2>
            <p className="muted">{PROFILE.faculty}</p>
            <div className="profile-tags">
              <span className="tag"><span className="icon" style={{ fontSize: 14 }}>badge</span> ID: {PROFILE.studentId}</span>
              <span className="tag"><span className="icon" style={{ fontSize: 14 }}>school</span> {PROFILE.year}</span>
            </div>
          </div>
        </div>

        <section>
          <h2 className="section-title">Предпочтения маршрута</h2>

          <label className="switch-row">
            <span className="icon">accessible</span>
            <span className="switch-text">
              <strong>Только доступные маршруты</strong>
              <em>Обходить лестницы, когда есть альтернатива</em>
            </span>
            <input type="checkbox" checked={prefs.avoidStairs} onChange={set('avoidStairs')} />
            <span className="switch-track" />
          </label>

          <label className="switch-row">
            <span className="icon">schedule</span>
            <span className="switch-text">
              <strong>Напоминания о парах</strong>
              <em>Уведомлять за 15 минут и предлагать маршрут</em>
            </span>
            <input type="checkbox" checked={prefs.lessonReminders} onChange={set('lessonReminders')} />
            <span className="switch-track" />
          </label>

          <label className="switch-row">
            <span className="icon">badge</span>
            <span className="switch-text">
              <strong>Гостевой режим</strong>
              <em>Быстрый доступ к приёмной комиссии и выходам</em>
            </span>
            <input type="checkbox" checked={prefs.guest} onChange={set('guest')} />
            <span className="switch-track" />
          </label>
        </section>

        <section>
          <h2 className="section-title">Сохранённые места ({favorites.length})</h2>
          {favorites.length ? (
            <div className="list">
              {favorites.map((id) => {
                const p = PLACE_BY_ID[id];
                if (!p) return null;
                return (
                  <div className="place-row" key={id}>
                    <span className="plate" data-cat={p.cat}>
                      {p.number || <span className="icon">{p.icon}</span>}
                    </span>
                    <button className="place-main" onClick={() => go(id)}>
                      <strong>{p.name}</strong>
                      <span>{p.wing}{p.note ? ` · ${p.note}` : ''}</span>
                    </button>
                    <button className="icon-btn on" onClick={() => toggleFavorite(id)} title="Убрать">
                      <span className="icon">star</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">Пока пусто — добавьте место звёздочкой в поиске</p>
          )}
        </section>

        {recent.length > 0 && (
          <section>
            <h2 className="section-title">История поиска</h2>
            <div className="chips">
              {recent.map((id) => PLACE_BY_ID[id] && (
                <button key={id} className="chip" onClick={() => go(id)}>
                  {PLACE_BY_ID[id].name}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
