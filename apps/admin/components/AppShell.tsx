'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth, ALLOWED_ROLES } from '../lib/auth-context';

interface NavGroup {
  heading?: string;
  items: { href: string; label: string }[];
}

const SCHOOL_ADMIN_NAV: NavGroup[] = [
  { items: [{ href: '/dashboard', label: 'Today' }] },
  {
    heading: 'People & academics',
    items: [
      { href: '/students', label: 'Students' },
      { href: '/parents', label: 'Parents' },
      { href: '/teachers', label: 'Teachers' },
      { href: '/classes', label: 'Classes' },
      { href: '/academic-years', label: 'Academic years' },
      { href: '/subjects', label: 'Subjects' },
      { href: '/timetable', label: 'Timetable' },
    ],
  },
  {
    heading: 'Day to day',
    items: [
      { href: '/attendance', label: 'Attendance' },
      { href: '/classwork', label: 'Classwork' },
      { href: '/homework', label: 'Homework' },
      { href: '/announcements', label: 'Announcements' },
    ],
  },
  {
    heading: 'Finance',
    items: [
      { href: '/fee-structures', label: 'Fee Structures' },
      { href: '/invoices', label: 'Invoices' },
      { href: '/payments', label: 'Payments' },
    ],
  },
];


const TEACHER_NAV: NavGroup[] = [
  { items: [{ href: '/teacher', label: 'Today' }] },
];

const PARENT_NAV: NavGroup[] = [
  { items: [{ href: '/parent', label: 'My children' }] },
  {
    heading: 'School',
    items: [
      { href: '/parent', label: 'Attendance & homework' },
    ],
  },
];

const SUPER_ADMIN_NAV: NavGroup[] = [
  {
    heading: 'Platform',
    items: [
      { href: '/platform', label: 'Overview' },
      { href: '/schools', label: 'Schools' },
    ],
  },
];

// Wraps every authenticated page: redirects to /login if there's no
// session, enforces role-specific surfaces, then renders the sidebar.
export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      logout();
      return;
    }

    const isPlatformRoute = pathname === '/platform' || pathname.startsWith('/schools');
    const isSchoolRoute =
      pathname === '/dashboard' ||
      pathname.startsWith('/students') ||
      pathname.startsWith('/parents') ||
      pathname.startsWith('/teachers') ||
      pathname.startsWith('/classes') ||
      pathname.startsWith('/academic-years') ||
      pathname.startsWith('/subjects') ||
      pathname.startsWith('/timetable') ||
      pathname.startsWith('/attendance') ||
      pathname.startsWith('/classwork') ||
      pathname.startsWith('/homework') ||
      pathname.startsWith('/announcements') ||
      pathname.startsWith('/fee-structures') ||
      pathname.startsWith('/invoices') ||
      pathname.startsWith('/payments');

    const isTeacherRoute = pathname === '/teacher' || pathname.startsWith('/teacher/');
    const isParentRoute = pathname === '/parent' || pathname.startsWith('/parent/');
    const isAccountRoute = pathname === '/account' || pathname.startsWith('/account/');

    if (user.role === 'SUPER_ADMIN' && (isSchoolRoute || isTeacherRoute || isParentRoute)) {
      router.replace('/platform');
      return;
    }

    if (user.role === 'SCHOOL_ADMIN' && (isPlatformRoute || isTeacherRoute || isParentRoute)) {
      router.replace('/dashboard');
      return;
    }

    if (user.role === 'TEACHER' && (!isTeacherRoute && !isAccountRoute)) {
      router.replace('/teacher');
      return;
    }

    if (user.role === 'PARENT' && !isParentRoute && !isAccountRoute) {
      router.replace('/parent');
      return;
    }
  }, [loading, user, pathname, router, logout]);

  if (loading || !user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft font-mono text-sm">
        Loading…
      </div>
    );
  }

  const baseNavGroups =
    user.role === 'SUPER_ADMIN'
      ? SUPER_ADMIN_NAV
      : user.role === 'TEACHER'
        ? TEACHER_NAV
        : user.role === 'PARENT'
          ? PARENT_NAV
          : SCHOOL_ADMIN_NAV;
  const navGroups: NavGroup[] = [...baseNavGroups, { items: [{ href: '/account', label: 'Account' }] }];

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-board text-chalk flex flex-col">
        <div className="flex items-center gap-2 px-6 py-6">
          <LogoMark />
          <span className="font-display text-xl uppercase tracking-wide">Kaksam</span>
        </div>
        <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi} className="space-y-1">
              {group.heading && (
                <div className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-chalk/40">
                  {group.heading}
                </div>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-board-deep text-marigold'
                        : 'text-chalk/80 hover:bg-board-deep hover:text-chalk'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
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
