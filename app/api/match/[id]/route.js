export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/matches/${id}`,
      {
        headers: {
          'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
          'X-Unfold-Lineups': 'true',
          'X-Unfold-Goals': 'true',
          'X-Unfold-Bookings': 'true',
          'X-Unfold-Subs': 'true',
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return Response.json(
        { error: `football-data API error: ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: 'Failed to reach football-data API', detail: err.message }, { status: 500 });
  }
}