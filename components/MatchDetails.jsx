'use client';

import { useState } from 'react';
import MatchStats from '@/components/MatchStats';
import { TEAMS } from '@/lib/teams';

function CardIcon({ type }) {
  const colour = type === 'RED' ? '#dc2626' : type === 'YELLOW_RED' ? '#f97316' : '#eab308';
  return (
    <span style={{
      display: 'inline-block',
      width: 10, height: 14,
      background: colour,
      borderRadius: 2,
      marginRight: 5,
      verticalAlign: 'middle',
      flexShrink: 0,
    }} />
  );
}

function LineupList({ players, substitutions, teamId }) {
  if (!players || players.length === 0) return <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Not available</p>;

  const subbedOff = substitutions
    ?.filter(s => s.team?.id === teamId)
    .map(s => s.playerOut?.id) || [];

  return (
    <div>
      {players.map(p => {
        const wasSubbed = subbedOff.includes(p.id);
        const subMinute = substitutions?.find(s => s.playerOut?.id === p.id)?.minute;
        return (
          <div key={p.id} className="lineup-player">
            <span className="lineup-shirt">{p.shirtNumber}</span>
            <span className={wasSubbed ? 'lineup-subbed-off' : ''}>
              {p.name}
              {p.position === 'Goalkeeper' ? ' 🧤' : ''}
            </span>
            {wasSubbed && (
              <span className="sub-out" style={{ fontSize: '0.7rem', marginLeft: 4 }}>
                ▼{subMinute}'
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MatchDetails({ match }) {
  const [open, setOpen] = useState(false);
  const [fullMatch, setFullMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (fullMatch) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/match/${match.id}`);
      const data = await res.json();
      setFullMatch(data);
    } catch {
      setFullMatch(match);
    } finally {
      setLoading(false);
    }
  }

  const data = fullMatch || match;
  const { homeTeam, awayTeam, goals, bookings, substitutions, venue, attendance, referees } = data;

  // Find team colours
  const homeTeamConfig = TEAMS.find(t => t.id === homeTeam?.id);
  const awayTeamConfig = TEAMS.find(t => t.id === awayTeam?.id);

  const homeGoals = goals?.filter(g => g.team?.id === homeTeam?.id) || [];
  const awayGoals = goals?.filter(g => g.team?.id === awayTeam?.id) || [];
  const homeBookings = bookings?.filter(b => b.team?.id === homeTeam?.id) || [];
  const awayBookings = bookings?.filter(b => b.team?.id === awayTeam?.id) || [];
  const homeSubs = substitutions?.filter(s => s.team?.id === homeTeam?.id) || [];
  const awaySubs = substitutions?.filter(s => s.team?.id === awayTeam?.id) || [];
  const referee = referees?.find(r => r.type === 'REFEREE');

  return (
    <div className="match-details-wrapper">
      <button className="summary-btn" onClick={handleToggle}>
        {open ? '▲ Hide details' : '▼ Match details'}
      </button>
      {open && (
        <div className="details-box">
          {loading && <p className="state-msg" style={{ padding: '0.5rem 0' }}>Loading match details…</p>}

          {!loading && (
            <>
              {/* Venue & attendance */}
              {venue && (
                <div className="details-meta">
                  📍 {venue}{attendance ? ` · ${attendance.toLocaleString()} fans` : ''}
                  {referee ? ` · Referee: ${referee.name}` : ''}
                </div>
              )}

              {/* Match Stats */}
              <MatchStats
                homeTeam={data.homeTeam}
                awayTeam={data.awayTeam}
                homeColor={homeTeamConfig?.color}
                awayColor={awayTeamConfig?.color}
              />

              {/* Goals */}
              {goals?.length > 0 && (
                <div className="details-section">
                  <div className="details-section-title">⚽ Goals</div>
                  <div className="details-two-col">
                    <div>
                      {homeGoals.map((g, i) => (
                        <div key={i} className="details-event">
                          <span className="event-minute">{g.minute}'</span>
                          <span>{g.scorer?.name}
                            {g.type === 'PENALTY' ? ' (pen)' : ''}
                            {g.type === 'OWN' ? ' (og)' : ''}
                            {g.assist ? <span className="event-assist"> ↳ {g.assist.name}</span> : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      {awayGoals.map((g, i) => (
                        <div key={i} className="details-event">
                          <span className="event-minute">{g.minute}'</span>
                          <span>{g.scorer?.name}
                            {g.type === 'PENALTY' ? ' (pen)' : ''}
                            {g.type === 'OWN' ? ' (og)' : ''}
                            {g.assist ? <span className="event-assist"> ↳ {g.assist.name}</span> : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Cards */}
              {bookings?.length > 0 && (
                <div className="details-section">
                  <div className="details-section-title">🟨 Cards</div>
                  <div className="details-two-col">
                    <div>
                      {homeBookings.map((b, i) => (
                        <div key={i} className="details-event">
                          <span className="event-minute">{b.minute}'</span>
                          <CardIcon type={b.card} />
                          <span>{b.player?.name}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      {awayBookings.map((b, i) => (
                        <div key={i} className="details-event">
                          <span className="event-minute">{b.minute}'</span>
                          <CardIcon type={b.card} />
                          <span>{b.player?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Substitutions */}
              {substitutions?.length > 0 && (
                <div className="details-section">
                  <div className="details-section-title">🔄 Substitutions</div>
                  <div className="details-two-col">
                    <div>
                      {homeSubs.map((s, i) => (
                        <div key={i} className="details-event">
                          <span className="event-minute">{s.minute}'</span>
                          <span>
                            <span className="sub-in">▲ {s.playerIn?.name}</span>
                            <span className="sub-out"> ▼ {s.playerOut?.name}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      {awaySubs.map((s, i) => (
                        <div key={i} className="details-event">
                          <span className="event-minute">{s.minute}'</span>
                          <span>
                            <span className="sub-in">▲ {s.playerIn?.name}</span>
                            <span className="sub-out"> ▼ {s.playerOut?.name}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Lineups */}
              <div className="details-section">
                <div className="details-section-title">👕 Starting Lineups</div>
                <div className="details-two-col">
                  <div>
                    <div className="lineup-team-name">
                      {homeTeam?.shortName || homeTeam?.name} {homeTeam?.formation ? `(${homeTeam.formation})` : ''}
                    </div>
                    <LineupList players={homeTeam?.lineup} substitutions={substitutions} teamId={homeTeam?.id} />
                  </div>
                  <div>
                    <div className="lineup-team-name">
                      {awayTeam?.shortName || awayTeam?.name} {awayTeam?.formation ? `(${awayTeam.formation})` : ''}
                    </div>
                    <LineupList players={awayTeam?.lineup} substitutions={substitutions} teamId={awayTeam?.id} />
                  </div>
                </div>
              </div>

              {/* Bench */}
              {(homeTeam?.bench?.length > 0 || awayTeam?.bench?.length > 0) && (
                <div className="details-section">
                  <div className="details-section-title">🪑 Substitutes</div>
                  <div className="details-two-col">
                    <div>
                      {homeTeam?.bench?.map(p => (
                        <div key={p.id} className="lineup-player">
                          <span className="lineup-shirt">{p.shirtNumber}</span>
                          <span>{p.name}</span>
                          {substitutions?.find(s => s.playerIn?.id === p.id) && (
                            <span className="sub-in" style={{ fontSize: '0.7rem', marginLeft: 4 }}>
                              ▲{substitutions.find(s => s.playerIn?.id === p.id).minute}'
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      {awayTeam?.bench?.map(p => (
                        <div key={p.id} className="lineup-player">
                          <span className="lineup-shirt">{p.shirtNumber}</span>
                          <span>{p.name}</span>
                          {substitutions?.find(s => s.playerIn?.id === p.id) && (
                            <span className="sub-in" style={{ fontSize: '0.7rem', marginLeft: 4 }}>
                              ▲{substitutions.find(s => s.playerIn?.id === p.id).minute}'
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}