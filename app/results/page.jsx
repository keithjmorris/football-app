'use client';

import { useEffect, useState } from 'react';
import { TEAMS } from '@/lib/teams';
import MatchCard from '@/components/MatchCard';
import TeamSelector from '@/components/TeamSelector';
import MatchDetails from '@/components/MatchDetails';

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
          {loading
            ? <p className="summary-loading">Generating report…</p>
            : <p className="summary-text">{summary}</p>
          }
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');

  useEffect(() => {
    async function fetchResults() {
      setError(null);
      setMatches([]);
      try {
        const teamIds = TEAMS.map(t => t.id);
        const url = selectedTeam === 'all'
          ? `/api/matches?teamIds=${teamIds.join(',')}&status=FINISHED&season=2025`
          : `/api/matches?teamId=${selectedTeam}&status=FINISHED&season=2025`;

        const cupUrl = selectedTeam === 'all'
          ? `/api/cups?teamIds=${teamIds.join(',')}&status=FINISHED`
          : `/api/cups?teamIds=${selectedTeam}&status=FINISHED`;

        const [leagueRes, cupRes] = await Promise.all([
          fetch(url),
          fetch(cupUrl),
        ]);

        const leagueData = await leagueRes.json();
        const cupData = await cupRes.json();

        const allMatches = [
          ...(leagueData.matches || []),
          ...(cupData.matches || []),
        ].sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));

        setMatches(allMatches);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
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
            <h1 className="site-title">Results</h1>
            <p className="site-subtitle">2026/27 Season</p>
          </div>
        </div>
      </header>

      <TeamSelector
        selectedTeam={selectedTeam}
        showAll={false}
        onChange={val => {
          setSelectedTeam(val);
          setLoading(true);
          setMatches([]);
        }}
      />

      <div className="content">
        {loading && <p className="state-msg">Loading results…</p>}
        {error && <p className="state-msg error">Could not load results: {error}</p>}
        {!loading && !error && matches.length === 0 && (
          <p className="state-msg">No results yet — the season hasn't started!</p>
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