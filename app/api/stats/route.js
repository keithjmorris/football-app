import { TEAMS } from '@/lib/teams';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// In-memory cache to avoid repeated Firestore reads
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function aggregateTeamStats(matchStats) {
  if (!matchStats || matchStats.length === 0) return null;
  const count = matchStats.length;

  const totals = matchStats.reduce((acc, m) => ({
    wins: acc.wins + (m.result === 'W' ? 1 : 0),
    draws: acc.draws + (m.result === 'D' ? 1 : 0),
    losses: acc.losses + (m.result === 'L' ? 1 : 0),
    goalsFor: acc.goalsFor + m.goalsFor,
    goalsAgainst: acc.goalsAgainst + m.goalsAgainst,
    cleanSheets: acc.cleanSheets + (m.cleanSheet ? 1 : 0),
    possession: acc.possession + m.possession,
    shotsOnGoal: acc.shotsOnGoal + m.shotsOnGoal,
    shotsOffGoal: acc.shotsOffGoal + m.shotsOffGoal,
    shots: acc.shots + m.shots,
    saves: acc.saves + m.saves,
    corners: acc.corners + m.corners,
    fouls: acc.fouls + m.fouls,
    yellowCards: acc.yellowCards + m.yellowCards,
    redCards: acc.redCards + m.redCards,
  }), {
    wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, cleanSheets: 0,
    possession: 0, shotsOnGoal: 0, shotsOffGoal: 0,
    shots: 0, saves: 0, corners: 0, fouls: 0,
    yellowCards: 0, redCards: 0,
  });

  const form = matchStats
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(m => m.result)
    .reverse();

  return {
    played: count,
    wins: totals.wins,
    draws: totals.draws,
    losses: totals.losses,
    goalsFor: totals.goalsFor,
    goalsAgainst: totals.goalsAgainst,
    goalDifference: totals.goalsFor - totals.goalsAgainst,
    cleanSheets: totals.cleanSheets,
    points: totals.wins * 3 + totals.draws,
    pointsPerGame: ((totals.wins * 3 + totals.draws) / count).toFixed(2),
    avgPossession: Math.round(totals.possession / count),
    avgShotsOnGoal: (totals.shotsOnGoal / count).toFixed(1),
    avgShots: (totals.shots / count).toFixed(1),
    avgSaves: (totals.saves / count).toFixed(1),
    avgCorners: (totals.corners / count).toFixed(1),
    avgFouls: (totals.fouls / count).toFixed(1),
    totalYellowCards: totals.yellowCards,
    totalRedCards: totals.redCards,
    form,
    matches: matchStats.sort((a, b) => new Date(b.date) - new Date(a.date)),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamId = parseInt(searchParams.get('teamId'));
  const competition = searchParams.get('competition') || 'all';

  if (!teamId) return Response.json({ error: 'teamId required' }, { status: 400 });

  const team = TEAMS.find(t => t.id === teamId);
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  try {
    // Check in-memory cache first
    const rawCacheKey = `raw_${teamId}`;
    let playerStats = {};
    let teamMatchStats = [];

    const cached = cache.get(rawCacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      playerStats = cached.playerStats;
      teamMatchStats = cached.teamMatchStats;
    } else {
      // Read from Firestore
      const docRef = doc(db, 'player_stats', rawCacheKey);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        playerStats = data.playerStats || {};
        teamMatchStats = data.teamMatchStats || [];

        // Store in memory cache
        cache.set(rawCacheKey, {
          playerStats,
          teamMatchStats,
          timestamp: Date.now(),
        });
      }
    }

    // Apply competition filter
    let players = Object.values(playerStats);
    let filteredTeamMatchStats = teamMatchStats;

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

      filteredTeamMatchStats = teamMatchStats.filter(m => m.competition === competition);
    }

    players.sort((a, b) =>
      (b.starts + b.subApps) - (a.starts + a.subApps) ||
      a.name.localeCompare(b.name)
    );

    const teamStats = aggregateTeamStats(filteredTeamMatchStats);

    return Response.json({ players, teamStats, teamId, competition });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}