'use client';

import { useState } from 'react';

const CATEGORY_LABELS = {
  'match-highlights': '🎬 Match Highlights',
  'goal-clip': '⚽ Goal Clip',
  'post-match-content': '🎤 Post Match',
  'pre-match-content': '📋 Pre Match',
  'press-conference': '🎙️ Press Conference',
  'behind-the-scenes': '🎥 Behind the Scenes',
  'discussion-analysis': '📊 Analysis',
  'other': '📺 Video',
};

export default function MatchHighlights({ match }) {
  const [open, setOpen] = useState(false);
  const [highlights, setHighlights] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (highlights) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/highlights?matchId=${match.id}`);
      const data = await res.json();
      setHighlights(data.highlights || []);
    } catch {
      setHighlights([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="match-highlights-wrapper">
      <button className="summary-btn" onClick={handleToggle}>
        {open ? '▲ Hide highlights' : '▼ Highlights'}
      </button>
      {open && (
        <div className="highlights-box">
          {loading && <p className="summary-loading">Loading highlights…</p>}
          {!loading && highlights?.length === 0 && (
            <p className="summary-loading">No highlights available yet.</p>
          )}
          {!loading && highlights?.map(h => (
            <a key={h.id} href={h.url} target="_blank" rel="noopener noreferrer" className="highlight-card">
              {h.imgUrl && (
                <img src={h.imgUrl} alt={h.title} className="highlight-thumb" />
              )}
              <div className="highlight-info">
                <span className="highlight-category">
                  {CATEGORY_LABELS[h.category] || '📺 Video'}
                </span>
                <span className="highlight-title">{h.title}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}