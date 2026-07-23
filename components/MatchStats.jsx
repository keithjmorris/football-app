'use client';

export default function MatchStats({ homeTeam, awayTeam, homeColor, awayColor }) {
  const hs = homeTeam?.statistics;
  const as = awayTeam?.statistics;

  if (!hs || !as) return null;

  const homeName = homeTeam?.shortName || homeTeam?.name;
  const awayName = awayTeam?.shortName || awayTeam?.name;

  const hColor = homeColor || '#1a1a2e';
  const aColor = awayColor || '#1a1a2e';

  function StatRow({ label, home, away, isPercent }) {
    if (home === null || home === undefined) return null;
    const total = home + away;
    const homePct = total === 0 ? 50 : Math.round((home / total) * 100);
    const awayPct = 100 - homePct;

    return (
      <div className="stat-row">
        <span className="stat-value stat-value-home">{home}{isPercent ? '%' : ''}</span>
        <div className="stat-bar-wrapper">
          <div className="stat-bar-label">{label}</div>
          <div className="stat-bar">
            <div
              className="stat-bar-home"
              style={{ width: `${isPercent ? home : homePct}%`, background: hColor }}
            />
            <div
              className="stat-bar-away"
              style={{ width: `${isPercent ? away : awayPct}%`, background: aColor }}
            />
          </div>
        </div>
        <span className="stat-value stat-value-away">{away}{isPercent ? '%' : ''}</span>
      </div>
    );
  }

  return (
    <div className="match-stats">
      <div className="match-stats-header">
        <span className="match-stats-team" style={{ color: hColor }}>{homeName}</span>
        <span className="match-stats-title">Match Stats</span>
        <span className="match-stats-team match-stats-team-away" style={{ color: aColor }}>{awayName}</span>
      </div>
      <StatRow label="Possession" home={hs.ball_possession} away={as.ball_possession} isPercent />
      <StatRow label="Shots on Target" home={hs.shots_on_goal} away={as.shots_on_goal} />
      <StatRow label="Shots off Target" home={hs.shots_off_goal} away={as.shots_off_goal} />
      <StatRow label="Saves" home={hs.saves} away={as.saves} />
      <StatRow label="Corners" home={hs.corner_kicks} away={as.corner_kicks} />
      <StatRow label="Fouls" home={hs.fouls} away={as.fouls} />
      <StatRow label="Offsides" home={hs.offsides} away={as.offsides} />
    </div>
  );
}