'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { api, ApiError } from '../../lib/api';
import type { SchoolClass } from '../../lib/types';

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<SchoolClass[]>('/classes')
      .then(setClasses)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load classes.'));
  }, []);

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Academics</div>
        <h1 className="font-display text-4xl uppercase text-ink">Classes &amp; sections</h1>
      </div>

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!classes && !error && <p className="text-ink-soft text-sm">Loading classes…</p>}

      {classes && classes.length === 0 && (
        <p className="text-ink-soft text-sm">
          No classes yet. Create one via the API (POST /classes), then add sections
          (POST /sections) — a dedicated "Add class" form is a natural next screen to build here.
        </p>
      )}

      {classes && classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-[#FFFDF8] border border-paper-line rounded-sm p-5">
              <h2 className="font-display text-xl uppercase text-ink mb-3">{c.name}</h2>
              {c.sections && c.sections.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {c.sections.map((s) => (
                    <span
                      key={s.id}
                      className="font-mono text-xs px-2.5 py-1 rounded-sm bg-paper border border-paper-line text-ink-soft"
                    >
                      Section {s.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-soft font-mono">No sections yet</p>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
