import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
   apiKey: "AIzaSyAdELg_f_XTTRISr3D-ROZjChuzLeDjzjo",
  authDomain: "football-tracker-c9dae.firebaseapp.com",
  projectId: "football-tracker-c9dae",
  storageBucket: "football-tracker-c9dae.firebasestorage.app",
  messagingSenderId: "512352975737",
  appId: "1:512352975737:web:7cd68dad3b3e9aec54cda8"
};

const FOOTBALL_DATA_KEY = "f60422be72c645dfb2f1bade64df2999";

const TEAMS = [
  { id: 57, competition: 'PL', shortName: 'Arsenal' },
  { id: 61, competition: 'PL', shortName: 'Chelsea' },
  { id: 60, competition: 'ELC', shortName: 'Bolton' },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, headers) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers });
    if (r.status === 429) { await sleep(5000); continue; }
    const data = await r.json();
    if (data.message) { await sleep(2000); continue; }
    return data;
  }
  return null;
}

function processMatch(match, teamId) {
  if (!match?.homeTeam || !match?.awayTeam) return { players: [], teamStats: null };
  const isHome = match.homeTeam.id === teamId;
  const team = isHome ? match.homeTeam : match.awayTeam;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const competition = match.competition?.code || 'UNKNOWN';

  const baseMatchInfo = {
    id: match.id,
    date: match.utcDate,
    opponent: opponent?.shortName || opponent?.name,
    homeAway: isHome ? 'H' : 'A',
    score: `${match.score?.fullTime?.home}-${match.score?.fullTime?.away}`,
    competition,
    goals: 0, assists: 0, yellowCards: 0, redCards: 0,
  };

  const players = {};

  for (const p of team.lineup || []) {
    players[p.id] = {
      id: p.id, name: p.name, position: p.position, shirtNumber: p.shirtNumber,
      starts: 1, subApps: 0, minutesPlayed: 90,
      goals: 0, assists: 0, yellowCards: 0, redCards: 0,
      matches: [{ ...baseMatchInfo, started: true, minutesPlayed: 90 }],
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
      const last = players[sub.playerOut.id].matches.at(-1);
      if (last) last.minutesPlayed = minute;
    }
    if (players[sub.playerIn?.id]) {
      players[sub.playerIn.id].subApps = 1;
      players[sub.playerIn.id].minutesPlayed = 90 - minute;
      players[sub.playerIn.id].matches = [{
        ...baseMatchInfo, started: false,
        minutesPlayed: 90 - minute, cameOnMinute: minute,
      }];
    }
  }

  for (const goal of match.goals || []) {
    if (goal.team?.id !== teamId) continue;
    if (players[goal.scorer?.id]) {
      players[goal.scorer.id].goals += 1;
      const last = players[goal.scorer.id].matches.at(-1);
      if (last) last.goals = (last.goals || 0) + 1;
    }
    if (goal.assist && players[goal.assist?.id]) {
      players[goal.assist.id].assists += 1;
      const last = players[goal.assist.id].matches.at(-1);
      if (last) last.assists = (last.assists || 0) + 1;
    }
  }

  for (const booking of match.bookings || []) {
    if (booking.team?.id !== teamId) continue;
    if (players[booking.player?.id]) {
      const isRed = booking.card === 'RED' || booking.card === 'YELLOW_RED';
      if (isRed) {
        players[booking.player.id].redCards += 1;
        const last = players[booking.player.id].matches.at(-1);
        if (last) last.redCards = (last.redCards || 0) + 1;
      } else {
        players[booking.player.id].yellowCards += 1;
        const last = players[booking.player.id].matches.at(-1);
        if (last) last.yellowCards = (last.yellowCards || 0) + 1;
      }
    }
  }

  // Team stats
  const stats = team?.statistics;
  const homeScore = match.score?.fullTime?.home ?? 0;
  const awayScore = match.score?.fullTime?.away ?? 0;
  const teamScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;
  const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';

  const teamStats = stats ? {
    competition,
    date: match.utcDate,
    opponent: opponent?.shortName || opponent?.name,
    homeAway: isHome ? 'H' : 'A',
    result,
    goalsFor: teamScore,
    goalsAgainst: oppScore,
    cleanSheet: oppScore === 0,
    possession: stats.ball_possession || 0,
    shotsOnGoal: stats.shots_on_goal || 0,
    shotsOffGoal: stats.shots_off_goal || 0,
    shots: stats.shots || 0,
    saves: stats.saves || 0,
    corners: stats.corner_kicks || 0,
    fouls: stats.fouls || 0,
    offsides: stats.offsides || 0,
    yellowCards: stats.yellow_cards || 0,
    redCards: stats.red_cards || 0,
  } : null;

  return {
    players: Object.values(players).filter(p => p.starts > 0 || p.subApps > 0),
    teamStats,
  };
}

async function processTeam(team) {
  console.log(`\nProcessing ${team.shortName}...`);

  const headers = { 'X-Auth-Token': FOOTBALL_DATA_KEY };

  const listData = await fetchWithRetry(
    `https://api.football-data.org/v4/competitions/${team.competition}/matches?season=2025&status=FINISHED`,
    headers
  );

  if (!listData) { console.log('Failed to fetch match list'); return; }

  const teamMatches = (listData.matches || []).filter(m =>
    m.homeTeam?.id === team.id || m.awayTeam?.id === team.id
  );

  console.log(`Found ${teamMatches.length} matches`);

  const playerStats = {};
  const teamMatchStats = [];

  for (let i = 0; i < teamMatches.length; i++) {
    const match = teamMatches[i];
    console.log(`Fetching match ${i + 1}/${teamMatches.length}: ${match.homeTeam?.shortName} vs ${match.awayTeam?.shortName}`);

    const fullMatch = await fetchWithRetry(
      `https://api.football-data.org/v4/matches/${match.id}`,
      {
        ...headers,
        'X-Unfold-Lineups': 'true',
        'X-Unfold-Goals': 'true',
        'X-Unfold-Bookings': 'true',
        'X-Unfold-Subs': 'true',
      }
    );

    if (!fullMatch) { console.log('  Skipped'); continue; }

    const { players, teamStats } = processMatch(fullMatch, team.id);
    if (teamStats) teamMatchStats.push(teamStats);

    for (const p of players) {
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

    // Respect rate limit — 6 seconds between requests
    if (i < teamMatches.length - 1) await sleep(6000);
  }

  // Save to Firestore
  const cacheKey = `raw_${team.id}`;
  await setDoc(doc(db, 'player_stats', cacheKey), {
    playerStats,
    teamMatchStats,
    updatedAt: new Date().toISOString(),
  });

  console.log(`✅ Saved ${Object.keys(playerStats).length} players and ${teamMatchStats.length} match stats for ${team.shortName}`);
}

async function main() {
  console.log('Starting stats population...');
  for (const team of TEAMS) {
    await processTeam(team);
  }
  console.log('\n✅ All done!');
  process.exit(0);
}

main().catch(console.error);