export const TEAMS = [
  {
    id: 57,
    name: 'Arsenal',
    shortName: 'Arsenal',
    tla: 'ARS',
    crest: 'https://crests.football-data.org/57.png',
    competition: 'PL',
    competitionName: 'Premier League',
    competitionId: 2021,
    color: '#EF0107',
  },
  {
    id: 61,
    name: 'Chelsea FC',
    shortName: 'Chelsea',
    tla: 'CHE',
    crest: 'https://crests.football-data.org/61.png',
    competition: 'PL',
    competitionName: 'Premier League',
    competitionId: 2021,
    color: '#034694',
  },
  {
    id: 60,
    name: 'Bolton Wanderers FC',
    shortName: 'Bolton',
    tla: 'BOL',
    crest: 'https://crests.football-data.org/60.png',
    competition: 'ELC',
    competitionName: 'Championship',
    competitionId: 2016,
    color: '#263c7e',
  },
];

export function getTeamById(id) {
  return TEAMS.find(t => t.id === id);
}

export function getTeamsByCompetition(competition) {
  return TEAMS.filter(t => t.competition === competition);
}

export const COMPETITIONS = [...new Set(TEAMS.map(t => t.competition))];