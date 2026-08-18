import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdELg_f_XTTRISr3D-ROZjChuzLeDjzjo",
  authDomain: "football-tracker-c9dae.firebaseapp.com",
  projectId: "football-tracker-c9dae",
  storageBucket: "football-tracker-c9dae.firebasestorage.app",
  messagingSenderId: "512352975737",
  appId: "1:512352975737:web:7cd68dad3b3e9aec54cda8",
};

const HIGHLIGHTLY_KEY = '38fc70e4-38e9-42af-96cc-f1566cdf2c1e';
const SEASON = 2026;
const SEASON_START = '2026-08-08'; // Filter out preseason

// Team mapping: football-data ID → Highlightly ID
const TEAMS = [
  { fdId: 57,  hlId: 36526, name: 'Arsenal',    competition: 'PL' },
  { fdId: 61,  hlId: 42483, name: 'Chelsea',     competition: 'PL' },
  { fdId: 60,  hlId: 58652, name: 'Bolton',      competition: 'ELC' },
  { fdId: 341, hlId: 54397, name: 'Leeds United', competition: 'PL' },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchHL(path) {
  const res = await fetch(`https://soccer.highlightly.net${path}`, {
    headers: { 'x-rapidapi-key': HIGHLIGHTLY_KEY },
  });
  if (!res.ok) {
    console.warn(`Failed to fetch ${path}: ${res.status}`);
    return null;
  }
  return res.json();
}

function processMatch(match, events, lineups, statistics, boxScore, teamHlId, teamFdId) {
  const isHome = match.homeTeam?.id === teamHlId;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const teamLineup = isHome ? lineups?.homeTeam : lineups?.awayTeam;

  const compCode = match.league?.id === 33973 ? 'PL' :
                   match.league?.id === 34824 ? 'ELC' :
                   match.league?.id === 41632 ? 'EFL' :
                   match.league?.id === 146305 ? 'FAC' : 'OTHER';

  const scoreStr = match.state?.score?.current;
  const scoreParts = scoreStr ? scoreStr.split(' - ') : [null, null];
  const homeScore = scoreParts[0] !== null ? parseInt(scoreParts[0]) : null;
  const awayScore = scoreParts[1] !== null ? parseInt(scoreParts[1]) : null;
  const teamScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;

  const baseMatchInfo = {
    id: match.id,
    date: match.date,
    opponent: opponent?.name,
    homeAway: isHome ? 'H' : 'A',
    score: `${homeScore}-${awayScore}`,
    competition: compCode,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    xg: 0,
    passes: 0,
    passAccuracy: 0,
    tackles: 0,
  };

  const players = {};

  // Process starting lineup
  const startingXI = (teamLineup?.initialLineup || []).flat();
  for (const p of startingXI) {
    players[p.id] = {
      id: p.id,
      name: p.name,
      position: p.position,
      shirtNumber: p.number,
      starts: 1,
      subApps: 0,
      minutesPlayed: 90,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      matches: [{ ...baseMatchInfo, started: true, minutesPlayed: 90 }],
    };

    // Add player box score stats
  for (const teamData of Array.isArray(boxScore) ? boxScore : []) {
    if (teamData.team?.id !== teamHlId) continue;
    for (const bsPlayer of teamData.players || []) {
      const ps = bsPlayer.statistics || {};
const player = Object.values(players).find(p => p.name === bsPlayer.name);
if (player && player.matches.length > 0) {
  const lastMatch = player.matches.at(-1);
  lastMatch.xg = ps.expectedGoals || 0;
  lastMatch.passes = ps.passesTotal || 0;
  lastMatch.passAccuracy = ps.passesAccuracy ? parseFloat(ps.passesAccuracy) : 0;
  lastMatch.tackles = ps.tacklesTotal || 0;
  player.xg = (player.xg || 0) + (ps.expectedGoals || 0);
  player.passes = (player.passes || 0) + (ps.passesTotal || 0);
  player.tackles = (player.tackles || 0) + (ps.tacklesTotal || 0);
}
    }
  }
  }

  // Process bench
  for (const p of teamLineup?.substitutes || []) {
    if (!players[p.id]) {
      players[p.id] = {
        id: p.id,
        name: p.name,
        position: p.position,
        shirtNumber: p.number,
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

  // Process events
  for (const e of events || []) {
    if (!e.team || e.team.id !== teamHlId) continue;
    const minute = parseInt(e.time) || 0;

    if (e.type === 'Substitution') {
      // Find player going off by name
      const outPlayer = Object.values(players).find(p => p.name === e.substituted);
      const inPlayer = Object.values(players).find(p => p.name === e.player);

      if (outPlayer) {
        outPlayer.minutesPlayed = minute;
        const last = outPlayer.matches.at(-1);
        if (last) last.minutesPlayed = minute;
      }
      if (inPlayer) {
        inPlayer.subApps = 1;
        inPlayer.minutesPlayed = 90 - minute;
        inPlayer.matches = [{
          ...baseMatchInfo,
          started: false,
          minutesPlayed: 90 - minute,
          cameOnMinute: minute,
        }];
      }
    } else if (e.type === 'Goal' || e.type === 'Penalty') {
      const scorer = Object.values(players).find(p => p.name === e.player);
      if (scorer) {
        scorer.goals += 1;
        const last = scorer.matches.at(-1);
        if (last) last.goals = (last.goals || 0) + 1;
      }
      if (e.assist) {
        const assister = Object.values(players).find(p => p.name === e.assist);
        if (assister) {
          assister.assists += 1;
          const last = assister.matches.at(-1);
          if (last) last.assists = (last.assists || 0) + 1;
        }
      }
    } else if (e.type === 'Yellow Card') {
      const player = Object.values(players).find(p => p.name === e.player);
      if (player) {
        player.yellowCards += 1;
        const last = player.matches.at(-1);
        if (last) last.yellowCards = (last.yellowCards || 0) + 1;
      }
    } else if (e.type === 'Red Card' || e.type === 'Yellow Card/Red Card') {
      const player = Object.values(players).find(p => p.name === e.player);
      if (player) {
        player.redCards += 1;
        const last = player.matches.at(-1);
        if (last) last.redCards = (last.redCards || 0) + 1;
      }
    }
  }

  // Extract team statistics
  const statsArr = Array.isArray(statistics) ? statistics : [];
  const teamStatData = statsArr.find(t => t.team?.id === teamHlId);
  const s = {};
  for (const stat of teamStatData?.statistics || []) {
    s[stat.displayName] = stat.value;
  }

  // Extract box score aggregates for team
  const teamBoxScore = Array.isArray(boxScore)
    ? boxScore.find(t => t.team?.id === teamHlId)
    : null;

  let totalPasses = 0, successfulPasses = 0, totalTackles = 0, totalXg = 0;
  for (const player of teamBoxScore?.players || []) {
   const ps = player.statistics || {};
totalPasses += ps.passesTotal || 0;
successfulPasses += ps.passesSuccessful || 0;
totalTackles += ps.tacklesTotal || 0;
totalXg += ps.expectedGoals || 0;
    }
  }
  const passAccuracy = totalPasses > 0
    ? Math.round((successfulPasses / totalPasses) * 100)
    : 0;

  const teamStats = {
    competition: compCode,
    date: match.date,
    opponent: opponent?.name,
    homeAway: isHome ? 'H' : 'A',
    result: teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D',
    goalsFor: teamScore || 0,
    goalsAgainst: oppScore || 0,
    cleanSheet: oppScore === 0,
    possession: s['Possession'] || 0,
    shotsOnGoal: s['Shots on target'] || 0,
    shotsOffGoal: s['Shots off target'] || 0,
    shots: (s['Shots on target'] || 0) + (s['Shots off target'] || 0) + (s['Blocked shots'] || 0),
    saves: s['Goalkeeper saves'] || 0,
    corners: s['Corners'] || 0,
    fouls: s['Fouls'] || 0,
    yellowCards: s['Yellow cards'] || 0,
    redCards: s['Red cards'] || 0,
    xg: totalXg,
    totalPasses,
    passAccuracy,
    tackles: totalTackles,
  };

  return {
    players: Object.values(players).filter(p => p.starts > 0 || p.subApps > 0),
    teamStats,
  };
}

async function processTeam(team) {
  console.log(`\nProcessing ${team.name}...`);

  // Load existing Firestore data
  const docKey = `raw_${team.fdId}_${SEASON}`;
  const docRef = doc(db, 'player_stats', docKey);
  const existing = await getDoc(docRef);

  let playerStats = {};
  let teamMatchStats = [];
  const processedMatchIds = new Set();

  if (existing.exists()) {
    const data = existing.data();
    playerStats = data.playerStats || {};
    teamMatchStats = data.teamMatchStats || [];
    // Track already processed matches
    teamMatchStats.forEach(m => processedMatchIds.add(m.id));
    console.log(`Found ${teamMatchStats.length} existing matches in Firestore`);
  }

  // Fetch home and away matches
  const [homeData, awayData] = await Promise.all([
    fetchHL(`/matches?homeTeamId=${team.hlId}&season=${SEASON}&limit=100`),
    fetchHL(`/matches?awayTeamId=${team.hlId}&season=${SEASON}&limit=100`),
  ]);

  // Only include competitive matches from known leagues
const COMPETITIVE_LEAGUE_IDS = [33973, 34824, 41632, 146305]; // PL, Championship, League Cup, FA Cup

const allMatches = [
  ...(homeData?.data || []),
  ...(awayData?.data || []),
].filter(m =>
  (m.state?.description === 'Finished' ||
  m.state?.description === 'Finished after penalties' ||
  m.state?.description === 'Finished after extra time') &&
  COMPETITIVE_LEAGUE_IDS.includes(m.league?.id) &&
  new Date(m.date) >= new Date(SEASON_START)
);

  // Deduplicate
  const seen = new Set();
  const uniqueMatches = allMatches.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  // Find new matches not yet in Firestore
  const newMatches = uniqueMatches.filter(m => !processedMatchIds.has(String(m.id)));
  console.log(`Found ${uniqueMatches.length} finished matches, ${newMatches.length} new`);

  if (newMatches.length === 0) {
    console.log(`✅ ${team.name} already up to date`);
    return;
  }

  // Process each new match
  for (let i = 0; i < newMatches.length; i++) {
    const match = newMatches[i];
    console.log(`Fetching match ${i + 1}/${newMatches.length}: ${match.homeTeam?.name} vs ${match.awayTeam?.name} (${match.date?.substring(0, 10)})`);

    await sleep(500); // Small delay to avoid rate limiting

    const [events, lineups, statistics, boxScore] = await Promise.all([
  fetchHL(`/events/${match.id}`),
  fetchHL(`/lineups/${match.id}`),
  fetchHL(`/statistics/${match.id}`),
  fetchHL(`/box-score/${match.id}`),
]);

const { players, teamStats } = processMatch(match, events, lineups, statistics, boxScore, team.hlId, team.fdId);

    // Add match ID to teamStats for tracking
    teamStats.id = String(match.id);

    // Merge player stats
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

    teamMatchStats.push(teamStats);
  }

  // Save to Firestore
  await setDoc(docRef, {
    playerStats,
    teamMatchStats,
    updatedAt: new Date().toISOString(),
  });

  console.log(`✅ Saved ${Object.keys(playerStats).length} players and ${teamMatchStats.length} total matches for ${team.name}`);
}

async function main() {
  console.log('Populating 2026/27 stats from Highlightly...');
  for (const team of TEAMS) {
    await processTeam(team);
  }
  console.log('\n✅ All done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});