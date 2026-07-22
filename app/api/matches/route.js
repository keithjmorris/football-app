import { TEAMS } from '@/lib/teams';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const status = searchParams.get('status');

  try {
    // Find which competition(s) to fetch
    const teamsToFetch = teamId
      ? TEAMS.filter(t => t.id === parseInt(teamId))
      : TEAMS;

    // Get unique competitions needed
    const competitions = [...new Set(teamsToFetch.map(t => t.competition))];

    // Fetch matches from each competition
    const results = await Promise.all(
      competitions.map(async (comp) => {
        const params = new URLSearchParams({ season: '2026' });
        if (status) params.set('status', status);

        const res = await fetch(
          `https://api.football-data.org/v4/competitions/${comp}/matches?${params}`,
          {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
            next: { revalidate: 60 },
          }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.matches || [];
      })
    );

    // Flatten and filter to only our tracked teams
    const trackedIds = new Set(TEAMS.map(t => t.id));
    const allMatches = results.flat().filter(m =>
      trackedIds.has(m.homeTeam?.id) || trackedIds.has(m.awayTeam?.id)
    );

    // If teamId specified, filter further
    const filtered = teamId
      ? allMatches.filter(m =>
          m.homeTeam?.id === parseInt(teamId) ||
          m.awayTeam?.id === parseInt(teamId)
        )
      : allMatches;

    // Sort by date
    filtered.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    return Response.json({ matches: filtered });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}