'use client';

const STATUS_LIVE = ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'];
const STATUS_FINISHED = ['FINISHED', 'AWARDED'];

export default function MatchCard({ match }) {
  const { homeTeam, awayTeam, score, status, utcDate } = match;
  const isLive = STATUS_LIVE.includes(status);
  const isFinished = STATUS_FINISHED.includes(status);
  const showScore = isLive || isFinished;

  const kickoff = new Date(utcDate).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'
  });

  const homeGoals = score?.fullTime?.home ?? score?.halfTime?.home ?? null;
  const awayGoals = score?.fullTime?.away ?? score?.halfTime?.away ?? null;

  return (
    <div className={`match-card ${isLive ? 'live' : ''}`}>
      {/* Home team */}
      <div className="team home">
        {homeTeam.crest && (
          <img src={homeTeam.crest} alt="" className="team-crest" />
        )}
        <span className="team-name">{homeTeam.shortName || homeTeam.name}</span>
      </div>

      {/* Score / time block */}
      <div className="score-block">
        {showScore ? (
          <div className="score">
            <span>{homeGoals ?? '–'}</span>
            <span className="score-sep">:</span>
            <span>{awayGoals ?? '–'}</span>
          </div>
        ) : (
          <div className="score" style={{ fontSize: '1rem', color: 'var(--muted)' }}>
            {kickoff}
          </div>
        )}
        {isLive && (
  <span className="live-badge">
    {match.minute ? `${match.minute}'` : 'Live'}
  </span>
)}
        {isFinished && <div className="match-time">FT</div>}
        {!showScore && <div className="match-time">KO</div>}
      </div>

      {/* Away team */}
      <div className="team away">
        {awayTeam.crest && (
          <img src={awayTeam.crest} alt="" className="team-crest" />
        )}
        <span className="team-name">{awayTeam.shortName || awayTeam.name}</span>
      </div>
    </div>
  );
}