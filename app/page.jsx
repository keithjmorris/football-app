'use client';

import { useEffect, useState } from 'react';
import { TEAMS } from '@/lib/teams';
import MatchCard from '@/components/MatchCard';

export default function FixturesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');

  useEffect(() => {
    async function fetchMatches() {
      try {
        const url = selectedTeam === 'all'
          ? '/api/matches'
          : `/api/matches?teamId=${selectedTeam}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch matches');
        const data = await res.json();
        const upcoming = (data.matches || []).filter(
          m => m.status !== 'FINISHED' && m.status !== 'AWARDED' && m.status !== 'CANCELLED'
        );
        setMatches(upcoming);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [selectedTeam]);

  const grouped = matches.reduce((acc, match) => {
    const date = match.utcDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-crests">
            {TEAMS.map(t => (
              <img key={t.id} src={t.crest} alt={t.shortName} className="header-crest" />
            ))}
          </div>
          <div>
            <h1 className="site-title">Football Tracker</h1>
            <p className="site-subtitle">2026/27 Season</p>
          </div>
        </div>
      </header>

      <div className="team-filter-wrapper">
        <select
          className="team-filter-select"
          value={selectedTeam}
          onChange={e => {
            setSelectedTeam(e.target.value);
            setLoading(true);
            setMatches([]);
          }}
        >
          <option value="all">All Teams</option>
          {TEAMS.map(t => (
            <option key={t.id} value={t.id}>{t.shortName}</option>
          ))}
        </select>
      </div>

      <div className="content">
        {loading && <p className="state-msg">Loading fixtures…</p>}
        {error && <p className="state-msg error">Could not load fixtures: {error}</p>}
        {!loading && !error && matches.length === 0 && (
          <p className="state-msg">No upcoming fixtures found.</p>
        )}
        {!loading && !error && Object.entries(grouped).sort().map(([date, dayMatches]) => (
          <section key={date} className="day-group">
            <h2 className="day-label">
              {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </h2>
            <div className="match-list">
              {dayMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}