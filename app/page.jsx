'use client';

import { useEffect, useState, useRef } from 'react';
import { TEAMS } from '@/lib/teams';
import TeamSelector from '@/components/TeamSelector';

const LIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'];
const POLL_INTERVAL = 30_000;

function LiveMatchCard({ match }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/match/${match.id}`);
        const data = await res.json();
        setDetail(data);
      } catch {}
    }
    fetchDetail();
  }, [match.id, match.minute]);

  const m = detail || match;
  const { homeTeam, awayTeam, score, minute, injuryTime, goals, bookings, substitutions } = m;
  const homeScore = score?.fullTime?.home ?? 0;
  const awayScore = score?.fullTime?.away ?? 0;
  const halfTimeHome = score?.halfTime?.home;
  const halfTimeAway = score?.halfTime?.away;
  const isHome = id => TEAMS.some(t => t.id === id);

  const homeGoals = goals?.filter(g => g.team?.id === homeTeam?.id) || [];
  const awayGoals = goals?.filter(g => g.team?.id === awayTeam?.id) || [];
  const homeBookings = bookings?.filter(b => b.team?.id === homeTeam?.id) || [];
  const awayBookings = bookings?.filter(b => b.team?.id === awayTeam?.id) || [];
  const homeSubs = substitutions?.filter(s => s.team?.id === homeTeam?.id) || [];
  const awaySubs = substitutions?.filter(s => s.team?.id === awayTeam?.id) || [];

  return (
    <div className="live-match-card">
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

      {bookings?.length > 0 && (
        <div className="live-events">
          <div className="live-events-section-title">Cards</div>
          <div className="live-events-two-col">
            <div>
              {homeBookings.map((b, i) => (
                <div key={i} className="live-event">
                  <span className="live-event-icon">{b.card === 'RED' ? '🟥' : '🟨'}</span>
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
                  <span className="live-event-icon">{b.card === 'RED' ? '🟥' : '🟨'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

function UpcomingMatchCard({ match }) {
  const trackedIds = new Set(TEAMS.map(t => t.id));
  const homeTracked = trackedIds.has(match.homeTeam?.id);
  const awayTracked = trackedIds.has(match.awayTeam?.id);

  return (
    <div className={`match-card ${homeTracked || awayTracked ? 'tracked' : ''}`}>
      <div className="team-home">
        {match.homeTeam?.crest && (
          <img src={match.homeTeam.crest} alt="" className="team-crest" />
        )}
        <span className={`team-name ${homeTracked ? 'tracked-name' : ''}`}>
          {match.homeTeam?.shortName || match.homeTeam?.name}
        </span>
      </div>
      <div className="match-centre">
        <div className="match-score">vs</div>
        <div className="match-time">
          {new Date(match.utcDate).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'
          })}
        </div>
        <div className="match-competition">{match.competition?.name}</div>
      </div>
      <div className="team-away">
        {match.awayTeam?.crest && (
          <img src={match.awayTeam.crest} alt="" className="team-crest" />
        )}
        <span className={`team-name ${awayTracked ? 'tracked-name' : ''}`}>
          {match.awayTeam?.shortName || match.awayTeam?.name}
        </span>
      </div>
    </div>
  );
}

export default function FixturesPage() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const intervalRef = useRef(null);

  async function fetchMatches() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const url = selectedTeam === 'all'
        ? `/api/matches?dateFrom=${today}&dateTo=${today}`
        : `/api/matches?dateFrom=${today}&dateTo=${today}&teamId=${selectedTeam}`;

      const [todayRes, upcomingRes] = await Promise.all([
        fetch(url),
        fetch(selectedTeam === 'all'
          ? '/api/matches'
          : `/api/matches?teamId=${selectedTeam}`
        ),
      ]);

      const todayData = await todayRes.json();
      const upcomingData = await upcomingRes.json();

      const todayMatches = todayData.matches || [];
      const live = todayMatches.filter(m => LIVE_STATUSES.includes(m.status));

      const upcoming = (upcomingData.matches || []).filter(
        m => m.status !== 'FINISHED' &&
             m.status !== 'AWARDED' &&
             m.status !== 'CANCELLED' &&
             !LIVE_STATUSES.includes(m.status)
      );

      setLiveMatches(live);
      setUpcomingMatches(upcoming);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMatches();
    intervalRef.current = setInterval(fetchMatches, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [selectedTeam]);

  const grouped = upcomingMatches.reduce((acc, match) => {
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

      <TeamSelector
        selectedTeam={selectedTeam}
        onChange={val => {
          setSelectedTeam(val);
          setLoading(true);
        }}
      />

      <div className="content">
        {loading && <p className="state-msg">Loading…</p>}
        {error && <p className="state-msg error">Could not load fixtures: {error}</p>}

        {!loading && !error && (
          <>
            {liveMatches.length > 0 && (
              <section className="live-section">
                <h2 className="live-section-title">🔴 Live Now</h2>
                {liveMatches.map(match => (
                  <LiveMatchCard key={match.id} match={match} />
                ))}
              </section>
            )}

            {upcomingMatches.length === 0 && liveMatches.length === 0 && (
              <p className="state-msg">No upcoming fixtures found.</p>
            )}

            {Object.entries(grouped).sort().map(([date, dayMatches]) => (
              <section key={date} className="day-group">
                <h2 className="day-label">
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </h2>
                <div className="match-list">
                  {dayMatches.map(match => (
                    <UpcomingMatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </main>
  );
}