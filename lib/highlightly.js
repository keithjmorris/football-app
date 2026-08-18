// Highlightly API configuration
export const HIGHLIGHTLY_BASE = 'https://soccer.highlightly.net';

// Map football-data.org team IDs → Highlightly team IDs
export const TEAM_ID_MAP = {
  // Premier League teams
  57: 36526,    // Arsenal
  58: 56950,    // Aston Villa
  1044: 40750,  // Bournemouth
  402: 50807,   // Brentford
  397: 40749,   // Brighton
  61: 42483,    // Chelsea
  1076: 51618,  // Coventry
  354: 40753,   // Crystal Palace
  62: 40755,    // Everton
  63: 40757,    // Fulham
  322: 51290,   // Hull City
  349: 40760,   // Ipswich
  341: 54397,   // Leeds
  64: 34824,    // Liverpool - NOTE: verify this
  65: 40763,    // Man City
  66: 28867,    // Man United
  67: 40766,    // Newcastle
  351: 40768,   // Nottm Forest
  71: 40771,    // Sunderland
  73: 40773,    // Tottenham
  // Championship teams
  60: 58652,    // Bolton
};

// Reverse map: Highlightly ID → football-data.org ID
export const REVERSE_TEAM_MAP = Object.fromEntries(
  Object.entries(TEAM_ID_MAP).map(([fd, hl]) => [hl, parseInt(fd)])
);

// League IDs on Highlightly
export const LEAGUE_IDS = {
  PL: 33973,    // Premier League
  ELC: 34824,   // Championship
  FAC: 146305,  // FA Cup
  EFL: 41632,   // League Cup
};

// Convert Highlightly match status to football-data.org style
export function convertStatus(description) {
  switch (description) {
    case 'Finished':
    case 'Finished after penalties':
    case 'Finished after extra time':
      return 'FINISHED';
    case 'Not started': return 'TIMED';
    case 'First half':
    case 'Second half':
    case 'In progress': return 'IN_PLAY';
    case 'Half time': return 'PAUSED';
    case 'Extra time': return 'EXTRA_TIME';
    case 'Penalties': return 'PENALTY_SHOOTOUT';
    case 'Postponed': return 'POSTPONED';
    case 'Cancelled': return 'CANCELLED';
    case 'Suspended': return 'SUSPENDED';
    default: return 'SCHEDULED';
  }
}

// Convert Highlightly score string "2 - 1" to {home, away}
export function convertScore(scoreStr) {
  if (!scoreStr) return { home: null, away: null };
  const parts = scoreStr.split(' - ');
  return {
    home: parts[0] !== undefined ? parseInt(parts[0]) : null,
    away: parts[1] !== undefined ? parseInt(parts[1]) : null,
  };
}

// Convert a Highlightly match to our standard format
export function convertMatch(m, competitionCode) {
  const score = convertScore(m.state?.score?.current);
  const status = convertStatus(m.state?.description);

  return {
    id: m.id,
    utcDate: m.date,
    status,
    minute: m.state?.clock || null,
    competition: {
      name: m.league?.name || competitionCode,
      code: competitionCode || 'UNKNOWN',
    },
    homeTeam: {
      id: m.homeTeam?.id,
      name: m.homeTeam?.name,
      shortName: m.homeTeam?.name,
      crest: m.homeTeam?.logo,
      lineup: [],
      bench: [],
      formation: null,
      statistics: null,
    },
    awayTeam: {
      id: m.awayTeam?.id,
      name: m.awayTeam?.name,
      shortName: m.awayTeam?.name,
      crest: m.awayTeam?.logo,
      lineup: [],
      bench: [],
      formation: null,
      statistics: null,
    },
    score: {
      fullTime: score,
      halfTime: { home: null, away: null },
    },
    goals: [],
    bookings: [],
    substitutions: [],
    _highlightly: true,
  };
}

// Fetch helper
export async function fetchHighlightly(path, apiKey, revalidate = 60) {
  const res = await fetch(`${HIGHLIGHTLY_BASE}${path}`, {
    headers: { 'x-rapidapi-key': apiKey },
    next: { revalidate },
  });
  if (!res.ok) return null;
  return res.json();
}