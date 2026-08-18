const res = await fetch('https://soccer.highlightly.net/matches?season=2026&homeTeamId=58652&limit=100', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const d = await res.json();
console.log('Bolton home matches:', d.data?.length);
d.data?.forEach(m => console.log(m.date?.substring(0,10), m.homeTeam?.name, 'vs', m.awayTeam?.name, m.state?.description));

const res2 = await fetch('https://soccer.highlightly.net/matches?season=2026&awayTeamId=58652&limit=100', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const d2 = await res2.json();
console.log('Bolton away matches:', d2.data?.length);
d2.data?.forEach(m => console.log(m.date?.substring(0,10), m.homeTeam?.name, 'vs', m.awayTeam?.name, m.state?.description));