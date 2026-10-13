import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './state/AppState.jsx';
import AppShell from './components/AppShell.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';

/* Каждый экран — отдельный чанк. Раньше все экраны, включая онбординг,
   собирались в один общий бандл вместе с 3D-стеком (three.js + r3f +
   postprocessing) — 3D-карта нужна только на /map, но её вес платили
   даже те, кто открыл сайт и увидел только приветственный экран. */
const Onboarding = lazy(() => import('./screens/Onboarding.jsx'));
const Map3D = lazy(() => import('./screens/Map3D.jsx'));
const Search = lazy(() => import('./screens/Search.jsx'));
const RouteBuilder = lazy(() => import('./screens/RouteBuilder.jsx'));
const ActiveNavigation = lazy(() => import('./screens/ActiveNavigation.jsx'));
const AiChat = lazy(() => import('./screens/AiChat.jsx'));
const Schedule = lazy(() => import('./screens/Schedule.jsx'));
const Notifications = lazy(() => import('./screens/Notifications.jsx'));
const Profile = lazy(() => import('./screens/Profile.jsx'));
const Guest = lazy(() => import('./screens/Guest.jsx'));

/* Пока грузится чанк экрана — тихий индикатор в фирменных тонах,
   а не мигание белым экраном между переходами. */
function RouteFallback() {
  return (
    <div className="route-loading">
      <span className="route-loading-dot" />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <InstallPrompt />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route element={<AppShell />}>
              <Route path="/map" element={<Map3D />} />
              <Route path="/search" element={<Search />} />
              <Route path="/route" element={<RouteBuilder />} />
              <Route path="/navigate" element={<ActiveNavigation />} />
              <Route path="/chat" element={<AiChat />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/alerts" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/guest" element={<Guest />} />
            </Route>
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
