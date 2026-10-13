import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * Шторка снизу экрана в стиле 2ГИС/Яндекс.Карт: три состояния высоты
 * (peek/half/full), между которыми можно тянуть за хэндл пальцем/мышью,
 * с довдором до ближайшей точки при отпускании — а не произвольная
 * высота, за которую бы отвечал сам палец.
 *
 * Высоты заданы в пикселях видимой части снизу (а не в vh) — так
 * peek-высота не плывёт при появлении/скрытии адресной строки на
 * мобильных, самый частый источник дёрганых bottom sheet в вебе.
 *
 * Сама peek-высота подгоняется под содержимое: она тянется до нижней
 * границы последней целиком помещающейся карточки. Раньше здесь было
 * фиксированное число, и первая же строка списка обрезалась ровно
 * посередине — выглядело как поехавшая вёрстка, а не как «потяни выше».
 */
const SNAPS = { peek: 'peek', half: 'half', full: 'full' };

export default function BottomSheet({
  snap, onSnapChange, peekHeight = 132, children, className = '',
}) {
  const elRef = useRef(null);
  const bodyRef = useRef(null);
  const dragRef = useRef(null); // { startY, startH, active }
  const [fitPeek, setFitPeek] = useState(peekHeight);

  const heightFor = useCallback((s) => {
    const vh = window.innerHeight;
    if (s === SNAPS.full) return Math.round(vh * 0.92);
    if (s === SNAPS.half) return Math.round(vh * 0.52);
    return fitPeek;
  }, [fitPeek]);

  /* Считаем peek-высоту от реального содержимого: берём нижнюю кромку
     последнего элемента, который целиком влезает в разумный лимит
     (42% экрана), плюс небольшой отступ. Так шторка всегда обрывается
     по границе карточки, а не поперёк неё. */
  const measurePeek = useCallback(() => {
    const el = elRef.current;
    const body = bodyRef.current;
    const inner = body?.firstElementChild;
    if (!el || !body || !inner) return;
    if (body.scrollTop) body.scrollTop = 0;

    /* Потолок: 42% экрана, но не выше 340px — на высоких экранах доля
       от высоты превращала «краешек» в полэкрана карточек. */
    const limit = Math.max(peekHeight, Math.min(Math.round(window.innerHeight * 0.42), 340));
    const top = el.getBoundingClientRect().top;
    const PAD = 14; // воздух под последней карточкой

    const kids = [...inner.children];
    let next = peekHeight;
    for (let i = 0; i < kids.length; i += 1) {
      const kid = kids[i];
      const bottom = Math.ceil(kid.getBoundingClientRect().bottom - top);
      /* Резать сразу под заголовком раздела нельзя: получится «шапка без
         списка». Такой элемент пропускаем — граница уедет на карточку. */
      const isHeading = kid.tagName === 'H3' || kid.classList.contains('sheet-section-row');
      const after = kids[i + 1];
      /* Не даём следующей карточке заглянуть краем: если отступ съедает
         её верх, обрываем ровно по её началу. */
      const nextTop = after ? Math.floor(after.getBoundingClientRect().top - top) : Infinity;
      const cut = Math.min(bottom + PAD, nextTop);
      if (cut > limit) break;
      if (!isHeading) next = Math.max(next, cut);
    }
    setFitPeek((prev) => (Math.abs(prev - next) > 1 ? next : prev));
  }, [peekHeight]);

  /* Пересчитываем при смене содержимого шторки и при его перекомпоновке
     (шрифты, длинные названия в две строки, поворот экрана). */
  useLayoutEffect(() => {
    measurePeek();
    const inner = bodyRef.current?.firstElementChild;
    if (!inner || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measurePeek());
    ro.observe(inner);
    return () => ro.disconnect();
  }, [children, className, measurePeek]);

  /* Применяем высоту императивно во время драга — через React на каждый
     pointermove гоняли бы reconciler впустую 60 раз в секунду */
  const setH = useCallback((px) => {
    if (elRef.current) elRef.current.style.height = `${px}px`;
  }, []);

  useEffect(() => {
    if (dragRef.current?.active) return; // не перебиваем активный драг
    setH(heightFor(snap));
  }, [snap, heightFor, setH]);

  useEffect(() => {
    const onResize = () => {
      measurePeek();
      if (!dragRef.current?.active) setH(heightFor(snap));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [snap, heightFor, setH, measurePeek]);

  const onPointerDown = useCallback((e) => {
    const startH = elRef.current?.getBoundingClientRect().height ?? heightFor(snap);
    dragRef.current = { startY: e.clientY, startH, active: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [snap, heightFor]);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d?.active) return;
    const dy = e.clientY - d.startY;              // вниз — положительно
    const next = Math.min(heightFor(SNAPS.full), Math.max(64, d.startH - dy));
    setH(next);
  }, [heightFor, setH]);

  const endDrag = useCallback(() => {
    const d = dragRef.current;
    if (!d?.active) return;
    dragRef.current = null;
    const current = elRef.current?.getBoundingClientRect().height ?? 0;
    const targets = [
      [SNAPS.peek, heightFor(SNAPS.peek)],
      [SNAPS.half, heightFor(SNAPS.half)],
      [SNAPS.full, heightFor(SNAPS.full)],
    ];
    let best = targets[0];
    for (const t of targets) if (Math.abs(t[1] - current) < Math.abs(best[1] - current)) best = t;
    onSnapChange(best[0]);
    setH(best[1]);
  }, [heightFor, onSnapChange, setH]);

  const handleProps = useMemo(() => ({
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }), [onPointerDown, onPointerMove, endDrag]);

  return (
    <div ref={elRef} className={`sheet ${snap} ${className}`} style={{ height: fitPeek }}>
      <button
        type="button"
        className="sheet-handle"
        aria-label="Потянуть, чтобы изменить размер панели"
        {...handleProps}
      >
        <span className="sheet-handle-bar" />
      </button>
      <div className="sheet-body" ref={bodyRef}>{children}</div>
    </div>
  );
}

export { SNAPS };
