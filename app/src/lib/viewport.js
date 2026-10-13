/**
 * Поведение веб-приложения вместо поведения страницы.
 *
 * На телефоне браузер по умолчанию считает нас документом: щипок двумя
 * пальцами масштабирует вёрстку, двойной тап приближает абзац, а тап по
 * полю ввода с мелким шрифтом в iOS доезжает зумом до 16px и оставляет
 * экран съехавшим. Для карты это выглядит как поломка — интерфейс должен
 * стоять на месте, а масштабировать нужно саму 3D-сцену.
 *
 * meta viewport с user-scalable=no закрывает Android; iOS его игнорирует
 * с 10-й версии, поэтому там гасим gesture-события Safari руками.
 */
export function lockViewportScale() {
  if (typeof document === 'undefined') return () => {};

  const stop = (e) => e.preventDefault();

  /* Щипок страницы в Safari. OrbitControls работает на touch-событиях,
     поэтому зум самой сцены это не задевает. */
  document.addEventListener('gesturestart', stop, { passive: false });
  document.addEventListener('gesturechange', stop, { passive: false });
  document.addEventListener('gestureend', stop, { passive: false });

  /* Щипок в остальных браузерах — но только вне 3D-канваса: там два
     пальца это законный зум карты, а не масштаб страницы. */
  const onTouchMove = (e) => {
    if (e.touches.length < 2) return;
    if (e.target instanceof Element && e.target.closest('canvas')) return;
    e.preventDefault();
  };
  document.addEventListener('touchmove', onTouchMove, { passive: false });

  /* Двойной тап по интерфейсу. touch-action: manipulation снимает его в
     большинстве движков, этот обработчик — страховка для старых WebKit. */
  let lastTap = 0;
  const onTouchEnd = (e) => {
    const now = Date.now();
    if (now - lastTap < 320 && e.cancelable) e.preventDefault();
    lastTap = now;
  };
  document.addEventListener('touchend', onTouchEnd, { passive: false });

  return () => {
    document.removeEventListener('gesturestart', stop);
    document.removeEventListener('gesturechange', stop);
    document.removeEventListener('gestureend', stop);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  };
}

/**
 * Реальная высота вьюпорта в переменной --app-vh: на мобильных 100vh
 * считается по экрану без адресной строки, из-за чего нижний док уезжал
 * под её край. visualViewport знает фактическую высоту, в том числе при
 * открытой клавиатуре.
 */
export function trackViewportHeight() {
  if (typeof window === 'undefined') return () => {};

  const vv = window.visualViewport;
  const apply = () => {
    const h = Math.round(vv?.height ?? window.innerHeight);
    document.documentElement.style.setProperty('--app-vh', `${h}px`);
  };
  apply();

  vv?.addEventListener('resize', apply);
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);

  return () => {
    vv?.removeEventListener('resize', apply);
    window.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', apply);
  };
}
