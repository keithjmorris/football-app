export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const teamIds = searchParams.get('teamIds');
  const status = searchParams.get('status');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  try {
    // Build list of team IDs to fetch
    let ids = [];
    if (teamId) {
      ids = [parseInt(teamId)];
    } else if (teamIds) {
      ids = teamIds.split(',').map(Number);
    }

    if (ids.length === 0) {
      return Response.json({ matches: [] });
    }

    // Determine which competitions we need
    // Fetch from both PL and ELC to cover all cases
    const competitions = ['PL', 'ELC'];

    const seasonParam = searchParams.get('season');
const currentDate = new Date();
const defaultSeason = currentDate >= new Date('2026-08-09') ? '2026' : '2025';
const season = seasonParam || defaultSeason;
const params = new URLSearchParams({ season });
    if (status) params.set('status', status);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    const results = await Promise.all(
      competitions.map(async comp => {
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

    // Flatten and filter to requested team IDs
    const idSet = new Set(ids);
    const allMatches = results.flat().filter(m =>
      idSet.has(m.homeTeam?.id) || idSet.has(m.awayTeam?.id)
    );

    // If single teamId, filter further
    if (teamId) {
      const tid = parseInt(teamId);
      const filtered = allMatches.filter(m =>
        m.homeTeam?.id === tid || m.awayTeam?.id === tid
      );
      filtered.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
      return Response.json({ matches: filtered });
    }

    allMatches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    return Response.json({ matches: allMatches });

  } catch (err) {
    return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}