const res = await fetch('https://soccer.highlightly.net/teams?name=Leeds', {  headers: {
    'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e'
  }
});
const data = await res.json();
console.log(JSON.stringify(data.data?.filter(t => t.type === 'club').slice(0,3), null, 2));