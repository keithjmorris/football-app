import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const match = await request.json();
    const matchId = `match_${match.id}`;

    // Check Firestore cache first
    const cached = await getDoc(doc(db, 'summaries', matchId));
    if (cached.exists()) {
      return Response.json({ summary: cached.data().summary });
    }

    // Build the prompt
    const homeGoals = match.score?.fullTime?.home ?? 0;
    const awayGoals = match.score?.fullTime?.away ?? 0;
    const winner = homeGoals > awayGoals ? match.homeTeam.name : awayGoals > homeGoals ? match.awayTeam.name : null;

    const goalScorers = match.goals?.length > 0
      ? `Goals: ${match.goals.map(g => `${g.scorer?.name} (${g.minute}', ${g.team?.name})`).join(', ')}.`
      : 'No detailed goal information available.';

    const prompt = `Write a short, witty and entertaining match report for this World Cup 2026 match. Keep it to 3-4 sentences maximum. Be playful and humorous like a football pundit having fun, but include the key facts.

Match: ${match.homeTeam.name} ${homeGoals} - ${awayGoals} ${match.awayTeam.name}
${winner ? `Winner: ${winner}` : 'Result: Draw'}
${goalScorers}
Stage: ${match.stage?.replace('_', ' ')}`;

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error('Anthropic API error');
    }

    const data = await response.json();
    const summary = data.content[0].text;

    // Cache in Firestore
    await setDoc(doc(db, 'summaries', matchId), {
      summary,
      matchId: match.id,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ summary });
  } catch (err) {
    return Response.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}