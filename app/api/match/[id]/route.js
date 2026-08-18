import { convertMatch, convertScore, convertStatus, fetchHighlightly, LEAGUE_IDS } from '@/lib/highlightly';

function getCompCode(leagueId) {
  return Object.entries(LEAGUE_IDS).find(([, id]) => id === leagueId)?.[0] || 'UNKNOWN';
}

function convertEvents(events) {
  const goals = [];
  const bookings = [];
  const substitutions = [];

  for (const e of events || []) {
    const minute = parseInt(e.time) || 0;

    if (e.type === 'Goal' || e.type === 'Penalty') {
      goals.push({
        minute,
        scorer: { name: e.player, id: e.playerId },
        assist: e.assist ? { name: e.assist, id: e.assistingPlayerId } : null,
        team: e.team,
        type: e.type === 'Penalty' ? 'PENALTY' : 'REGULAR',
      });
    } else if (e.type === 'Own Goal') {
      goals.push({
        minute,
        scorer: { name: e.player, id: e.playerId },
        assist: null,
        team: e.team,
        type: 'OWN',
      });
    } else if (e.type === 'Yellow Card') {
      bookings.push({
        minute,
        player: { name: e.player, id: e.playerId },
        team: e.team,
        card: 'YELLOW',
      });
    } else if (e.type === 'Red Card') {
      bookings.push({
        minute,
        player: { name: e.player, id: e.playerId },
        team: e.team,
        card: 'RED',
      });
    } else if (e.type === 'Yellow Card/Red Card') {
      bookings.push({
        minute,
        player: { name: e.player, id: e.playerId },
        team: e.team,
        card: 'YELLOW_RED',
      });
    } else if (e.type === 'Substitution') {
      substitutions.push({
        minute,
        playerIn: { name: e.player, id: e.playerId },
        playerOut: { name: e.substituted, id: null },
        team: e.team,
      });
    }
  }

  return { goals, bookings, substitutions };
}

function convertLineups(lineupData) {
  if (!lineupData) return { homeTeam: {}, awayTeam: {} };

  function processTeam(team) {
    const lineup = (team.initialLineup || []).flat().map((p, i) => ({
      id: p.id,
      name: p.name,
      shirtNumber: p.number,
      position: p.position,
    }));

    const bench = (team.substitutes || []).map(p => ({
      id: p.id,
      name: p.name,
      shirtNumber: p.number,
      position: p.position,
    }));

    return {
      id: team.id,
      name: team.name,
      formation: team.formation,
      lineup,
      bench,
    };
  }

  return {
    homeTeam: processTeam(lineupData.homeTeam || {}),
    awayTeam: processTeam(lineupData.awayTeam || {}),
  };
}

function convertStatistics(statsData, homeTeamId, awayTeamId) {
  if (!statsData) return { home: null, away: null };
  
  const arr = Array.isArray(statsData) ? statsData : statsData.data || [];
  
  function extractStats(teamStats) {
    const s = {};
    for (const stat of teamStats?.statistics || []) {
      s[stat.displayName] = stat.value;
    }
    return {
      ball_possession: s['Possession'] || 0,
      shots_on_goal: s['Shots on target'] || 0,
      shots_off_goal: s['Shots off target'] || 0,
      shots: (s['Shots on target'] || 0) + (s['Shots off target'] || 0) + (s['Blocked shots'] || 0),
      saves: s['Goalkeeper saves'] || 0,
      corner_kicks: s['Corners'] || 0,
      fouls: s['Fouls'] || 0,
      offsides: s['Offsides'] || 0,
      yellow_cards: s['Yellow cards'] || 0,
      red_cards: s['Red cards'] || 0,
    };
  }

  const homeStats = arr.find(t => t.team?.id === homeTeamId);
  const awayStats = arr.find(t => t.team?.id === awayTeamId);

  return {
    home: homeStats ? extractStats(homeStats) : null,
    away: awayStats ? extractStats(awayStats) : null,
  };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const apiKey = process.env.HIGHLIGHTLY_API_KEY;

  try {
    // Fetch match, events, lineups and statistics in parallel
    const [matchRaw, eventsData, lineupData, statsData] = await Promise.all([
  fetchHighlightly(`/matches/${id}`, apiKey, 30),
  fetchHighlightly(`/events/${id}`, apiKey, 30),
  fetchHighlightly(`/lineups/${id}`, apiKey, 30),
  fetchHighlightly(`/statistics/${id}`, apiKey, 30),
]);

if (!matchRaw) {
  return Response.json({ error: 'Match not found' }, { status: 404 });
}

// Match detail returns array with one item or direct object
const matchData = Array.isArray(matchRaw) ? matchRaw[0] : (matchRaw.data?.[0] || matchRaw);

const compCode = getCompCode(matchData.league?.id);
const base = convertMatch(matchData, compCode);
const { goals, bookings, substitutions } = convertEvents(eventsData);
const lineups = convertLineups(lineupData);
const stats = convertStatistics(
  statsData,
  matchData.homeTeam?.id,
  matchData.awayTeam?.id
);

    // Merge everything together
    const fullMatch = {
      ...base,
      goals,
      bookings,
      substitutions,
      homeTeam: {
        ...base.homeTeam,
        ...lineups.homeTeam,
        statistics: stats.home,
      },
      awayTeam: {
        ...base.awayTeam,
        ...lineups.awayTeam,
        statistics: stats.away,
      },
      venue: matchData.venue?.name || null,
      attendance: null,
      referees: matchData.referee?.name
        ? [{ name: matchData.referee.name, type: 'REFEREE' }]
        : [],
    };

    return Response.json(fullMatch);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}