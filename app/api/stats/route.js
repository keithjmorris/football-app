import { TEAMS } from '@/lib/teams';

// In-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchWithRetry(url, headers, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await fetch(url, { headers });
      if (r.status === 429) {
        await new Promise(res => setTimeout(res, 2000 * (attempt + 1)));
        continue;
      }
      const data = await r.json();
      if (data.message) return null;
      return data;
    } catch {
      if (attempt === retries - 1) return null;
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  return null;
}

function processMatch(match, teamId) {
  if (!match || !match.homeTeam || !match.awayTeam) return [];
  const isHome = match.homeTeam?.id === teamId;
  const team = isHome ? match.homeTeam : match.awayTeam;
  if (!team) return [];

  const competition = match.competition?.code || 'UNKNOWN';
  const baseMatchInfo = {
    id: match.id,
    date: match.utcDate,
    opponent: isHome ? match.awayTeam?.shortName : match.homeTeam?.shortName,
    homeAway: isHome ? 'H' : 'A',
    score: `${match.score?.fullTime?.home}-${match.score?.fullTime?.away}`,
    competition,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
  };

  const players = {};

  // Starting lineup
  for (const p of team.lineup || []) {
    players[p.id] = {
      id: p.id,
      name: p.name,
      position: p.position,
      shirtNumber: p.shirtNumber,
      starts: 1,
      subApps: 0,
      minutesPlayed: 90,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      matches: [{ ...baseMatchInfo, started: true, minutesPlayed: 90 }],
    };
  }

  // Bench
  for (const p of team.bench || []) {
    if (!players[p.id]) {
      players[p.id] = {
        id: p.id,
        name: p.name,
        position: p.position,
        shirtNumber: p.shirtNumber,
        starts: 0,
        subApps: 0,
        minutesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        matches: [],
      };
    }
  }

  // Substitutions
  for (const sub of match.substitutions || []) {
    if (sub.team?.id !== teamId) continue;
    const minute = sub.minute || 90;

    if (players[sub.playerOut?.id]) {
      players[sub.playerOut.id].minutesPlayed = minute;
      const lastMatch = players[sub.playerOut.id].matches.at(-1);
      if (lastMatch) lastMatch.minutesPlayed = minute;
    }

    if (players[sub.playerIn?.id]) {
      const minsPlayed = 90 - minute;
      players[sub.playerIn.id].subApps = 1;
      players[sub.playerIn.id].minutesPlayed = minsPlayed;
      players[sub.playerIn.id].matches = [{
        ...baseMatchInfo,
        started: false,
        minutesPlayed: minsPlayed,
        cameOnMinute: minute,
      }];
    }
  }

  // Goals — store on player AND on their match entry
  for (const goal of match.goals || []) {
    if (goal.team?.id !== teamId) continue;

    if (players[goal.scorer?.id]) {
      players[goal.scorer.id].goals += 1;
      const lastMatch = players[goal.scorer.id].matches.at(-1);
      if (lastMatch) lastMatch.goals = (lastMatch.goals || 0) + 1;
    }

    if (goal.assist && players[goal.assist?.id]) {
      players[goal.assist.id].assists += 1;
      const lastMatch = players[goal.assist.id].matches.at(-1);
      if (lastMatch) lastMatch.assists = (lastMatch.assists || 0) + 1;
    }
  }

  // Bookings — store on player AND on their match entry
  for (const booking of match.bookings || []) {
    if (booking.team?.id !== teamId) continue;

    if (players[booking.player?.id]) {
      const isRed = booking.card === 'RED' || booking.card === 'YELLOW_RED';
      if (isRed) {
        players[booking.player.id].redCards += 1;
        const lastMatch = players[booking.player.id].matches.at(-1);
        if (lastMatch) lastMatch.redCards = (lastMatch.redCards || 0) + 1;
      } else {
        players[booking.player.id].yellowCards += 1;
        const lastMatch = players[booking.player.id].matches.at(-1);
        if (lastMatch) lastMatch.yellowCards = (lastMatch.yellowCards || 0) + 1;
      }
    }
  }

  return Object.values(players).filter(p => p.starts > 0 || p.subApps > 0);
}

export const maxDuration = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamId = parseInt(searchParams.get('teamId'));
  const competition = searchParams.get('competition') || 'all';

  if (!teamId) return Response.json({ error: 'teamId required' }, { status: 400 });

  const team = TEAMS.find(t => t.id === teamId);
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  const headers = { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY };

  try {
    // Check cache for raw stats (always cache the 'all' version)
    const rawCacheKey = `raw_${teamId}`;
    let playerStats = {};

    const cached = cache.get(rawCacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      playerStats = cached.playerStats;
    } else {
      // Fetch match list for last season
      const listData = await fetchWithRetry(
        `https://api.football-data.org/v4/competitions/${team.competition}/matches?season=2025&status=FINISHED`,
        headers
      );

      if (!listData) throw new Error('Failed to fetch match list');

      const teamMatches = (listData.matches || []).filter(m =>
        m.homeTeam?.id === teamId || m.awayTeam?.id === teamId
      );

      // Fetch match details in batches of 3
      const batchSize = 3;
      for (let i = 0; i < teamMatches.length; i += batchSize) {
        if (i > 0) await new Promise(r => setTimeout(r, 1000));
        const batch = teamMatches.slice(i, i + batchSize);

        const results = await Promise.all(
          batch.map(match => fetchWithRetry(
            `https://api.football-data.org/v4/matches/${match.id}`,
            {
              ...headers,
              'X-Unfold-Lineups': 'true',
              'X-Unfold-Goals': 'true',
              'X-Unfold-Bookings': 'true',
              'X-Unfold-Subs': 'true',
            }
          ))
        );

        for (const fullMatch of results) {
          if (!fullMatch) continue;
          const matchPlayers = processMatch(fullMatch, teamId);

          for (const p of matchPlayers) {
            if (!playerStats[p.id]) {
              playerStats[p.id] = { ...p, matches: [...p.matches] };
            } else {
              playerStats[p.id].starts += p.starts;
              playerStats[p.id].subApps += p.subApps;
              playerStats[p.id].minutesPlayed += p.minutesPlayed;
              playerStats[p.id].goals += p.goals;
              playerStats[p.id].assists += p.assists;
              playerStats[p.id].yellowCards += p.yellowCards;
              playerStats[p.id].redCards += p.redCards;
              playerStats[p.id].matches.push(...p.matches);
            }
          }
        }
      }

      // Cache raw stats
      cache.set(rawCacheKey, { playerStats, timestamp: Date.now() });
    }

    // Now apply competition filter
    let players = Object.values(playerStats);

    if (competition !== 'all') {
      players = players.map(p => {
        const compMatches = p.matches.filter(m => m.competition === competition);
        if (compMatches.length === 0) return null;
        return {
          ...p,
          matches: compMatches,
          starts: compMatches.filter(m => m.started).length,
          subApps: compMatches.filter(m => !m.started).length,
          minutesPlayed: compMatches.reduce((s, m) => s + (m.minutesPlayed || 0), 0),
          goals: compMatches.reduce((s, m) => s + (m.goals || 0), 0),
          assists: compMatches.reduce((s, m) => s + (m.assists || 0), 0),
          yellowCards: compMatches.reduce((s, m) => s + (m.yellowCards || 0), 0),
          redCards: compMatches.reduce((s, m) => s + (m.redCards || 0), 0),
        };
      }).filter(Boolean);
    }

    players.sort((a, b) =>
      (b.starts + b.subApps) - (a.starts + a.subApps) ||
      a.name.localeCompare(b.name)
    );

    return Response.json({ players, teamId, competition });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}