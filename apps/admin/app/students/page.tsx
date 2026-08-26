'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { api, ApiError } from '../../lib/api';
import type { Student } from '../../lib/types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Student[]>('/students')
      .then(setStudents)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load students.'));
  }, []);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">People</div>
          <h1 className="font-display text-4xl uppercase text-ink">Students</h1>
        </div>
      </div>

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!students && !error && <p className="text-ink-soft text-sm">Loading students…</p>}

      {students && students.length === 0 && (
        <p className="text-ink-soft text-sm">
          No students yet. Add students via the API (POST /students) — a dedicated "Add student" form
          is a natural next screen to build here.
        </p>
      )}

      {students && students.length > 0 && (
        <div className="bg-[#FFFDF8] border border-paper-line rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-board text-chalk text-left font-mono text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Roll No.</th>
                <th className="px-4 py-3">Class / Section</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-paper/60'}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-soft">{s.rollNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {s.section ? `${s.section.class.name} ${s.section.name}` : 'Unassigned'}
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
