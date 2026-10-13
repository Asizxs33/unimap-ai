import { useNavigate } from 'react-router-dom';
import { PLACE_BY_ID } from '../data/catalog.js';
import { useApp } from '../state/AppState.jsx';

/* Гостевой режим: крупные кнопки к местам, которые нужны посетителю без пропуска */
const GUEST_TILES = [
  { id: 'r105', icon: 'assignment_ind', title: 'Приёмная комиссия', sub: 'Деканат · кабинет 105' },
  { id: 'r131', icon: 'library_books', title: 'Библиотека', sub: 'Читальный зал · 131' },
  { id: 'entrance', icon: 'sensor_door', title: 'Ресепшен', sub: 'Холл главного входа' },
  { id: 'r108', icon: 'settings_accessibility', title: 'Туалеты', sub: 'Левое крыло · 108' },
  { id: 'r134', icon: 'local_cafe', title: 'Столовая', sub: 'Нижний блок · 134' },
  { id: 'exitBS', icon: 'exit_to_app', title: 'Ближайший выход', sub: 'Южный фасад' },
];

export default function Guest() {
  const { navigateTo } = useApp();
  const nav = useNavigate();
  const go = (id) => { navigateTo(id); nav('/map'); };

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <h1>Добро пожаловать, гость!</h1>
          <p>Выберите, куда вас проводить</p>
        </div>
        <span className="icon head-icon">person_outline</span>
      </header>

      <div className="screen-body">
        <div className="tiles">
          {GUEST_TILES.map((t) => (
            <button key={t.id} className="tile" onClick={() => go(t.id)}>
              <span className="icon tile-icon">{t.icon}</span>
              <strong>{t.title}</strong>
              <em>{PLACE_BY_ID[t.id]?.note ?? t.sub}</em>
            </button>
          ))}
        </div>

        <div className="hint">
          <span className="icon">info</span>
          Гостевой режим не требует входа. Для расписания и сохранённых мест
          понадобится студенческий аккаунт.
        </div>
      </div>
    </div>
  );
}
