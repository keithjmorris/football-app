// Highlightly team ID mapping (football-data.org id → highlightly id)
const TEAM_MAP = {
  57: 36526,   // Arsenal
  61: 42483,   // Chelsea
  60: 58652,   // Bolton
  341: 54397,  // Leeds
};

// Cup league IDs on Highlightly
const CUP_LEAGUES = [
  { id: 41632, name: 'League Cup' },
  { id: 146305, name: 'FA Cup' },
];

async function fetchHighlightly(url) {
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': process.env.HIGHLIGHTLY_API_KEY,
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

function convertMatch(m, footballDataTeamId) {
  // Convert Highlightly match format to football-data.org-like format
  const score = m.state?.score?.current;
  const parts = score ? score.split(' - ') : [null, null];
  const homeScore = parts[0] !== null ? parseInt(parts[0]) : null;
  const awayScore = parts[1] !== null ? parseInt(parts[1]) : null;

  const desc = m.state?.description || '';
  let status = 'SCHEDULED';
  if (desc === 'Finished' || desc === 'Finished after penalties' || desc === 'Finished after extra time') {
    status = 'FINISHED';
  } else if (desc === 'Not started') {
    status = 'TIMED';
  } else if (desc === 'First half' || desc === 'Second half' || desc === 'In progress') {
    status = 'IN_PLAY';
  } else if (desc === 'Half time') {
    status = 'PAUSED';
  } else if (desc === 'Extra time') {
    status = 'EXTRA_TIME';
  } else if (desc === 'Penalties') {
    status = 'PENALTY_SHOOTOUT';
  } else if (desc === 'Postponed') {
    status = 'POSTPONED';
  }

  return {
    id: m.id,
    utcDate: m.date,
    status,
    competition: {
      name: m.league?.name || 'Cup',
      code: m.league?.id === 41632 ? 'EFL' : 'FAC',
    },
    homeTeam: {
      id: m.homeTeam.id,
      name: m.homeTeam.name,
      shortName: m.homeTeam.name,
      crest: m.homeTeam.logo,
    },
    awayTeam: {
      id: m.awayTeam.id,
      name: m.awayTeam.name,
      shortName: m.awayTeam.name,
      crest: m.awayTeam.logo,
    },
    score: {
      fullTime: { home: homeScore, away: awayScore },
      halfTime: { home: null, away: null },
    },
    _highlightly: true,
    _highlightlyMatchId: m.id,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamIds = searchParams.get('teamIds')?.split(',').map(Number) || [];
  const status = searchParams.get('status'); // FINISHED or upcoming

  if (teamIds.length === 0) {
    return Response.json({ matches: [] });
  }

  try {
    const allMatches = [];

    for (const cup of CUP_LEAGUES) {
      // Fetch all cup matches for this season
      const matches = await fetchHighlightly(
        `https://soccer.highlightly.net/matches?leagueId=${cup.id}&season=2026&limit=100`
      );

      // Filter to our tracked teams
      for (const fdId of teamIds) {
        const hlId = TEAM_MAP[fdId];
        if (!hlId) continue;

        const teamMatches = matches.filter(m =>
          m.homeTeam?.id === hlId || m.awayTeam?.id === hlId
        );

        for (const m of teamMatches) {
          const converted = convertMatch(m, fdId);

          // Apply status filter
          if (status === 'FINISHED' && converted.status !== 'FINISHED') continue;
          if (status === 'UPCOMING' && converted.status === 'FINISHED') continue;

          allMatches.push(converted);
        }
      }
    }

    // Sort by date
    allMatches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    // Deduplicate by match id
    const seen = new Set();
    const deduplicated = allMatches.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    return Response.json({ matches: deduplicated });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}