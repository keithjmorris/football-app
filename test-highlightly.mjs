const res = await fetch('https://soccer.highlightly.net/events/1330185268', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
// Look for substitutions and their times
const subs = data.filter(e => e.type === 'Substitution');
console.log('Substitutions:', JSON.stringify(subs, null, 2));