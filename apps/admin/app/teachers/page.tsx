'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { api, ApiError } from '../../lib/api';
import type { Teacher } from '../../lib/types';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Teacher[]>('/teachers')
      .then(setTeachers)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load teachers.'));
  }, []);

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">People</div>
        <h1 className="font-display text-4xl uppercase text-ink">Teachers</h1>
      </div>

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!teachers && !error && <p className="text-ink-soft text-sm">Loading teachers…</p>}

      {teachers && teachers.length === 0 && (
        <p className="text-ink-soft text-sm">
          No teachers yet. Add teachers via the API (POST /teachers) — a dedicated "Add teacher" form
          is a natural next screen to build here.
        </p>
      )}

      {teachers && teachers.length > 0 && (
        <div className="bg-[#FFFDF8] border border-paper-line rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-board text-chalk text-left font-mono text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? 'bg-white' : 'bg-paper/60'}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {t.firstName} {t.lastName}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{t.department ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-ink-soft">{t.user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-sm ${
                        t.user.isActive ? 'bg-marigold/15 text-marigold-deep' : 'bg-margin/10 text-margin'
                      }`}
                    >
                      {t.user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
