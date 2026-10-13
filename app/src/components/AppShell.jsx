import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../state/AppState.jsx';

/* Главные разделы — на широком экране слева, на телефоне снизу */
const NAV = [
  { to: '/map', icon: 'explore', label: 'Карта' },
  { to: '/search', icon: 'saved_search', label: 'Поиск' },
  { to: '/route', icon: 'fork_right', label: 'Маршрут' },
  { to: '/chat', icon: 'forum', label: 'ИИ-чат' },
  { to: '/schedule', icon: 'pending_actions', label: 'Расписание' },
  { to: '/profile', icon: 'shield_person', label: 'Профиль' },
];

export default function AppShell() {
  const { route, prefs } = useApp();

  return (
    <div className="shell">
      <nav className="rail">
        <NavLink to="/map" className="rail-brand" title="UniMap AI">
          <span className="icon">layers</span>
        </NavLink>

        <div className="rail-links">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `rail-link${isActive ? ' active' : ''}`}
              title={n.label}
            >
              <span className="icon">{n.icon}</span>
              <em>{n.label}</em>
            </NavLink>
          ))}
        </div>

        <div className="rail-foot">
          {route && (
            <NavLink to="/navigate" className="rail-live" title={`Маршрут: ${route.toLabel}`}>
              <span className="icon">near_me</span>
              <em>{route.minutes} мин</em>
            </NavLink>
          )}
          {prefs.guest && (
            <NavLink to="/guest" className="rail-link" title="Гостевой режим">
              <span className="icon">face</span>
              <em>Гость</em>
            </NavLink>
          )}
        </div>
      </nav>

      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
