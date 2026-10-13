import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, PLACES, PLACE_BY_ID, searchPlaces } from '../data/catalog.js';
import { useApp } from '../state/AppState.jsx';
import PlaceSearch from '../components/PlaceSearch.jsx';

export default function Search() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState(null);
  const { navigateTo, favorites, toggleFavorite, recent } = useApp();
  const nav = useNavigate();

  const results = useMemo(() => {
    if (query.trim()) return searchPlaces(query, 40);
    return cat ? PLACES.filter((p) => p.cat === cat) : [];
  }, [query, cat]);

  const go = (id) => { navigateTo(id); nav('/map'); };

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <h1>Поиск помещений</h1>
          <p>{PLACES.length} помещений на 1–4 этажах</p>
        </div>
      </header>

      <div className="screen-body">
        <PlaceSearch
          value={query}
          onChange={setQuery}
          onSelect={(id) => id && go(id)}
          placeholder="Номер, название или «где поесть»"
          autoFocus
        />

        <div className="chips">
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <button
              key={key}
              className={`chip${cat === key ? ' on' : ''}`}
              onClick={() => { setCat(cat === key ? null : key); setQuery(''); }}
            >
              <span className="icon" style={{ fontSize: 16 }}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {!query && !cat && recent.length > 0 && (
          <section>
            <h2 className="section-title">Недавнее</h2>
            <div className="list">
              {recent.map((id) => PLACE_BY_ID[id] && (
                <PlaceRow key={id} place={PLACE_BY_ID[id]} onGo={go}
                          fav={favorites.includes(id)} onFav={toggleFavorite} />
              ))}
            </div>
          </section>
        )}

        {!query && !cat && favorites.length > 0 && (
          <section>
            <h2 className="section-title">Избранное</h2>
            <div className="list">
              {favorites.map((id) => PLACE_BY_ID[id] && (
                <PlaceRow key={id} place={PLACE_BY_ID[id]} onGo={go} fav onFav={toggleFavorite} />
              ))}
            </div>
          </section>
        )}

        {(query || cat) && (
          <section>
            <h2 className="section-title">
              {results.length ? `Найдено: ${results.length}` : 'Ничего не найдено'}
            </h2>
            <div className="list">
              {results.map((p) => (
                <PlaceRow key={p.id} place={p} onGo={go}
                          fav={favorites.includes(p.id)} onFav={toggleFavorite} />
              ))}
            </div>
          </section>
        )}

        {!query && !cat && (
          <section>
            <h2 className="section-title">Все помещения</h2>
            <div className="list">
              {PLACES.map((p) => (
                <PlaceRow key={p.id} place={p} onGo={go}
                          fav={favorites.includes(p.id)} onFav={toggleFavorite} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export function PlaceRow({ place, onGo, fav, onFav }) {
  return (
    <div className="place-row">
      <span className="plate" data-cat={place.cat}>
        {place.number || <span className="icon">{place.icon}</span>}
      </span>
      <button className="place-main" onClick={() => onGo(place.id)}>
        <strong>{place.name}</strong>
        <span>{place.wing}{place.note ? ` · ${place.note}` : ''}</span>
      </button>
      {onFav && (
        <button
          className={`icon-btn${fav ? ' on' : ''}`}
          title={fav ? 'Убрать из избранного' : 'В избранное'}
          onClick={() => onFav(place.id)}
        >
          <span className="icon">{fav ? 'star' : 'star_border'}</span>
        </button>
      )}
      <button className="icon-btn primary" title="Маршрут" onClick={() => onGo(place.id)}>
        <span className="icon">navigation</span>
      </button>
    </div>
  );
}
