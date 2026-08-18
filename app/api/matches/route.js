import { TEAM_ID_MAP, LEAGUE_IDS, convertMatch, fetchHighlightly } from '@/lib/highlightly';
import { TEAMS } from '@/lib/teams';

function getCompCode(leagueId) {
  return Object.entries(LEAGUE_IDS).find(([, id]) => id === leagueId)?.[0] || 'UNKNOWN';
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const teamIds = searchParams.get('teamIds');
  const status = searchParams.get('status');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const season = searchParams.get('season') || '2026';

  const apiKey = process.env.HIGHLIGHTLY_API_KEY;

  try {
    // Build list of football-data team IDs
    let fdIds = [];
    if (teamId) {
      fdIds = [parseInt(teamId)];
    } else if (teamIds) {
      fdIds = teamIds.split(',').map(Number);
    } else {
      fdIds = TEAMS.map(t => t.id);
    }

    // Convert to Highlightly IDs
    const hlIds = fdIds.map(id => TEAM_ID_MAP[id]).filter(Boolean);

    if (hlIds.length === 0) {
      return Response.json({ matches: [] });
    }

    const allMatches = [];
    const seen = new Set();

    // Fetch home and away matches for each team
    for (const hlId of hlIds) {
      let homePath = `/matches?homeTeamId=${hlId}&season=${season}&limit=100`;
      let awayPath = `/matches?awayTeamId=${hlId}&season=${season}&limit=100`;

      if (dateFrom) {
        homePath += `&date=${dateFrom}`;
        awayPath += `&date=${dateFrom}`;
      }

      const [homeData, awayData] = await Promise.all([
        fetchHighlightly(homePath, apiKey),
        fetchHighlightly(awayPath, apiKey),
      ]);

      const matches = [
        ...(homeData?.data || []),
        ...(awayData?.data || []),
      ];

      for (const m of matches) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);

        const compCode = getCompCode(m.league?.id);
        allMatches.push(convertMatch(m, compCode));
      }
    }

    // Apply status filter
    let matches = allMatches;
    if (status === 'FINISHED') {
      matches = allMatches.filter(m => m.status === 'FINISHED');
    } else if (status === 'LIVE') {
      matches = allMatches.filter(m =>
        ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(m.status)
      );
    }

    // Filter out preseason friendlies (before Aug 8 2026)
    const seasonStart = new Date('2026-08-08');
    matches = matches.filter(m => new Date(m.utcDate) >= seasonStart);

    // Sort by date
    matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    return Response.json({ matches });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}