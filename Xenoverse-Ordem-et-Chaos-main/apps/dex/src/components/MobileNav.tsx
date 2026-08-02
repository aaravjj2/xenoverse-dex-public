'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
  href: string;
  label: string;
  color: string;
}

export default function MobileNav({ links }: { links: NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-200"
        aria-label="Toggle menu"
      >
        <div className="flex flex-col gap-1.5 w-5">
          <span className={`h-0.5 bg-slate-300 rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`h-0.5 bg-slate-300 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 bg-slate-300 rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl">
            <div className="max-w-md mx-auto p-4">
              <nav className="flex flex-col gap-1">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
