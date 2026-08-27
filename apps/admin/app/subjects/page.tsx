'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { Subject } from '../../lib/types';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .get<Subject[]>('/subjects')
      .then(setSubjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load subjects.'));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/subjects', { name, code: code || undefined });
      setName('');
      setCode('');
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
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <span
              key={s.id}
              className="bg-[#FFFDF8] border border-paper-line rounded-sm px-3 py-2 text-sm text-ink"
            >
              {s.name}
              {s.code && <span className="ml-2 font-mono text-xs text-ink-soft">{s.code}</span>}
            </span>
          ))}
        </div>
      )}
    </AppShell>
  );
}
