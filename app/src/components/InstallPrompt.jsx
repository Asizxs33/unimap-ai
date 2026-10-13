import { useEffect, useState } from 'react';

/**
 * Предложение установить приложение на устройство.
 *
 * Это и есть ответ на «чтобы все могли пользоваться»: сайт ставится
 * иконкой на телефон и на компьютер бесплатно, без маркета и модерации.
 * Показываем только когда браузер сам сообщил о готовности — иначе
 * кнопка была бы обманом.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem('unimap.installDismissed') === '1'; }
    catch { return false; }
  });

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();       // показываем своё окно, а не браузерное
      setDeferred(e);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferred || hidden) return null;

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem('unimap.installDismissed', '1'); } catch { /* приватный режим */ }
  };

  return (
    <div className="install-bar">
      <span className="icon">install_mobile</span>
      <div className="install-bar-text">
        <strong>Установить UniMap AI</strong>
        <em>Иконка на экране, работает без интернета</em>
      </div>
      <button className="btn btn-sand" onClick={install}>Установить</button>
      <button className="icon-btn" onClick={dismiss} aria-label="Скрыть предложение">
        <span className="icon">close</span>
      </button>
    </div>
  );
}
