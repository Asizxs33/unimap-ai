import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import './styles/screens.css';
import './styles/extras.css';
import './styles/map2gis.css';
import App from './App.jsx';
import { lockViewportScale, trackViewportHeight } from './lib/viewport.js';

/* Ведём себя как приложение: масштаб страницы зафиксирован, высота
   вьюпорта — фактическая, а не «экран минус адресная строка». */
lockViewportScale();
trackViewportHeight();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
