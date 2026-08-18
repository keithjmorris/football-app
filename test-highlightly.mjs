const res = await fetch('https://soccer.highlightly.net/statistics/1330185268', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
console.log('Is array:', Array.isArray(data));
if (Array.isArray(data)) {
  console.log('Length:', data.length);
  data.forEach(t => {
    console.log('Team:', t.team?.name, 'ID:', t.team?.id, 'Stats count:', t.statistics?.length);
  });
} else {
  console.log(JSON.stringify(data).substring(0, 200));
}