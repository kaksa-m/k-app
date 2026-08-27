'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, PrimaryButton, Select, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { Classwork, ClassSession, Section } from '../../lib/types';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ClassworkPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classSessionId, setClassSessionId] = useState('');

  const [date, setDate] = useState(today());
  const [summary, setSummary] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [entries, setEntries] = useState<Classwork[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Section[]>('/sections').then(setSections).catch(() => {});
  }, []);

  useEffect(() => {
    setClassSessionId('');
    setEntries(null);
    if (!sectionId) {
      setSessions([]);
      return;
    }
    api.get<ClassSession[]>(`/class-sessions?sectionId=${sectionId}`).then(setSessions).catch(() => setSessions([]));
  }, [sectionId]);

  function loadEntries(id: string) {
    api
      .get<Classwork[]>(`/classwork?classSessionId=${id}`)
      .then(setEntries)
      .catch((err) => setListError(err instanceof ApiError ? err.message : 'Failed to load classwork.'));
  }

  useEffect(() => {
    if (classSessionId) loadEntries(classSessionId);
    else setEntries(null);
  }, [classSessionId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/classwork', { classSessionId, date, summary });
      setSummary('');
      loadEntries(classSessionId);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to post classwork.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSession = sessions.find((s) => s.id === classSessionId);

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Day to day</div>
        <h1 className="font-display text-4xl uppercase text-ink">Classwork</h1>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Section">
            <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">Select a section…</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.class?.name} {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Class session">
            <Select value={classSessionId} onChange={(e) => setClassSessionId(e.target.value)} disabled={!sectionId}>
              <option value="">Select a class…</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject?.name} — {s.startTime}–{s.endTime}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {classSessionId && (
        <>
          <Card className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-[160px_1fr] gap-4">
                <Field label="Date">
                  <TextInput type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label={`What did ${selectedSession?.subject?.name ?? 'this class'} cover?`}>
                  <TextInput
                    required
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Chapter 4 — Linear Equations, Q1-Q10"
                  />
                </Field>
              </div>
              <ErrorText>{formError}</ErrorText>
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post classwork'}
              </PrimaryButton>
            </form>
          </Card>

          <ErrorText>{listError}</ErrorText>
          {entries && entries.length === 0 && (
            <p className="text-ink-soft text-sm">No classwork posted for this class yet.</p>
          )}
          {entries && entries.length > 0 && (
            <div className="space-y-2">
              {entries.map((e) => (
                <Card key={e.id} className="!p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink">{e.summary}</span>
                    <span className="font-mono text-xs text-ink-soft">
                      {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
