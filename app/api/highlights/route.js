import { fetchHighlightly } from '@/lib/highlightly';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  if (!matchId) return Response.json({ highlights: [] });

  const apiKey = process.env.HIGHLIGHTLY_API_KEY;

  try {
    const data = await fetchHighlightly(
      `/highlights?matchId=${matchId}&limit=10`,
      apiKey,
      3600
    );

    const highlights = (data?.data || []).map(h => ({
      id: h.id,
      title: h.title,
      url: h.url,
      imgUrl: h.imgUrl,
      type: h.type,
      category: h.category,
    }));

    return Response.json({ highlights });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}