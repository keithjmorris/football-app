import { TEAM_ID_MAP, LEAGUE_IDS, convertMatch, fetchHighlightly } from '@/lib/highlightly';
import { TEAMS } from '@/lib/teams';

// Get competition code from Highlightly league ID
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

    // Determine which leagues to fetch
    const leaguesToFetch = [];
    for (const fdId of fdIds) {
      const team = TEAMS.find(t => t.id === fdId);
      if (team?.competition === 'PL') {
        if (!leaguesToFetch.includes(LEAGUE_IDS.PL)) leaguesToFetch.push(LEAGUE_IDS.PL);
      } else if (team?.competition === 'ELC') {
        if (!leaguesToFetch.includes(LEAGUE_IDS.ELC)) leaguesToFetch.push(LEAGUE_IDS.ELC);
      }
    }

    // If no specific team, fetch all tracked leagues
    if (leaguesToFetch.length === 0) {
      leaguesToFetch.push(LEAGUE_IDS.PL, LEAGUE_IDS.ELC);
    }

    // Also include cups
    leaguesToFetch.push(LEAGUE_IDS.FAC, LEAGUE_IDS.EFL);

    // Fetch matches from each league
    const allMatches = [];

    for (const leagueId of leaguesToFetch) {
      let path = `/matches?leagueId=${leagueId}&season=${season}&limit=100`;
      if (dateFrom) path += `&dateFrom=${dateFrom}`;
      if (dateTo) path += `&dateTo=${dateTo}`;

      const data = await fetchHighlightly(path, apiKey);
      if (!data?.data) continue;

      const compCode = getCompCode(leagueId);

      // Filter to our tracked teams
      const filtered = data.data.filter(m =>
        hlIds.includes(m.homeTeam?.id) || hlIds.includes(m.awayTeam?.id)
      );

      for (const m of filtered) {
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

    // Sort by date
    matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    // Deduplicate
    const seen = new Set();
    const deduped = matches.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    return Response.json({ matches: deduped });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}