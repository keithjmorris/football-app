import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const HIGHLIGHTLY_KEY = process.env.HIGHLIGHTLY_API_KEY;
const SEASON = 2026;
const SEASON_START = '2026-08-08';

const TEAMS = [
  { fdId: 57,  hlId: 36526, name: 'Arsenal',    competition: 'PL' },
  { fdId: 61,  hlId: 42483, name: 'Chelsea',     competition: 'PL' },
  { fdId: 60,  hlId: 58652, name: 'Bolton',      competition: 'ELC' },
  { fdId: 341, hlId: 54397, name: 'Leeds United', competition: 'PL' },
];

const COMPETITIVE_LEAGUE_IDS = [33973, 34824, 41632, 146305];

async function fetchHL(path) {
  const res = await fetch(`https://soccer.highlightly.net${path}`, {
    headers: { 'x-rapidapi-key': HIGHLIGHTLY_KEY },
  });
  if (!res.ok) return null;
  return res.json();
}

function findPlayer(players, name) {
  if (!name) return null;
  return Object.values(players).find(p => {
    if (p.name === name) return true;
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0].endsWith('.')) {
      const initial = parts[0][0].toUpperCase();
      const lastName = parts.slice(1).join(' ').toLowerCase();
      return p.name.startsWith(initial) && p.name.toLowerCase().includes(lastName);
    }
    return false;
  });
}

