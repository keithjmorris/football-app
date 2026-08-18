const res = await fetch('https://soccer.highlightly.net/box-score/1330185268', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
console.log('Is array:', Array.isArray(data));
console.log('Teams:', data.map ? data.map(t => ({id: t.team?.id, name: t.team?.name, players: t.players?.length})) : 'not array');