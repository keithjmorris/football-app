'use client';

import { useEffect, useState } from 'react';

export default function StandingsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const res = await fetch('/api/standings');
        if (!res.ok) throw new Error('Failed to fetch standings');
        const data = await res.json();
        setGroups(data.standings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, []);

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <span className="trophy">🏆</span>
          <div>
            <h1 className="site-title">Group Tables</h1>
            <p className="site-subtitle">World Cup 2026</p>
          </div>
        </div>
      </header>

      <div className="content">
        {loading && <p className="state-msg">Loading standings…</p>}
        {error && <p className="state-msg error">Could not load standings: {error}</p>}

        {!loading && !error && groups.map(group => (
          <section key={group.group} className="standings-group">
            <h2 className="group-title">
              {group.group?.replace('_', ' ') || 'Group'}
            </h2>
            <table className="standings-table">
              <thead>
                <tr>
                  <th colSpan={2} style={{ textAlign: 'left' }}>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.table.map(row => (
                  <tr key={row.team.id} className={row.position <= 2 ? 'qualify' : ''}>
                    <td className="pos">{row.position}</td>
                    <td>
                      <div className="team-row">
                        {row.team.crest && (
                          <img src={row.team.crest} alt="" className="team-crest" />
                        )}
                        {row.team.shortName || row.team.name}
                      </div>
                    </td>
                    <td>{row.playedGames}</td>
                    <td>{row.won}</td>
                    <td>{row.draw}</td>
                    <td>{row.lost}</td>
                    <td>{row.goalDifference > 0 ? '+' : ''}{row.goalDifference}</td>
                    <td className="pts">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </main>
  );
}