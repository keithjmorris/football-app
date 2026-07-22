export async function GET() {
  try {
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/standings',
      {
        headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return Response.json(
        { error: `football-data API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: 'Failed to reach football-data API' }, { status: 500 });
  }
}