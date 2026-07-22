'use client';

import { useEffect, useState } from 'react';
import MatchCard from '@/components/MatchCard';
import TabBar from '@/components/TabBar';
import TeamFilter from '@/components/TeamFilter';

const STAGES = ['All', 'Group Stage', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

export default function FixturesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStage, setActiveStage] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch('/api/matches');
        if (!res.ok) throw new Error('Failed to fetch matches');
        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  const stageMap = {
    'Group Stage': 'GROUP_STAGE',
    'Round of 16': 'LAST_16',
    'Quarter-finals': 'QUARTER_FINALS',
    'Semi-finals': 'SEMI_FINALS',
    'Final': 'FINAL',
  };

  const filtered = matches
    .filter(m => activeStage === 'All' || m.stage === stageMap[activeStage])
    .filter(m => !selectedTeam || 
      m.homeTeam?.shortName === selectedTeam || 
      m.awayTeam?.shortName === selectedTeam ||
      m.homeTeam?.name === selectedTeam ||
      m.awayTeam?.name === selectedTeam
    );

  const grouped = filtered.reduce((acc, match) => {
    const date = match.utcDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  return (
    <main className="page">
      <header className="site-header">
        <div className="header-inner">
          <span className="trophy">🏆</span>
          <div>
            <h1 className="site-title">World Cup 2026</h1>
            <p className="site-subtitle">USA · Canada · Mexico</p>
          </div>
        </div>
      </header>

      <TabBar tabs={STAGES} active={activeStage} onChange={setActiveStage} />
      <TeamFilter matches={matches} selectedTeam={selectedTeam} onChange={setSelectedTeam} />

      <div className="content">
        {loading && <p className="state-msg">Loading fixtures…</p>}
        {error && <p className="state-msg error">Could not load fixtures: {error}</p>}
        {!loading && !error && Object.keys(grouped).length === 0 && (
          <p className="state-msg">No matches found.</p>
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