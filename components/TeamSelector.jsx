'use client';

import { useFavourites } from '@/lib/FavouritesContext';

export default function TeamSelector({ selectedTeam, onChange, showAll = true }) {
  const { favourites, updateFavourites } = useFavourites();

  if (favourites.length === 0) return null;

  return (
    <div className="team-selector-wrapper">
      {showAll && (
      <button
        className={`team-selector-all ${selectedTeam === 'all' ? 'team-selector-active-all' : ''}`}
        onClick={() => onChange('all')}
      >
        All
      </button>
      )}
      {favourites.map(t => (
        <button
          key={t.id}
          className={`team-selector-btn ${selectedTeam === String(t.id) ? 'team-selector-active' : ''}`}
          onClick={() => onChange(selectedTeam === String(t.id) ? 'all' : String(t.id))}
          title={t.shortName}
        >
          <img src={t.crest} alt={t.shortName} className="team-selector-crest" />
          <span className="team-selector-name">{t.shortName}</span>
        </button>
      ))}
    </div>
  );
}