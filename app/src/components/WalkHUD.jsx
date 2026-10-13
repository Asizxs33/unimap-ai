import { useRef, useState } from 'react';
import { SLABS, WALLS } from '../data/buildingLayout.js';
import { WALK_STAIRS, roomNumber } from '../lib/walkPhysics.js';
import '../styles/walk.css';

function HoldButton({ input, field, value, label, children, className = '' }) {
  const pressedAt = useRef(0);
  const stop = () => { if (input[field] === value) input[field] = 0; };
  return <button className={`walk-key ${className}`} aria-label={label}
    onPointerDown={event => { event.preventDefault(); pressedAt.current = performance.now(); event.currentTarget.setPointerCapture(event.pointerId); input[field] = value; }}
    onPointerUp={() => { if (performance.now() - pressedAt.current < 180) input.tap = { field, value }; stop(); }} onPointerCancel={stop} onLostPointerCapture={stop}
    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); input[field] = value; } }}
    onKeyUp={stop} onBlur={stop}>{children}</button>;
}

export default function WalkHUD({ input, status, floor, paused, info, onPause, onAction, onExit, onReset, onCloseInfo }) {
  const [mapOpen, setMapOpen] = useState(true);
  const p = status || { x: -8, z: 34, yaw: 0, label: 'Входной холл' };
  return <div className="walk-hud">
    <div className="walk-top">
      <button className="walk-back" onClick={onExit}><span aria-hidden="true">←</span> К карте</button>
      <div className="walk-location"><span>ПРОГУЛКА ПО КОРПУСУ</span><strong>{p.label}</strong><small>{floor} этаж · Учебная модель</small></div>
      <button className="walk-pause" onClick={onPause} aria-label={paused ? 'Продолжить прогулку' : 'Пауза'}>{paused ? '▶' : 'Ⅱ'}</button>
    </div>
    <aside className={`walk-minimap${mapOpen ? '' : ' collapsed'}`}>
      <button onClick={() => setMapOpen(v => !v)} aria-expanded={mapOpen}>План этажа <span>{mapOpen ? '−' : '+'}</span></button>
      {mapOpen && <>
        <svg viewBox="-63 -57 126 102" role="img" aria-label={`Ваше положение на ${floor} этаже`}>
          {SLABS.map(([x, z, w, d], i) => <rect key={i} x={x - w / 2} y={z - d / 2} width={w} height={d} fill="#f1eee4" />)}
          {WALLS.map(([x, z, w, d, , angle = 0], i) => <rect key={i} x={x - w / 2} y={z - d / 2} width={w} height={d} fill="#85928f" transform={`rotate(${-angle * 180 / Math.PI} ${x} ${z})`} />)}
          {WALK_STAIRS.map(s => <g key={s.name}><circle cx={s.x} cy={s.z} r="2.4" fill="#55979b" /><title>{s.name}</title></g>)}
          <g transform={`translate(${p.x} ${p.z}) rotate(${-p.yaw * 180 / Math.PI})`}>
            <path d="M0,-7 L-4,0 L4,0 Z" fill="#1580c9" opacity=".3" />
            <circle r="2.3" fill="#0876ba" stroke="white" strokeWidth=".8" />
            <path d="M0,-4 L-1.6,-1 L1.6,-1 Z" fill="white" />
          </g>
        </svg>
        <small><i /> Вы здесь <span>● Лестницы</span></small>
      </>}
    </aside>
    <div className="walk-crosshair" aria-hidden="true">·</div>
    {!paused && <>
      <button className={`walk-auto${p.auto ? ' active' : ''}`} aria-pressed={!!p.auto}
        onClick={() => { input.auto = !input.auto; }}>
        {p.auto ? '■ Остановить автопрогулку' : '▶ Автопрогулка'}
        <small>{p.auto ? 'Идём по текущему этажу' : 'Обойти крылья и вернуться в холл'}</small>
      </button>
      <div className="walk-interaction" aria-live="polite">
        {p.stairs ? <><strong>{p.stairs.name}</strong><div>
          {floor < 4 && <button onClick={() => onAction('interact', p)}>↑ На {floor + 1} этаж <kbd>E</kbd></button>}
          {floor > 1 && <button onClick={() => onAction('down', p)}>↓ На {floor - 1} этаж <kbd>R</kbd></button>}
        </div></> : p.exit ? <button onClick={() => onAction('interact', p)}>Выйти из здания <kbd>E</kbd></button>
          : p.room ? <button onClick={() => onAction('interact', p)}>Кабинет {roomNumber(p.room, floor)} · Подробнее <kbd>E</kbd></button>
          : <span>Двери открываются при приближении</span>}
      </div>
      <div className="walk-movement" role="group" aria-label="Движение">
        <HoldButton input={input} field="forward" value={1} label="Идти вперёд" className="walk-forward">↑</HoldButton>
        <HoldButton input={input} field="side" value={-1} label="Шаг влево" className="walk-left">←</HoldButton>
        <HoldButton input={input} field="forward" value={-1} label="Идти назад" className="walk-backward">↓</HoldButton>
        <HoldButton input={input} field="side" value={1} label="Шаг вправо" className="walk-right">→</HoldButton>
      </div>
      <div className="walk-look" role="group" aria-label="Поворот камеры">
        <HoldButton input={input} field="turn" value={1} label="Смотреть влево">↶</HoldButton>
        <HoldButton input={input} field="turn" value={-1} label="Смотреть вправо">↷</HoldButton>
      </div>
      <p className="walk-help">{p.auto ? 'WASD или стрелки движения — ручное управление · Esc — пауза' : 'WASD — идти · Shift — быстрее · Перетаскивайте вид для обзора · Esc — пауза'}</p>
    </>}
    {paused && <div className="walk-modal"><section role="dialog" aria-modal="true" aria-label="Прогулка приостановлена">
      <span className="walk-eyebrow">ВЫ ВНУТРИ ЗДАНИЯ</span><h2>Исследуйте кампус</h2>
      <p>Идите по коридорам, заходите в кабинеты и подходите к лестницам, чтобы выбрать следующий этаж.</p>
      <p>На компьютере: WASD и перетаскивание мышью. На телефоне: стрелки движения и обзор пальцем.</p>
      <button autoFocus onClick={onPause}>Продолжить прогулку</button>
      <button className="secondary" onClick={onReset}>Вернуться в холл</button>
    </section></div>}
    {info && <div className="walk-modal"><section role="dialog" aria-modal="true" aria-label="Информация о помещении">
      <span className="walk-eyebrow">{floor} ЭТАЖ</span><h2>Кабинет {roomNumber(info, floor)}</h2>
      <p>{floor === 1 && info.sub ? info.sub : 'Помещение учебного корпуса'}. Дверь открывается автоматически — можно войти и осмотреть помещение.</p>
      <button autoFocus onClick={onCloseInfo}>Продолжить осмотр</button>
    </section></div>}
  </div>;
}
