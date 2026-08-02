import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';
import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Xenoverse Dex',
  description: 'Complete Pokédex for Pokémon Xenoverse - Ordem et Chaos',
};

const NAV_LINKS = [
  { href: '/', label: 'Pokédex', color: 'blue' },
  { href: '/types', label: 'Types', color: 'purple' },
  { href: '/abilities', label: 'Abilities', color: 'cyan' },
  { href: '/moves', label: 'Moves', color: 'blue' },
  { href: '/items', label: 'Items', color: 'amber' },
  { href: '/trainers', label: 'Trainers', color: 'rose' },
  { href: '/world', label: 'World', color: 'emerald' },
  { href: '/compare', label: 'Compare', color: 'blue' },
  { href: '/team', label: 'Team', color: 'purple' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        <ThemeProvider>
          {/* Top Navigation */}
          <nav className="sticky top-0 z-50 glass border-b border-[var(--border-subtle)]">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between h-16">
                {/* Logo & Desktop Nav */}
                <div className="flex items-center gap-6">
                  <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-105">
                      <span className="relative z-10">XV</span>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <span className="hidden sm:block text-xl font-bold text-gradient">
                      Xenoverse Dex
                    </span>
                  </Link>

                  {/* Desktop Navigation Links */}
                  <div className="hidden lg:flex items-center gap-1">
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="nav-link text-slate-300 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right side - Theme toggle, version, Mobile menu */}
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <span className="hidden md:block text-xs text-slate-500 font-medium px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                    v0.3.0
                  </span>
                  <MobileNav links={NAV_LINKS} />
                </div>
              </div>
            </div>
          </nav>

          <main className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
