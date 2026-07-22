export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const params = new URLSearchParams();
  ['status', 'dateFrom', 'dateTo', 'stage', 'matchday', 'group'].forEach(key => {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  });

  const url = `https://api.football-data.org/v4/competitions/WC/matches${
    params.toString() ? '?' + params.toString() : ''
  }`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
        'X-Unfold-Goals': 'true',
        'X-Unfold-Bookings': 'true',
        'X-Unfold-Subs': 'true',
      },
      next: { revalidate: 30 },
    });

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