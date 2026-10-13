import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHAT_REPLIES, CHAT_SUGGESTIONS } from '../data/schedule.js';
import { PLACE_BY_ID, searchPlaces } from '../data/catalog.js';
import { useApp } from '../state/AppState.jsx';

/** Подбираем ответ: сначала по ключевым словам, затем поиском по справочнику */
function answer(question) {
  const q = question.toLowerCase();
  for (const r of CHAT_REPLIES) {
    if (r.match.some((m) => q.includes(m))) return { text: r.text, room: r.room };
  }
  const found = searchPlaces(question, 1)[0];
  if (found) {
    return {
      text: `${found.name}${found.number ? ` — кабинет ${found.number}` : ''}, ${found.wing}.${found.note ? ` ${found.note}.` : ''}`,
      room: found.id,
    };
  }
  return {
    text: 'Не нашёл такого места на первом этаже. Попробуйте номер кабинета — например «105» — или напишите, что вам нужно: столовая, туалет, библиотека, деканат.',
    room: null,
  };
}

export default function AiChat() {
  const [messages, setMessages] = useState([
    { who: 'bot', text: 'Здравствуйте! Спросите, где находится кабинет или нужное место — подскажу и построю маршрут.' },
  ]);
  const [text, setText] = useState('');
  const { navigateTo } = useApp();
  const nav = useNavigate();
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (value) => {
    const q = (value ?? text).trim();
    if (!q) return;
    const a = answer(q);
    setMessages((m) => [...m, { who: 'me', text: q }, { who: 'bot', ...a }]);
    setText('');
  };

  const openOnMap = (id) => { navigateTo(id); nav('/map'); };

  return (
    <div className="screen chat-screen">
      <header className="screen-head">
        <div>
          <h1>ИИ-чат</h1>
          <p>Подскажет кабинет и построит маршрут</p>
        </div>
      </header>

      <div className="chat-log">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.who}`}>
            {m.who === 'bot' && <span className="icon bubble-avatar">psychology</span>}
            <div className="bubble-body">
              <p>{m.text}</p>
              {m.room && PLACE_BY_ID[m.room] && (
                <div className="bubble-actions">
                  <button className="bubble-action" onClick={() => { navigateTo(m.room, m.room); nav('/map'); }}>
                    <span className="icon">visibility</span> Показать кабинет
                  </button>
                  <button className="bubble-action primary" onClick={() => { navigateTo(m.room, 'entrance'); nav('/map'); }}>
                    <span className="icon">fork_right</span> Маршрут от входа
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="chat-suggest">
        {CHAT_SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Например: где столовая?"
        />
        <button className="icon-btn primary" onClick={() => send()} title="Отправить">
          <span className="icon">send</span>
        </button>
      </div>
    </div>
  );
}
