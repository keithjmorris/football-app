'use client';

import { useEffect, useState, useRef } from 'react';
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
                        <td>{(() => {
                          try {
                            const cleaned = String(m.date).replace(/(\d+)(st|nd|rd|th)/i, '$1').trim();
                            const withYear = cleaned.includes('2025') || cleaned.includes('2026') ? cleaned : cleaned + ' 2025';
                            const d = new Date(withYear);
                            return isNaN(d.getTime()) ? m.date : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                          } catch { return m.date; }
                        })()}</td>
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

function aggregateTeamStats(teamMatchStats) {
  const count = teamMatchStats.length;
  if (count === 0) return null;

  const totals = teamMatchStats.reduce((acc, m) => ({
    wins: acc.wins + (m.result === 'W' ? 1 : 0),
    draws: acc.draws + (m.result === 'D' ? 1 : 0),
    losses: acc.losses + (m.result === 'L' ? 1 : 0),
    goalsFor: acc.goalsFor + m.goalsFor,
    goalsAgainst: acc.goalsAgainst + m.goalsAgainst,
    cleanSheets: acc.cleanSheets + (m.cleanSheet ? 1 : 0),
    possession: acc.possession + m.possession,
    shotsOnGoal: acc.shotsOnGoal + m.shotsOnGoal,
    shotsOffGoal: acc.shotsOffGoal + m.shotsOffGoal,
    shots: acc.shots + m.shots,
    saves: acc.saves + m.saves,
    corners: acc.corners + m.corners,
    fouls: acc.fouls + m.fouls,
    yellowCards: acc.yellowCards + m.yellowCards,
    redCards: acc.redCards + m.redCards,
  }), {
    wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, cleanSheets: 0,
    possession: 0, shotsOnGoal: 0, shotsOffGoal: 0,
    shots: 0, saves: 0, corners: 0, fouls: 0,
    yellowCards: 0, redCards: 0,
  });

  const form = [...teamMatchStats]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(m => m.result)
    .reverse();

  return {
    played: count,
    wins: totals.wins,
    draws: totals.draws,
    losses: totals.losses,
    goalsFor: totals.goalsFor,
    goalsAgainst: totals.goalsAgainst,
    goalDifference: totals.goalsFor - totals.goalsAgainst,
    cleanSheets: totals.cleanSheets,
    points: totals.wins * 3 + totals.draws,
    pointsPerGame: ((totals.wins * 3 + totals.draws) / count).toFixed(2),
    avgPossession: Math.round(totals.possession / count),
    avgShotsOnGoal: (totals.shotsOnGoal / count).toFixed(1),
    avgShots: (totals.shots / count).toFixed(1),
    avgSaves: (totals.saves / count).toFixed(1),
    avgCorners: (totals.corners / count).toFixed(1),
    avgFouls: (totals.fouls / count).toFixed(1),
    totalYellowCards: totals.yellowCards,
    totalRedCards: totals.redCards,
    form,
  };
}

