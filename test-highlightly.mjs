const res = await fetch('https://soccer.highlightly.net/matches?leagueId=34824&season=2026&limit=100', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
const teams = {};
data.data?.forEach(m => {
  teams[m.homeTeam.name] = m.homeTeam.id;
  teams[m.awayTeam.name] = m.awayTeam.id;
});
console.log(JSON.stringify(teams, null, 2));