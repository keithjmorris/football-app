import { LEAGUE_IDS, TEAM_ID_MAP, fetchHighlightly } from '@/lib/highlightly';
import { TEAMS } from '@/lib/teams';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const competition = searchParams.get('competition') || 'PL';
  const season = searchParams.get('season') || '2026';

  const apiKey = process.env.HIGHLIGHTLY_API_KEY;
  const leagueId = LEAGUE_IDS[competition];

  if (!leagueId) {
    return Response.json({ error: 'Unknown competition' }, { status: 400 });
  }

  try {
    const data = await fetchHighlightly(
      `/standings?leagueId=${leagueId}&season=${season}`,
      apiKey,
      300
    );

    if (!data?.groups) {
      return Response.json({ standings: [] });
    }

    // Build set of tracked Highlightly team IDs
    const trackedHlIds = new Set(
      TEAMS.map(t => TEAM_ID_MAP[t.id]).filter(Boolean)
    );

    // Convert to our format
    const standings = data.groups.map(group => ({
      ...group,
      table: group.standings.map(row => ({
        position: row.position,
        team: {
          id: row.team.id,
          name: row.team.name,
          shortName: row.team.name,
          crest: row.team.logo,
        },
        playedGames: row.total?.games || 0,
        won: row.total?.wins || 0,
        draw: row.total?.draws || 0,
        lost: row.total?.loses || 0,
        goalsFor: row.total?.scoredGoals || 0,
        goalsAgainst: row.total?.receivedGoals || 0,
        goalDifference: (row.total?.scoredGoals || 0) - (row.total?.receivedGoals || 0),
        points: row.points || 0,
        tracked: trackedHlIds.has(row.team.id),
      })),
    }));

    return Response.json({ standings });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}