export default function StatsPage() {
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [season, setSeason] = useState('2026');
  const [competition, setCompetition] = useState('all');
  const [players, setPlayers] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy] = useState('apps');
  const rawDataCache = useRef({});

  useEffect(() => {
    if (!selectedTeam) return;
    setLoading(true);
    setError(null);
    setExpanded(null);
    setTeamStats(null);
    setPlayers([]);

    async function loadStats() {
      try {
        const cacheKey = `${selectedTeam.id}_${season}`;

        if (rawDataCache.current[cacheKey]) {
          applyFilter(rawDataCache.current[cacheKey]);
          return;
        }

        const localKey = `stats_${selectedTeam.id}_${season}`;
        const cached = localStorage.getItem(localKey);

        if (cached) {
          const parsed = JSON.parse(cached);
          const isHistorical = season !== '2026';
          const cacheAge = Date.now() - parsed.timestamp;
          const maxAge = isHistorical ? Infinity : 24 * 60 * 60 * 1000;

          if (cacheAge < maxAge) {
            rawDataCache.current[cacheKey] = parsed.data;
            applyFilter(parsed.data);
            return;
          }
        }

        const { db } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'player_stats', `raw_${selectedTeam.id}_${season}`);
        const docSnap = await getDoc(docRef);

        let data = { playerStats: {}, teamMatchStats: [] };

        if (docSnap.exists()) {
          const docData = docSnap.data();
          data = {
            playerStats: docData.playerStats || {},
            teamMatchStats: docData.teamMatchStats || [],
          };
        }

        rawDataCache.current[cacheKey] = data;
        try {
          localStorage.setItem(localKey, JSON.stringify({
            data,
            timestamp: Date.now(),
          }));
        } catch (e) {
          console.warn('localStorage full, skipping cache');
        }

        applyFilter(data);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    function applyFilter({ playerStats, teamMatchStats }) {
      let players = Object.values(playerStats);
      let matchStats = [...teamMatchStats];

      if (competition !== 'all') {
        const compCodes = competition === 'CL' ? ['CL'] :
                          competition === 'PL' ? ['PL'] :
                          competition === 'ELC' ? ['ELC'] :
                          competition === 'LEAGUE' ? ['PL', 'ELC', 'EL1', 'EL2'] : null;
        if (compCodes) {
          players = players.map(p => {
            const compMatches = p.matches.filter(m => compCodes.includes(m.competition));
            if (compMatches.length === 0) return null;
            return {
              ...p,
              matches: compMatches,
              starts: compMatches.filter(m => m.started).length,
              subApps: compMatches.filter(m => !m.started).length,
              minutesPlayed: compMatches.reduce((s, m) => s + (m.minutesPlayed || 0), 0),
              goals: compMatches.reduce((s, m) => s + (m.goals || 0), 0),
              assists: compMatches.reduce((s, m) => s + (m.assists || 0), 0),
              yellowCards: compMatches.reduce((s, m) => s + (m.yellowCards || 0), 0),
              redCards: compMatches.reduce((s, m) => s + (m.redCards || 0), 0),
            };
          }).filter(Boolean);
          matchStats = matchStats.filter(m => compCodes.includes(m.competition));
        }
      }

      players.sort((a, b) =>
        (b.starts + b.subApps) - (a.starts + a.subApps) ||
        a.name.localeCompare(b.name)
      );

      setPlayers(players);
      setTeamStats(aggregateTeamStats(matchStats));
    }

    loadStats();
  }, [selectedTeam, season, competition]);

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
            <p className="site-subtitle">Season</p>
          </div>
        </div>
      </header>

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
            <div style={{ width: 32, height: 32, flexShrink: 0, overflow: 'hidden' }}>
              <img
                src={t.crest}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'contain', maxWidth: 32, maxHeight: 32 }}
              />
            </div>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <div className="stats-controls">
          <div className="stats-team-name">
            <img src={selectedTeam.crest} alt="" className="stats-team-crest" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="stats-toggles">
              <button
                className={`stats-toggle ${season === '2026' ? 'active' : ''}`}
                onClick={() => { setSeason('2026'); setCompetition('all'); }}
              >2026/27</button>
              <button
                className={`stats-toggle ${season === '2025' ? 'active' : ''}`}
                onClick={() => { setSeason('2025'); setCompetition('all'); }}
              >2025/26</button>
            </div>
            <div className="stats-toggles">
              <button
                className={`stats-toggle ${competition === 'all' ? 'active' : ''}`}
                onClick={() => setCompetition('all')}
              >All</button>
              <button
                className={`stats-toggle ${competition === selectedTeam?.competition ? 'active' : ''}`}
                onClick={() => setCompetition(selectedTeam?.competition || 'PL')}
              >League</button>
              {selectedTeam?.competition === 'PL' && (
                <button
                  className={`stats-toggle ${competition === 'CL' ? 'active' : ''}`}
                  onClick={() => setCompetition('CL')}
                >Champions League</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="content">
        {loading && <p className="state-msg">Loading player stats…</p>}
        {error && <p className="state-msg error">Could not load stats: {error}</p>}
        {!loading && !error && players.length === 0 && selectedTeam && (
          <div className="state-msg">
            <p>No stats available yet for {season === '2026' ? '2026/27' : '2025/26'}.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              {season === '2026'
                ? selectedTeam?.competition === 'ELC'
                  ? `${selectedTeam.shortName} stats will be available once the Championship season starts on 9th August.`
                  : `${selectedTeam?.shortName} stats will be available once the 2026/27 season starts.`
                : `No 2025/26 stats available for ${selectedTeam.shortName}.`
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
                >{s.label}</button>
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