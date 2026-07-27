'use client';

import { TEAMS } from '@/lib/teams';

export default function TeamSelector({ selectedTeam, onChange, showAll = true }) {
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
      {TEAMS.map(t => (
        <button
          key={t.id}
          className={`team-selector-btn ${selectedTeam === String(t.id) ? 'team-selector-active' : ''}`}
          onClick={() => onChange(selectedTeam === String(t.id) ? 'all' : String(t.id))}
          title={t.shortName}
        >
          <div style={{ width: 28, height: 28, flexShrink: 0, overflow: 'hidden' }}>
            <img
              src={t.crest}
              alt={t.shortName}
              style={{ width: '100%', height: '100%', objectFit: 'contain', maxWidth: 28, maxHeight: 28 }}
            />
          </div>
          <span className="team-selector-name">{t.shortName}</span>
        </button>
      ))}
    </div>
  );
}