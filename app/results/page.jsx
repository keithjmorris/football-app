'use client';

import { useEffect, useState } from 'react';
import MatchCard from '@/components/MatchCard';
import MatchDetails from '@/components/MatchDetails';
import TeamFilter from '@/components/TeamFilter';

function MatchSummary({ match }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function fetchSummary() {
    if (summary) { setOpen(!open); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary('Could not generate summary.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="match-summary-wrapper">
      <button className="summary-btn" onClick={fetchSummary}>
        {open ? '▲ Hide report' : '▼ Match report'}
      </button>
      {open && (
        <div className="summary-box">
          {loading ? (
            <p className="summary-loading">Generating report…</p>
          ) : (
            <p className="summary-text">{summary}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch('/api/matches?status=FINISHED');
        if (!res.ok) throw new Error('Failed to fetch results');
        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  const filtered = matches.filter(m =>
    !selectedTeam ||
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
    <main>
      <header className="site-header">
        <div className="header-inner">
          <span className="trophy">🏆</span>
          <div>
            <h1 className="site-title">Results</h1>
            <p className="site-subtitle">World Cup 2026</p>
          </div>
        </div>
      </header>

      <TeamFilter matches={matches} selectedTeam={selectedTeam} onChange={setSelectedTeam} />

      <div className="content">
        {loading && <p className="state-msg">Loading results…</p>}
        {error && <p className="state-msg error">Could not load results: {error}</p>}
        {!loading && !error && matches.length === 0 && (
          <p className="state-msg">No results yet — the tournament hasn't started!</p>
        )}
        {!loading && !error && Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dayMatches]) => (
            <section key={date} className="day-group">
              <h2 className="day-label">
                {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })}
              </h2>
              <div className="match-list">
                {dayMatches.map(match => (
                  <div key={match.id} className="match-block">
                    <MatchCard match={match} />
                    <MatchSummary match={match} />
                    <MatchDetails match={match} />
                  </div>
                ))}
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}