const res = await fetch('https://soccer.highlightly.net/box-score/1330185268', {
  headers: { 'x-rapidapi-key': ' 38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
// Show first Bolton player's stats
const bolton = data.find(t => t.team?.id === 58652);
const firstPlayer = bolton?.players?.[0];
console.log('Player:', firstPlayer?.name);
console.log('Stats:', JSON.stringify(firstPlayer?.statistics, null, 2));