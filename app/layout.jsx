import { Inter, Bebas_Neue } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-display' });

export const metadata = {
  title: 'World Cup 2026',
  description: 'Family World Cup tracker — fixtures, results, tables & chat',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚽</text></svg>',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body>
        <nav className="main-nav">
          <Link href="/" className="nav-link">Fixtures</Link>
          <Link href="/results" className="nav-link">Results</Link>
          <Link href="/standings" className="nav-link">Table</Link>
          <Link href="/live" className="nav-link nav-live">● Live</Link>
          <Link href="/chat" className="nav-link">Chat</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}