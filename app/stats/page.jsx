'use client';

import { useEffect, useState } from 'react';
import { TEAMS } from '@/lib/teams';

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

function FormBadge({ result }) {
  const colours = { W: '#16a34a', D: '#eab308', L: '#dc2626' };
  return (
    <span className="form-badge" style={{ background: colours[result] || '#6b7280' }}>
      {result}
    </span>
  );
}

function TeamSeasonStats({ stats, team }) {
  if (!stats) return null;
  return (
    <div className="team-season-stats">
      <div className="team-season-header">
        <img src={team?.crest} alt="" className="team-season-crest" />
        <h2 className="team-season-title">Season Summary</h2>
        <div className="team-form">
          {stats.form?.map((r, i) => <FormBadge key={i} result={r} />)}
        </div>
      </div>

      {/* Record */}
      <div className="team-stats-grid">
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.played}</span>
          <span className="team-stat-label">Played</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value" style={{ color: '#16a34a' }}>{stats.wins}</span>
          <span className="team-stat-label">Won</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value" style={{ color: '#eab308' }}>{stats.draws}</span>
          <span className="team-stat-label">Drawn</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value" style={{ color: '#dc2626' }}>{stats.losses}</span>
          <span className="team-stat-label">Lost</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.goalsFor}</span>
          <span className="team-stat-label">GF</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.goalsAgainst}</span>
          <span className="team-stat-label">GA</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference}</span>
          <span className="team-stat-label">GD</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.cleanSheets}</span>
          <span className="team-stat-label">Clean Sheets</span>
        </div>
      </div>

      {/* Performance */}
      <div className="team-stats-divider">Performance Averages</div>
      <div className="team-stats-grid">
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.avgPossession}%</span>
          <span className="team-stat-label">Possession</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.avgShotsOnGoal}</span>
          <span className="team-stat-label">Shots on Target</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.avgShots}</span>
          <span className="team-stat-label">Total Shots</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.avgSaves}</span>
          <span className="team-stat-label">Saves</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.avgCorners}</span>
          <span className="team-stat-label">Corners</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{stats.avgFouls}</span>
          <span className="team-stat-label">Fouls</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value" style={{ color: '#eab308' }}>{stats.totalYellowCards}</span>
          <span className="team-stat-label">Yellow Cards</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value" style={{ color: '#dc2626' }}>{stats.totalRedCards}</span>
          <span className="team-stat-label">Red Cards</span>
        </div>
      </div>
    </div>
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
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [competition, setCompetition] = useState('all');
  const [players, setPlayers] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy] = useState('apps');

  useEffect(() => {
    if (!selectedTeam) return;
    setLoading(true);
    setError(null);
    setExpanded(null);
    setTeamStats(null);

    fetch(`/api/stats?teamId=${selectedTeam.id}&competition=${competition}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPlayers(data.players || []);
        setTeamStats(data.teamStats || null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedTeam, competition]);

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
            <h1 className="site-title">Stats</h1>
            <p className="site-subtitle">2026/27 Season</p>
          </div>
        </div>
      </header>

      {/* Team tabs */}
      <div className="stats-team-tabs">
        {TEAMS.map(t => (
          <button
            key={t.id}
            className={`stats-team-tab ${selectedTeam?.id === t.id ? 'active' : ''}`}
            style={selectedTeam?.id === t.id ? { borderBottomColor: t.color, color: t.color } : {}}
            onClick={() => {
              setSelectedTeam(t);
              setPlayers([]);
              setTeamStats(null);
              setExpanded(null);
            }}
          >
<div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
  <img src={t.crest} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
</div>            <span>{t.shortName}</span>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <div className="stats-controls">
          <div className="stats-team-name">
            <img src={selectedTeam.crest} alt="" className="stats-team-crest" />
            <span>{selectedTeam.name}</span>
          </div>
          <div className="stats-toggles">
            <button
              className={`stats-toggle ${competition === 'all' ? 'active' : ''}`}
              onClick={() => setCompetition('all')}
            >All</button>
            <button
              className={`stats-toggle ${competition === 'PL' ? 'active' : ''}`}
              onClick={() => setCompetition('PL')}
            >League</button>
          </div>
        </div>
      )}

      <div className="content">
        {loading && <p className="state-msg">Loading stats… this may take a moment on first load.</p>}
        {error && <p className="state-msg error">Could not load stats: {error}</p>}
        {!loading && !error && players.length === 0 && (
  <div className="state-msg">
    <p>No stats available yet.</p>
    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
      {selectedTeam?.competition === 'ELC'
        ? `${selectedTeam.shortName} stats will be available once the Championship season starts on 9th August.`
        : `${selectedTeam?.shortName} stats will be available once the season starts.`
      }
    </p>
  </div>
)}

        {!loading && !error && players.length > 0 && (
          <>
            <TeamSeasonStats stats={teamStats} team={selectedTeam} />

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
    </main>
  );
}