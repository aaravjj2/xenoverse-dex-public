import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Xenoverse Dex',
  description: 'Local canonical dex for Xenoverse-Ordem-et-Chaos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white antialiased">
        {/* Top Navigation */}
        <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg">
                    XV
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Xenoverse Dex
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Link href="/" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium hover:text-blue-400">
                    Pokédex
                  </Link>
                  <Link href="/types" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium hover:text-blue-400">
                    Types
                  </Link>
                  <Link href="/abilities" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium hover:text-blue-400">
                    Abilities
                  </Link>
                  <Link href="/moves" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium hover:text-blue-400">
                    Moves
                  </Link>
                  <Link href="/items" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium hover:text-amber-400">
                    Items
                  </Link>
                  {/* <Link href="/trainers" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium hover:text-red-400">
                    Trainers
                  </Link> */}
                  <Link href="/world" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium hover:text-emerald-400">
                    World
                  </Link>
                  <Link href="/compare" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium hover:text-blue-400">
                    Compare
                  </Link>
                  <Link href="/team" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium hover:text-purple-400">
                    Team
                  </Link>
                  <Link href="/diagnostics" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium text-slate-400 hover:text-slate-300">
                    ⚙️
                  </Link>
                </div>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Local-First Dex
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
