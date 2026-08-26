'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Today' },
  { href: '/students', label: 'Students' },
  { href: '/teachers', label: 'Teachers' },
  { href: '/classes', label: 'Classes' },
];

// Wraps every authenticated page: redirects to /login if there's no
// session, then renders the sidebar + topbar chrome around the page content.
export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft font-mono text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-board text-chalk flex flex-col">
        <div className="flex items-center gap-2 px-6 py-6">
          <LogoMark />
          <span className="font-display text-xl uppercase tracking-wide">Kaksam</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-board-deep text-marigold' : 'text-chalk/80 hover:bg-board-deep hover:text-chalk'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-5 border-t border-white/10 text-xs">
          <div className="font-medium">{user.name ?? user.email}</div>
          <div className="text-chalk/50 font-mono mt-0.5">{user.role.replace('_', ' ')}</div>
          <button onClick={logout} className="mt-3 text-margin hover:text-marigold transition-colors font-mono">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-paper min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="7" fill="#0F221D" />
      <rect x="10" y="7" width="1.6" height="26" fill="#B84438" />
      <line x1="15" y1="13" x2="30" y2="13" stroke="#F5F1E4" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <line x1="15" y1="19" x2="30" y2="19" stroke="#F5F1E4" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <path d="M15 26 L20 31 L31 15" stroke="#E5A231" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
