import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { searchPlaces } from '../data/catalog.js';

/**
 * Поле поиска помещения с живыми подсказками.
 *
 * Список рисуется через портал в <body> с position: fixed — иначе прокручиваемая
 * боковая панель обрезала его, а на телефоне он уходил за нижний край экрана.
 * Стрелки — выбор, Enter — подтвердить, Esc — закрыть.
 */
export default function PlaceSearch({
  value, onChange, onSelect, placeholder, autoFocus, icon = 'search', onFocus,
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [rect, setRect] = useState(null);
  const boxRef = useRef(null);
  const popRef = useRef(null);
  const listId = useId();

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const speechSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const toggleSpeech = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = 'ru-RU';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => { setListening(true); };
      rec.onend = () => { setListening(false); };
      rec.onerror = () => { setListening(false); };
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        const cleaned = text.replace(/\.$/, '');
        onChange(cleaned);
        setOpen(true);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setListening(false);
    }
  };

  const results = useMemo(() => searchPlaces(value), [value]);
  useEffect(() => { setCursor(0); }, [value]);

  /* Список кладём под поле, а если внизу мало места — над ним */
  const place = useCallback(() => {
    const el = boxRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const rows = Math.min(results.length, 6);
    const need = rows * 54 + 12;
    const below = window.innerHeight - b.bottom - 12;
    const above = b.top - 12;
    const flip = below < need && above > below;
    setRect({
      left: b.left,
      width: b.width,
      top: flip ? Math.max(8, b.top - Math.min(need, above) - 6) : b.bottom + 6,
      maxHeight: Math.max(120, Math.min(need, flip ? above : below)),
    });
  }, [results.length]);

  useLayoutEffect(() => { if (open) place(); }, [open, place, value]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => place();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, place]);

  /* Клик мимо поля и списка — закрываем */
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const choose = (p) => {
    if (!p) return;
    onChange(p.number ? `${p.number} · ${p.name}` : p.name);
    onSelect?.(p.id);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open || !results.length) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (c + 1) % results.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (c - 1 + results.length) % results.length); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[cursor]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  const showList = open && results.length > 0 && rect;
  const showEmpty = open && !!value.trim() && results.length === 0 && rect;

  return (
    <div className="field" ref={boxRef}>
      <span className="icon field-icon">{icon}</span>
      <input
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { setOpen(true); onFocus?.(); }}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          className="field-clear"
          aria-label="Очистить поле"
          onClick={() => { onChange(''); onSelect?.(null); setOpen(false); }}
        >
          <span className="icon">close</span>
        </button>
      )}
      {speechSupported && (
        <button
          type="button"
          className={`field-mic${listening ? ' listening' : ''}${value ? ' shifted' : ''}`}
          aria-label="Голосовой поиск"
          onClick={toggleSpeech}
        >
          {listening ? (
            <div className="mic-soundwave">
              <span className="mic-bar" />
              <span className="mic-bar" />
              <span className="mic-bar" />
              <span className="mic-bar" />
            </div>
          ) : (
            <span className="icon">mic</span>
          )}
        </button>
      )}

      {(showList || showEmpty) && createPortal(
        <div
          ref={popRef}
          className="suggest"
          style={{ left: rect.left, top: rect.top, width: rect.width, maxHeight: rect.maxHeight }}
        >
          {showList ? (
            <ul id={listId} role="listbox">
              {results.map((p, i) => (
                <li key={p.id} role="option" aria-selected={i === cursor}>
                  <button
                    type="button"
                    className={`suggest-row${i === cursor ? ' on' : ''}`}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => choose(p)}
                  >
                    <span className="plate small" data-cat={p.cat}>
                      {p.number || <span className="icon">{p.icon}</span>}
                    </span>
                    <span className="suggest-text">
                      <strong>{p.name}</strong>
                      <em>{p.wing}{p.note ? ` · ${p.note}` : ''}</em>
                    </span>
                    <span className="icon suggest-go">arrow_outward</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="suggest-empty">
              Нет совпадений с «{value}». Попробуйте номер кабинета или назначение — столовая, санузел, библиотека.
            </p>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
