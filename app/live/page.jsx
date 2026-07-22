'use client';

import { useEffect, useState, useRef } from 'react';

const POLL_INTERVAL = 30_000;

function LiveMatchCard({ match }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/match/${match.id}`);
        const data = await res.json();
        setDetail(data);
      } catch {
        // silently fail
      }
    }
    fetchDetail();
  }, [match.id, match.minute]); // refetch when minute changes

  const m = detail || match;
  const { homeTeam, awayTeam, score, minute, injuryTime, goals, bookings, substitutions } = m;
  const homeScore = score?.fullTime?.home ?? 0;
  const awayScore = score?.fullTime?.away ?? 0;
  const halfTimeHome = score?.halfTime?.home;
  const halfTimeAway = score?.halfTime?.away;

  const homeGoals = goals?.filter(g => g.team?.id === homeTeam?.id) || [];
  const awayGoals = goals?.filter(g => g.team?.id === awayTeam?.id) || [];
  const homeBookings = bookings?.filter(b => b.team?.id === homeTeam?.id) || [];
  const awayBookings = bookings?.filter(b => b.team?.id === awayTeam?.id) || [];
  const homeSubs = substitutions?.filter(s => s.team?.id === homeTeam?.id) || [];
  const awaySubs = substitutions?.filter(s => s.team?.id === awayTeam?.id) || [];

  return (
    <div className="live-match-card">
      {/* Score header */}
      <div className="live-score-header">
        <div className="live-team">
          {homeTeam?.crest && <img src={homeTeam.crest} alt="" className="live-crest" />}
          <span className="live-team-name">{homeTeam?.shortName || homeTeam?.name}</span>
        </div>
        <div className="live-score-centre">
          <div className="live-score-display">
            <span>{homeScore}</span>
            <span className="live-score-sep">:</span>
            <span>{awayScore}</span>
          </div>
          <div className="live-minute">
            {minute}{injuryTime ? `+${injuryTime}` : ''}'
          </div>
          {halfTimeHome !== null && halfTimeHome !== undefined && (
            <div className="live-ht">HT {halfTimeHome}–{halfTimeAway}</div>
          )}
        </div>
        <div className="live-team live-team-away">
          {awayTeam?.crest && <img src={awayTeam.crest} alt="" className="live-crest" />}
          <span className="live-team-name">{awayTeam?.shortName || awayTeam?.name}</span>
        </div>
      </div>

      {/* Goals */}
      {goals?.length > 0 && (
        <div className="live-events">
          <div className="live-events-two-col">
            <div>
              {homeGoals.map((g, i) => (
                <div key={i} className="live-event">
                  <span className="live-event-icon">⚽</span>
                  <span className="live-event-text">
                    {g.scorer?.name}
                    {g.type === 'PENALTY' ? ' (pen)' : ''}
                    {g.type === 'OWN' ? ' (og)' : ''}
                  </span>
                  <span className="live-event-min">{g.minute}'</span>
                </div>
              ))}
            </div>
            <div>
              {awayGoals.map((g, i) => (
                <div key={i} className="live-event live-event-away">
                  <span className="live-event-min">{g.minute}'</span>
                  <span className="live-event-text">
                    {g.scorer?.name}
                    {g.type === 'PENALTY' ? ' (pen)' : ''}
                    {g.type === 'OWN' ? ' (og)' : ''}
                  </span>
                  <span className="live-event-icon">⚽</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      {bookings?.length > 0 && (
        <div className="live-events">
          <div className="live-events-section-title">Cards</div>
          <div className="live-events-two-col">
            <div>
              {homeBookings.map((b, i) => (
                <div key={i} className="live-event">
                  <span className="live-event-icon">
                    {b.card === 'RED' ? '🟥' : '🟨'}
                  </span>
                  <span className="live-event-text">{b.player?.name}</span>
                  <span className="live-event-min">{b.minute}'</span>
                </div>
              ))}
            </div>
            <div>
              {awayBookings.map((b, i) => (
                <div key={i} className="live-event live-event-away">
                  <span className="live-event-min">{b.minute}'</span>
                  <span className="live-event-text">{b.player?.name}</span>
                  <span className="live-event-icon">
                    {b.card === 'RED' ? '🟥' : '🟨'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Substitutions */}
      {substitutions?.length > 0 && (
        <div className="live-events">
          <div className="live-events-section-title">Substitutions</div>
          <div className="live-events-two-col">
            <div>
              {homeSubs.map((s, i) => (
                <div key={i} className="live-event">
                  <span className="live-event-icon">🔄</span>
                  <span className="live-event-text">
                    <span className="sub-in">▲ {s.playerIn?.name}</span>
                    <span className="sub-out"> ▼ {s.playerOut?.name}</span>
                  </span>
                  <span className="live-event-min">{s.minute}'</span>
                </div>
              ))}
            </div>
            <div>
              {awaySubs.map((s, i) => (
                <div key={i} className="live-event live-event-away">
                  <span className="live-event-min">{s.minute}'</span>
                  <span className="live-event-text">
                    <span className="sub-in">▲ {s.playerIn?.name}</span>
                    <span className="sub-out"> ▼ {s.playerOut?.name}</span>
                  </span>
                  <span className="live-event-icon">🔄</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Lineups */}
      {(m.homeTeam?.lineup?.length > 0 || m.awayTeam?.lineup?.length > 0) && (
        <div className="live-events">
          <div className="live-events-section-title">Starting Lineups</div>
          <div className="live-events-two-col">
            <div>
              <div className="lineup-team-name">
                {homeTeam?.shortName} {homeTeam?.formation ? `(${homeTeam.formation})` : ''}
              </div>
              {m.homeTeam?.lineup?.map(p => (
                <div key={p.id} className="lineup-player">
                  <span className="lineup-shirt">{p.shirtNumber}</span>
                  <span>{p.name}{p.position === 'Goalkeeper' ? ' 🧤' : ''}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="lineup-team-name">
                {awayTeam?.shortName} {awayTeam?.formation ? `(${awayTeam.formation})` : ''}
              </div>
              {m.awayTeam?.lineup?.map(p => (
                <div key={p.id} className="lineup-player">
                  <span className="lineup-shirt">{p.shirtNumber}</span>
                  <span>{p.name}{p.position === 'Goalkeeper' ? ' 🧤' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bench */}
      {(m.homeTeam?.bench?.length > 0 || m.awayTeam?.bench?.length > 0) && (
        <div className="live-events">
          <div className="live-events-section-title">Substitutes</div>
          <div className="live-events-two-col">
            <div>
              {m.homeTeam?.bench?.map(p => (
                <div key={p.id} className="lineup-player">
                  <span className="lineup-shirt">{p.shirtNumber}</span>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
            <div>
              {m.awayTeam?.bench?.map(p => (
                <div key={p.id} className="lineup-player">
                  <span className="lineup-shirt">{p.shirtNumber}</span>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  async function fetchLive() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/matches?dateFrom=${today}&dateTo=${today}`);
      if (!res.ok) return;
      const data = await res.json();
      const live = (data.matches || []).filter(m =>
        ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(m.status)
      );
      setMatches(live);
      setLastUpdated(new Date());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLive();
    intervalRef.current = setInterval(fetchLive, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <span className="trophy">🔴</span>
          <div>
            <h1 className="site-title">Live Scores</h1>
            <p className="site-subtitle">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString('en-GB', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}`
                : 'Updating every 30 seconds'}
            </p>
          </div>
        </div>
      </header>

      <div className="content">
        {loading && <p className="state-msg">Checking for live matches…</p>}
        {!loading && matches.length === 0 && (
          <p className="state-msg">
            No matches in progress right now.<br />Check back on match days!
          </p>
        )}
        {!loading && matches.length > 0 && (
          <div className="match-list">
            {matches.map(match => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}