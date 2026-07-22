import { TEAMS } from '@/lib/teams';

function processMatch(match, teamId) {
  if (!match || !match.homeTeam || !match.awayTeam) return [];
  const isHome = match.homeTeam?.id === teamId;
  const team = isHome ? match.homeTeam : match.awayTeam;
  const players = {};

  const competition = match.competition?.code || 'UNKNOWN';
  const matchInfo = {
    id: match.id,
    date: match.utcDate,
    opponent: isHome ? match.awayTeam?.shortName : match.homeTeam?.shortName,
    homeAway: isHome ? 'H' : 'A',
    score: `${match.score?.fullTime?.home}-${match.score?.fullTime?.away}`,
    competition,
  };

  for (const p of team.lineup || []) {
    players[p.id] = {
      id: p.id, name: p.name, position: p.position, shirtNumber: p.shirtNumber,
      starts: 1, subApps: 0, minutesPlayed: 90,
      goals: 0, assists: 0, yellowCards: 0, redCards: 0,
      matches: [{ ...matchInfo, started: true, minutesPlayed: 90 }],
    };
  }

  for (const p of team.bench || []) {
    if (!players[p.id]) {
      players[p.id] = {
        id: p.id, name: p.name, position: p.position, shirtNumber: p.shirtNumber,
        starts: 0, subApps: 0, minutesPlayed: 0,
        goals: 0, assists: 0, yellowCards: 0, redCards: 0,
        matches: [],
      };
    }
  }

  for (const sub of match.substitutions || []) {
    if (sub.team?.id !== teamId) continue;
    const minute = sub.minute || 90;
    if (players[sub.playerOut?.id]) {
      players[sub.playerOut.id].minutesPlayed = minute;
      if (players[sub.playerOut.id].matches.length > 0) {
        players[sub.playerOut.id].matches[players[sub.playerOut.id].matches.length - 1].minutesPlayed = minute;
      }
    }
    if (players[sub.playerIn?.id]) {
      players[sub.playerIn.id].subApps = 1;
      players[sub.playerIn.id].minutesPlayed = 90 - minute;
      players[sub.playerIn.id].matches = [{
        ...matchInfo, started: false,
        minutesPlayed: 90 - minute, cameOnMinute: minute,
      }];
    }
  }

  for (const goal of match.goals || []) {
    if (goal.team?.id !== teamId) continue;
    if (players[goal.scorer?.id]) players[goal.scorer.id].goals += 1;
    if (goal.assist && players[goal.assist?.id]) players[goal.assist.id].assists += 1;
  }

  for (const booking of match.bookings || []) {
    if (booking.team?.id !== teamId) continue;
    if (players[booking.player?.id]) {
      if (booking.card === 'YELLOW') players[booking.player.id].yellowCards += 1;
      if (booking.card === 'RED' || booking.card === 'YELLOW_RED') players[booking.player.id].redCards += 1;
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

  try {
    // Fetch match list
    const listRes = await fetch(
      `https://api.football-data.org/v4/competitions/${team.competition}/matches?season=2025&status=FINISHED`,
      { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY } }
    );

    if (!listRes.ok) throw new Error(`Match list error: ${listRes.status}`);
    const listData = await listRes.json();

    const teamMatches = (listData.matches || []).filter(m =>
      m.homeTeam?.id === teamId || m.awayTeam?.id === teamId
    );

    // Fetch match details in parallel batches of 5
    const playerStats = {};
    const batchSize = 5;

    for (let i = 0; i < teamMatches.length; i += batchSize) {
      const batch = teamMatches.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(match =>
          fetch(`https://api.football-data.org/v4/matches/${match.id}`, {
            headers: {
              'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
              'X-Unfold-Lineups': 'true',
              'X-Unfold-Goals': 'true',
              'X-Unfold-Bookings': 'true',
              'X-Unfold-Subs': 'true',
            },
          }).then(r => r.json()).catch(() => null)
        )
      );

      for (const fullMatch of results) {
        if (!fullMatch || fullMatch.error) continue;
        const matchPlayers = processMatch(fullMatch, teamId);
        for (const p of matchPlayers) {
          if (!playerStats[p.id]) {
            playerStats[p.id] = { ...p, matches: [] };
          } else {
            playerStats[p.id].starts += p.starts;
            playerStats[p.id].subApps += p.subApps;
            playerStats[p.id].minutesPlayed += p.minutesPlayed;
            playerStats[p.id].goals += p.goals;
            playerStats[p.id].assists += p.assists;
            playerStats[p.id].yellowCards += p.yellowCards;
            playerStats[p.id].redCards += p.redCards;
          }
          playerStats[p.id].matches.push(...p.matches);
        }
      }
    }

    let players = Object.values(playerStats);

    if (competition !== 'all') {
      players = players.map(p => {
        const compMatches = p.matches.filter(m => m.competition === competition);
        return {
          ...p,
          matches: compMatches,
          starts: compMatches.filter(m => m.started).length,
          subApps: compMatches.filter(m => !m.started).length,
          minutesPlayed: compMatches.reduce((s, m) => s + m.minutesPlayed, 0),
        };
      }).filter(p => p.starts > 0 || p.subApps > 0);
    }

    players.sort((a, b) =>
      (b.starts + b.subApps) - (a.starts + a.subApps) || a.name.localeCompare(b.name)
    );

    return Response.json({ players, teamId, competition });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}