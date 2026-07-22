'use client';

import { useEffect, useState } from 'react';
import { TEAMS } from '@/lib/teams';
import TeamSelector from '@/components/TeamSelector';

function StatBadge({ value, type }) {
  if (!value) return <span className="stat-zero">—</span>;
  const colours = {
    goal: '#16a34a',
    assist: '#2563eb',
    yellow: '#eab308',
    red: '#dc2626',
  };
  return (
    <span className="stat-badge" style={{ background: colours[type] || '#6b7280' }}>
      {value}
    </span>
  );
}

function PlayerRow({ player, isExpanded, onToggle }) {
  const apps = player.starts + player.subApps;
  return (
    <>
      <tr
        className={`player-row ${isExpanded ? 'player-row-expanded' : ''}`}
        onClick={onToggle}
      >
        <td className="player-name-col">
          <span className="player-name">{player.name}</span>
          <span className="player-position">{player.position}</span>
        </td>
        <td>{apps}</td>
        <td>{player.starts}</td>
        <td>{player.subApps}</td>
        <td>{Math.round(player.minutesPlayed)}'</td>
        <td><StatBadge value={player.goals} type="goal" /></td>
        <td><StatBadge value={player.assists} type="assist" /></td>
        <td><StatBadge value={player.yellowCards} type="yellow" /></td>
        <td><StatBadge value={player.redCards} type="red" /></td>
        <td className="expand-col">{isExpanded ? '▲' : '▼'}</td>
      </tr>
      {isExpanded && (
        <tr className="player-detail-row">
          <td colSpan="10">
            <div className="player-matches">
              <table className="player-match-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Opponent</th>
                    <th>H/A</th>
                    <th>Score</th>
                    <th>Comp</th>
                    <th>Mins</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {player.matches
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((m, i) => (
                      <tr key={i}>
                        <td>{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                        <td>{m.opponent}</td>
                        <td>{m.homeAway}</td>
                        <td>{m.score}</td>
                        <td>{m.competition}</td>
                        <td>{Math.round(m.minutesPlayed)}'</td>
                        <td>{m.started ? 'Start' : `Sub ${m.cameOnMinute}'`}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function StatsPage() {
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [competition, setCompetition] = useState('all');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy] = useState('apps');

  useEffect(() => {
    if (selectedTeam === 'all') {
      setPlayers([]);
      return;
    }
    setLoading(true);
    setError(null);
    setExpanded(null);

    fetch(`/api/stats?teamId=${selectedTeam}&competition=${competition}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPlayers(data.players || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedTeam, competition]);

  const team = TEAMS.find(t => String(t.id) === selectedTeam);

  const sorted = [...players].sort((a, b) => {
    if (sortBy === 'apps') return (b.starts + b.subApps) - (a.starts + a.subApps);
    if (sortBy === 'goals') return b.goals - a.goals;
    if (sortBy === 'assists') return b.assists - a.assists;
    if (sortBy === 'minutes') return b.minutesPlayed - a.minutesPlayed;
    if (sortBy === 'cards') return (b.yellowCards + b.redCards) - (a.yellowCards + a.redCards);
    return 0;
  });

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
            <h1 className="site-title">Player Stats</h1>
            <p className="site-subtitle">2026/27 Season</p>
          </div>
        </div>
      </header>

      <TeamSelector
        selectedTeam={selectedTeam}
        onChange={val => {
          setSelectedTeam(val);
          setPlayers([]);
        }}
      />

      {selectedTeam === 'all' ? (
        <div className="content">
          <p className="state-msg">Select a team above to view player statistics.</p>
        </div>
      ) : (
        <>
          <div className="stats-controls">
            <div className="stats-team-name">
              {team?.crest && <img src={team.crest} alt="" className="stats-team-crest" />}
              <span>{team?.name}</span>
            </div>
            <div className="stats-toggles">
              <button
                className={`stats-toggle ${competition === 'all' ? 'active' : ''}`}
                onClick={() => setCompetition('all')}
              >
                All
              </button>
              <button
                className={`stats-toggle ${competition === 'PL' ? 'active' : ''}`}
                onClick={() => setCompetition('PL')}
              >
                League
              </button>
            </div>
          </div>

          <div className="content">
            {loading && (
              <p className="state-msg">Loading player stats… this may take a moment on first load.</p>
            )}
            {error && <p className="state-msg error">Could not load stats: {error}</p>}
            {!loading && !error && players.length === 0 && (
              <p className="state-msg">No stats available yet — check back once matches have been played.</p>
            )}
            {!loading && !error && players.length > 0 && (
              <>
                <div className="sort-controls">
                  <span className="sort-label">Sort by:</span>
                  {[
                    { key: 'apps', label: 'Apps' },
                    { key: 'goals', label: 'Goals' },
                    { key: 'assists', label: 'Assists' },
                    { key: 'minutes', label: 'Minutes' },
                    { key: 'cards', label: 'Cards' },
                  ].map(s => (
                    <button
                      key={s.key}
                      className={`sort-btn ${sortBy === s.key ? 'active' : ''}`}
                      onClick={() => setSortBy(s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="stats-table-wrapper">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th className="player-name-col">Player</th>
                        <th title="Appearances">App</th>
                        <th title="Starts">Sta</th>
                        <th title="Sub appearances">Sub</th>
                        <th title="Minutes played">Min</th>
                        <th title="Goals">⚽</th>
                        <th title="Assists">🅰️</th>
                        <th title="Yellow cards">🟨</th>
                        <th title="Red cards">🟥</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(player => (
                        <PlayerRow
                          key={player.id}
                          player={player}
                          isExpanded={expanded === player.id}
                          onToggle={() => setExpanded(expanded === player.id ? null : player.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}