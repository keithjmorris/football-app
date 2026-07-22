'use client';

import { useState, useEffect } from 'react';
import { PL_TEAMS } from '@/lib/allTeams';

const MAX_FAVOURITES = 3;

export default function TeamPicker({ onSave }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('fc_favourites');
    if (saved) setSelected(JSON.parse(saved));
  }, []);

  function toggleTeam(team) {
    setSelected(prev => {
      if (prev.find(t => t.id === team.id)) {
        return prev.filter(t => t.id !== team.id);
      }
      if (prev.length >= MAX_FAVOURITES) return prev;
      return [...prev, team];
    });
  }

  function handleSave() {
    localStorage.setItem('fc_favourites', JSON.stringify(selected));
    onSave(selected);
  }

  const filtered = PL_TEAMS.filter(t =>
    t.shortName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="picker-overlay">
      <div className="picker-modal">
        <div className="picker-header">
          <h2 className="picker-title">Choose Your Teams</h2>
          <p className="picker-subtitle">
            Pick up to {MAX_FAVOURITES} teams to follow.
            {selected.length > 0 && ` ${selected.length}/${MAX_FAVOURITES} selected.`}
          </p>
        </div>

        <input
          className="picker-search"
          type="text"
          placeholder="Search teams…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        <div className="picker-grid">
          {filtered.map(team => {
            const isSelected = selected.some(t => t.id === team.id);
            const isDisabled = !isSelected && selected.length >= MAX_FAVOURITES;
            return (
              <button
                key={team.id}
                className={`picker-team ${isSelected ? 'picker-selected' : ''} ${isDisabled ? 'picker-disabled' : ''}`}
                onClick={() => toggleTeam(team)}
                disabled={isDisabled}
              >
                <img src={team.crest} alt={team.shortName} className="picker-crest" />
                <span className="picker-name">{team.shortName}</span>
                {isSelected && <span className="picker-check">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="picker-footer">
          <div className="picker-selected-crests">
            {selected.map(t => (
              <img key={t.id} src={t.crest} alt={t.shortName} className="picker-selected-crest" />
            ))}
          </div>
          <button
            className="picker-save"
            onClick={handleSave}
            disabled={selected.length === 0}
          >
            {selected.length === 0 ? 'Select a team to continue' : `Follow ${selected.length} team${selected.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}