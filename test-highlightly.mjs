const res = await fetch('https://soccer.highlightly.net/highlights?matchId=1330185268', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
data.data?.forEach(h => console.log(h.title, '\nThumb:', h.imgUrl, '\nURL:', h.url, '\n'));