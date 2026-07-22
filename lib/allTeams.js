// All Premier League teams 2026/27
export const PL_TEAMS = [
  { id: 57,   name: 'Arsenal FC',              shortName: 'Arsenal',       tla: 'ARS', crest: 'https://crests.football-data.org/57.png',           competition: 'PL', competitionId: 2021 },
  { id: 58,   name: 'Aston Villa FC',          shortName: 'Aston Villa',   tla: 'AVL', crest: 'https://crests.football-data.org/58.png',           competition: 'PL', competitionId: 2021 },
  { id: 1044, name: 'AFC Bournemouth',         shortName: 'Bournemouth',   tla: 'BOU', crest: 'https://crests.football-data.org/bournemouth.png',  competition: 'PL', competitionId: 2021 },
  { id: 402,  name: 'Brentford FC',            shortName: 'Brentford',     tla: 'BRE', crest: 'https://crests.football-data.org/402.png',          competition: 'PL', competitionId: 2021 },
  { id: 397,  name: 'Brighton & Hove Albion',  shortName: 'Brighton',      tla: 'BHA', crest: 'https://crests.football-data.org/397.png',          competition: 'PL', competitionId: 2021 },
  { id: 61,   name: 'Chelsea FC',              shortName: 'Chelsea',       tla: 'CHE', crest: 'https://crests.football-data.org/61.png',           competition: 'PL', competitionId: 2021 },
  { id: 1076, name: 'Coventry City FC',        shortName: 'Coventry',      tla: 'COV', crest: 'https://crests.football-data.org/1076.png',         competition: 'PL', competitionId: 2021 },
  { id: 354,  name: 'Crystal Palace FC',       shortName: 'Crystal Palace',tla: 'CRY', crest: 'https://crests.football-data.org/354.png',          competition: 'PL', competitionId: 2021 },
  { id: 62,   name: 'Everton FC',              shortName: 'Everton',       tla: 'EVE', crest: 'https://crests.football-data.org/62.png',           competition: 'PL', competitionId: 2021 },
  { id: 63,   name: 'Fulham FC',               shortName: 'Fulham',        tla: 'FUL', crest: 'https://crests.football-data.org/63.png',           competition: 'PL', competitionId: 2021 },
  { id: 322,  name: 'Hull City AFC',           shortName: 'Hull City',     tla: 'HUL', crest: 'https://crests.football-data.org/322.png',          competition: 'PL', competitionId: 2021 },
  { id: 349,  name: 'Ipswich Town FC',         shortName: 'Ipswich',       tla: 'IPS', crest: 'https://crests.football-data.org/349.png',          competition: 'PL', competitionId: 2021 },
  { id: 341,  name: 'Leeds United FC',         shortName: 'Leeds United',  tla: 'LEE', crest: 'https://crests.football-data.org/341.png',          competition: 'PL', competitionId: 2021 },
  { id: 64,   name: 'Liverpool FC',            shortName: 'Liverpool',     tla: 'LIV', crest: 'https://crests.football-data.org/64.png',           competition: 'PL', competitionId: 2021 },
  { id: 65,   name: 'Manchester City FC',      shortName: 'Man City',      tla: 'MCI', crest: 'https://crests.football-data.org/65.png',           competition: 'PL', competitionId: 2021 },
  { id: 66,   name: 'Manchester United FC',    shortName: 'Man United',    tla: 'MUN', crest: 'https://crests.football-data.org/66.png',           competition: 'PL', competitionId: 2021 },
  { id: 67,   name: 'Newcastle United FC',     shortName: 'Newcastle',     tla: 'NEW', crest: 'https://crests.football-data.org/67.png',           competition: 'PL', competitionId: 2021 },
  { id: 351,  name: 'Nottingham Forest FC',    shortName: 'Nottingham',    tla: 'NOT', crest: 'https://crests.football-data.org/351.png',          competition: 'PL', competitionId: 2021 },
  { id: 71,   name: 'Sunderland AFC',          shortName: 'Sunderland',    tla: 'SUN', crest: 'https://crests.football-data.org/71.png',           competition: 'PL', competitionId: 2021 },
  { id: 73,   name: 'Tottenham Hotspur FC',    shortName: 'Tottenham',     tla: 'TOT', crest: 'https://crests.football-data.org/73.png',           competition: 'PL', competitionId: 2021 },
];

// Championship teams — ready to enable when needed
export const ELC_TEAMS = [
  { id: 60, name: 'Bolton Wanderers FC', shortName: 'Bolton', tla: 'BOL', crest: 'https://crests.football-data.org/60.png', competition: 'ELC', competitionId: 2016 },
  // Add more Championship teams here as needed
];

// All available teams
export const ALL_TEAMS = [...PL_TEAMS, ...ELC_TEAMS];

export function getTeamById(id) {
  return ALL_TEAMS.find(t => t.id === id);
}