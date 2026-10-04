'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { SchoolClass, Subject } from '../../lib/types';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [classIds, setClassIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .get<Subject[]>('/subjects')
      .then(setSubjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load subjects.'));
  }

  useEffect(() => {
    load();
    api.get<SchoolClass[]>('/classes').then(setClasses).catch(() => {});
  }, []);

  function toggleClass(id: string) {
    setClassIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/subjects', { name, code: code || undefined, classIds });
      setName('');
      setCode('');
      setClassIds([]);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create subject.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Academics</div>
          <h1 className="font-display text-4xl uppercase text-ink">Subjects</h1>
        </div>
        <PrimaryButton onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New subject'}
        </PrimaryButton>
      </div>

      {showForm && (
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Subject name">
                <TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" />
              </Field>
              <Field label="Code (optional)">
                <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="MATH" />
              </Field>
            </div>

            <Field label="Taught in (optional — leave blank to assign later)">
              {classes.length === 0 ? (
                <p className="text-xs text-ink-soft font-mono">
                  No classes yet — add one on the Classes page first if you want to assign this subject now.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => {
                    const active = classIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClass(c.id)}
                        className={`text-xs font-mono px-2.5 py-1.5 rounded-sm border transition-colors ${
                          active
                            ? 'bg-marigold/20 border-marigold text-marigold-deep'
                            : 'border-paper-line text-ink-soft hover:border-ink-soft'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>

            <ErrorText>{formError}</ErrorText>
            <div className="flex gap-3">
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create subject'}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setShowForm(false)}>
                Cancel
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!subjects && !error && <p className="text-ink-soft text-sm">Loading subjects…</p>}
      {subjects && subjects.length === 0 && !showForm && (
        <p className="text-ink-soft text-sm">No subjects yet — add the first one above.</p>
      )}

      {subjects && subjects.length > 0 && (
        <div className="space-y-2">
          {subjects.map((s) => (
            <Card key={s.id} className="!p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-ink">{s.name}</span>
                  {s.code && <span className="ml-2 font-mono text-xs text-ink-soft">{s.code}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {s.classes && s.classes.length > 0 ? (
                    s.classes.map((c) => (
                      <span
                        key={c.id}
                        className="font-mono text-xs px-2 py-0.5 rounded-sm bg-paper border border-paper-line text-ink-soft"
                      >
                        {c.name}
                      </span>
                    ))
                  ) : (
                    <span className="font-mono text-xs text-ink-soft">Not assigned to a class yet</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
