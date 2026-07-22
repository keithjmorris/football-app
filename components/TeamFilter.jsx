'use client';

export default function TeamFilter({ matches, selectedTeam, onChange }) {
  // Build sorted team list with England pinned first
  const teams = [...new Set(
    matches.flatMap(m => [
      m.homeTeam?.shortName || m.homeTeam?.name,
      m.awayTeam?.shortName || m.awayTeam?.name,
    ]).filter(Boolean)
  )].sort();

  // Pin England at top
  const england = teams.find(t => t === 'England');
  const others = teams.filter(t => t !== 'England');
  const ordered = england ? [england, ...others] : others;

  return (
    <div className="team-filter-wrapper">
      <select
        className="team-filter-select"
        value={selectedTeam}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">All teams</option>
        {ordered.map(team => (
          <option key={team} value={team}>{team}</option>
        ))}
      </select>
    </div>
  );
}