import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState.jsx';
import { LESSONS } from '../data/schedule.js';
import { PLACE_BY_ID, placeLabel } from '../data/catalog.js';

/* Первый экран решает одну задачу: новый студент за один клик должен
   понять, куда ему идти прямо сейчас — а не прочитать список функций.
   Если ближайшей пары нет (демо-данные закончились), откатываемся
   на общий вход в карту/поиск — экран никогда не остаётся пустым. */
function findNextLesson() {
  return LESSONS.find((l) => l.status === 'now') ?? LESSONS.find((l) => l.status === 'next') ?? null;
}

export default function Onboarding() {
  const nav = useNavigate();
  const { setPrefs, navigateTo } = useApp();
  const lesson = findNextLesson();
  const place = lesson ? PLACE_BY_ID[lesson.room] : null;

  const goToLesson = () => {
    if (!lesson) return;
    navigateTo(lesson.room);
    nav('/navigate');
  };

  return (
    <div className="onboard">
      <div className="onboard-art">
        <div className="onboard-pin">
          <span className="icon">location_on</span>
          <div>
            <em>{lesson ? (lesson.status === 'now' ? 'ИДЁТ СЕЙЧАС' : 'СЛЕДУЮЩАЯ ПАРА') : 'ПУНКТ НАЗНАЧЕНИЯ'}</em>
            <strong>{place ? placeLabel(place.id) : 'Выберите на карте'}</strong>
          </div>
        </div>
      </div>

      <div className="onboard-body">
        <div className="brand-mark big"><span className="icon">account_balance</span></div>
        <h1>UniMap AI</h1>

        {lesson ? (
          <>
            <p className="lead">
              Первый день в корпусе? Вот твоя {lesson.status === 'now' ? 'текущая' : 'ближайшая'} пара —
              нажми и мы проведём тебя по маршруту шаг за шагом.
            </p>

            <div className="welcome-lesson">
              <div className="welcome-lesson-time">
                <strong>{lesson.start}</strong>
                <span>{lesson.end}</span>
              </div>
              <div className="welcome-lesson-body">
                <strong>{lesson.title}</strong>
                <span>{lesson.teacher}</span>
                <span className="welcome-lesson-place">
                  <span className="icon" style={{ fontSize: 16 }}>location_on</span>
                  {place ? `${placeLabel(place.id)} · ${place.wing}` : lesson.room}
                </span>
              </div>
            </div>

            <div className="onboard-actions">
              <button className="btn btn-primary big" onClick={goToLesson}>
                Веди меня <span className="icon">navigation</span>
              </button>
              <button className="btn btn-ghost" onClick={() => nav('/schedule')}>
                <span className="icon">calendar_today</span> Всё расписание
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="lead">
              Точная навигация по корпусу ОҚМПУ им. Ө. Жәнібекова.
              Найди свою аудиторию за пару секунд.
            </p>
            <div className="onboard-actions">
              <button className="btn btn-primary big" onClick={() => nav('/search')}>
                Найти аудиторию <span className="icon">search</span>
              </button>
              <button className="btn btn-ghost" onClick={() => nav('/map')}>
                <span className="icon">map</span> Открыть карту
              </button>
            </div>
          </>
        )}

        <button
          className="onboard-guest-link"
          onClick={() => { setPrefs((p) => ({ ...p, guest: true })); nav('/guest'); }}
        >
          <span className="icon" style={{ fontSize: 17 }}>badge</span> Я гость, не студент
        </button>
      </div>
    </div>
  );
}