function processMatch(match, events, lineups, statistics, boxScore, teamHlId) {
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
    id: match.id, date: match.date, opponent: opponent?.name,
    homeAway: isHome ? 'H' : 'A', score: `${homeScore}-${awayScore}`,
    competition: compCode, goals: 0, assists: 0, yellowCards: 0, redCards: 0,
    xg: 0, passes: 0, passAccuracy: 0, tackles: 0,
  };

  const players = {};

  const startingXI = (teamLineup?.initialLineup || []).flat();
  for (const p of startingXI) {
    players[p.id] = {
      id: p.id, name: p.name, position: p.position, shirtNumber: p.number,
      starts: 1, subApps: 0, minutesPlayed: 90,
      goals: 0, assists: 0, yellowCards: 0, redCards: 0,
      xg: 0, passes: 0, tackles: 0,
      matches: [{ ...baseMatchInfo, started: true, minutesPlayed: 90 }],
    };
  }

  for (const p of teamLineup?.substitutes || []) {
    if (!players[p.id]) {
      players[p.id] = {
        id: p.id, name: p.name, position: p.position, shirtNumber: p.number,
        starts: 0, subApps: 0, minutesPlayed: 0,
        goals: 0, assists: 0, yellowCards: 0, redCards: 0,
        xg: 0, passes: 0, tackles: 0, matches: [],
      };
    }
  }

  for (const e of events || []) {
    if (!e.team || e.team.id !== teamHlId) continue;
    const minute = parseInt(e.time) || 0;

    if (e.type === 'Substitution') {
      const outPlayer = findPlayer(players, e.player);
      const inPlayer = findPlayer(players, e.substituted);
      if (outPlayer) {
        outPlayer.minutesPlayed = minute;
        const last = outPlayer.matches.at(-1);
        if (last) last.minutesPlayed = minute;
      }
      if (inPlayer) {
        inPlayer.subApps += 1;
        inPlayer.minutesPlayed += 90 - minute;
        inPlayer.matches.push({
          ...baseMatchInfo, started: false,
          minutesPlayed: 90 - minute, cameOnMinute: minute,
        });
      }
    } else if (e.type === 'Goal' || e.type === 'Penalty') {
      const scorer = findPlayer(players, e.player);
      if (scorer) {
        scorer.goals += 1;
        const last = scorer.matches.at(-1);
        if (last) last.goals = (last.goals || 0) + 1;
      }
      if (e.assist) {
        const assister = findPlayer(players, e.assist);
        if (assister) {
          assister.assists += 1;
          const last = assister.matches.at(-1);
          if (last) last.assists = (last.assists || 0) + 1;
        }
      }
    } else if (e.type === 'Yellow Card') {
      const player = findPlayer(players, e.player);
      if (player) {
        player.yellowCards += 1;
        const last = player.matches.at(-1);
        if (last) last.yellowCards = (last.yellowCards || 0) + 1;
      }
    } else if (e.type === 'Red Card' || e.type === 'Yellow Card/Red Card') {
      const player = findPlayer(players, e.player);
      if (player) {
        player.redCards += 1;
        const last = player.matches.at(-1);
        if (last) last.redCards = (last.redCards || 0) + 1;
      }
    }
  }

  // Box score player stats
  for (const teamData of Array.isArray(boxScore) ? boxScore : []) {
    if (teamData.team?.id !== teamHlId) continue;
    for (const bsPlayer of teamData.players || []) {
      const ps = bsPlayer.statistics || {};
      const player = findPlayer(players, bsPlayer.name);
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

  // Team statistics
  const statsArr = Array.isArray(statistics) ? statistics : [];
  const teamStatData = statsArr.find(t => t.team?.id === teamHlId);
  const s = {};
  for (const stat of teamStatData?.statistics || []) {
    s[stat.displayName] = stat.value;
  }

  const teamBoxScore = Array.isArray(boxScore)
    ? boxScore.find(t => t.team?.id === teamHlId) : null;

  let totalPasses = 0, successfulPasses = 0, totalTackles = 0, totalXg = 0;
  for (const player of teamBoxScore?.players || []) {
    const ps = player.statistics || {};
    totalPasses += ps.passesTotal || 0;
    successfulPasses += ps.passesSuccessful || 0;
    totalTackles += ps.tacklesTotal || 0;
    totalXg += ps.expectedGoals || 0;
  }

  const passAccuracy = totalPasses > 0
    ? Math.round((successfulPasses / totalPasses) * 100) : 0;

  const teamStats = {
    competition: compCode, date: match.date, opponent: opponent?.name,
    homeAway: isHome ? 'H' : 'A',
    result: teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D',
    goalsFor: teamScore || 0, goalsAgainst: oppScore || 0,
    cleanSheet: oppScore === 0,
    possession: (() => { const p = s['Possession'] || 0; return p < 1 ? Math.round(p * 100) : p; })(),
    shotsOnGoal: s['Shots on target'] || 0,
    shotsOffGoal: s['Shots off target'] || 0,
    shots: (s['Shots on target'] || 0) + (s['Shots off target'] || 0) + (s['Blocked shots'] || 0),
    saves: s['Goalkeeper saves'] || 0,
    corners: s['Corners'] || 0, fouls: s['Fouls'] || 0,
    yellowCards: s['Yellow cards'] || 0, redCards: s['Red cards'] || 0,
    xg: totalXg, totalPasses, passAccuracy, tackles: totalTackles,
    id: String(match.id),
  };

  return {
    players: Object.values(players).filter(p => p.starts > 0 || p.subApps > 0),
    teamStats,
  };
}

async function populateTeam(db, team) {
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
    teamMatchStats.forEach(m => processedMatchIds.add(m.id));
  }

  const [homeData, awayData] = await Promise.all([
    fetchHL(`/matches?homeTeamId=${team.hlId}&season=${SEASON}&limit=100`),
    fetchHL(`/matches?awayTeamId=${team.hlId}&season=${SEASON}&limit=100`),
  ]);

  const seen = new Set();
  const allMatches = [
    ...(homeData?.data || []),
    ...(awayData?.data || []),
  ].filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return (
      (m.state?.description === 'Finished' ||
       m.state?.description === 'Finished after penalties' ||
       m.state?.description === 'Finished after extra time') &&
      COMPETITIVE_LEAGUE_IDS.includes(m.league?.id) &&
      new Date(m.date) >= new Date(SEASON_START)
    );
  });

  const newMatches = allMatches.filter(m => !processedMatchIds.has(String(m.id)));

  if (newMatches.length === 0) return { team: team.name, new: 0 };

  for (const match of newMatches) {
    await new Promise(r => setTimeout(r, 300));
    const [events, lineups, statistics, boxScore] = await Promise.all([
      fetchHL(`/events/${match.id}`),
      fetchHL(`/lineups/${match.id}`),
      fetchHL(`/statistics/${match.id}`),
      fetchHL(`/box-score/${match.id}`),
    ]);

    const { players, teamStats } = processMatch(match, events, lineups, statistics, boxScore, team.hlId);

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
        playerStats[p.id].xg = (playerStats[p.id].xg || 0) + (p.xg || 0);
        playerStats[p.id].passes = (playerStats[p.id].passes || 0) + (p.passes || 0);
        playerStats[p.id].tackles = (playerStats[p.id].tackles || 0) + (p.tackles || 0);
        playerStats[p.id].matches.push(...p.matches);
      }
    }
    teamMatchStats.push(teamStats);
  }

  await setDoc(docRef, {
    playerStats, teamMatchStats,
    updatedAt: new Date().toISOString(),
  });

  return { team: team.name, new: newMatches.length };
}

export const maxDuration = 300;

export async function GET(request) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const results = [];
  for (const team of TEAMS) {
    try {
      const result = await populateTeam(db, team);
      results.push(result);
    } catch (err) {
      results.push({ team: team.name, error: err.message });
    }
  }

  return Response.json({ success: true, results, timestamp: new Date().toISOString() });
}