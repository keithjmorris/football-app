'use client';

import { Inter, Bebas_Neue } from 'next/font/google';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import TeamPicker from '@/components/TeamPicker';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-display' });

export default function RootLayout({ children }) {
  const [favourites, setFavourites] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fc_favourites');
    if (saved) {
      setFavourites(JSON.parse(saved));
    } else {
      setShowPicker(true);
    }
  }, []);

  function handleSave(teams) {
    setFavourites(teams);
    setShowPicker(false);
  }

  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body>
        {showPicker && <TeamPicker onSave={handleSave} />}
        <nav className="main-nav">
          <Link href="/" className="nav-link">Fixtures</Link>
          <Link href="/results" className="nav-link">Results</Link>
          <Link href="/standings" className="nav-link">Tables</Link>
          <Link href="/stats" className="nav-link">Stats</Link>
          <Link href="/chat" className="nav-link">Chat</Link>
          <button
            className="nav-link nav-edit-teams"
            onClick={() => setShowPicker(true)}
          >
            My Teams
          </button>
        </nav>
        {favourites !== null
          ? children
          : !showPicker && <p className="state-msg">Loading…</p>
        }
      </body>
    </html>
  );
}