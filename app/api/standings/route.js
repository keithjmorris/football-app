import { TEAMS } from '@/lib/teams';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const competition = searchParams.get('competition') || 'PL';

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/${competition}/standings`,
      {
        headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return Response.json(
        { error: `football-data API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const trackedIds = new Set(TEAMS.map(t => t.id));

    // Add a flag to highlight our tracked teams
    const standings = data.standings?.map(group => ({
      ...group,
      table: group.table.map(row => ({
        ...row,
        tracked: trackedIds.has(row.team?.id),
      })),
    }));

    return Response.json({
      competition: data.competition,
      season: data.season,
      standings,
    });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}