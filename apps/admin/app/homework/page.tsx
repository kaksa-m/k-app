'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, PrimaryButton, Select, TextArea, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { Homework, ClassSession, Section } from '../../lib/types';

function today() {
  return new Date().toISOString().slice(0, 10);
}
function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function HomeworkPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classSessionId, setClassSessionId] = useState('');

  const [assignedDate, setAssignedDate] = useState(today());
  const [dueDate, setDueDate] = useState(inDays(2));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [entries, setEntries] = useState<Homework[] | null>(null);
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
      .get<Homework[]>(`/homework?classSessionId=${id}`)
      .then(setEntries)
      .catch((err) => setListError(err instanceof ApiError ? err.message : 'Failed to load homework.'));
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
      await api.post('/homework', {
        classSessionId,
        assignedDate,
        dueDate,
        title,
        description: description || undefined,
      });
      setTitle('');
      setDescription('');
      loadEntries(classSessionId);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to post homework.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSession = sessions.find((s) => s.id === classSessionId);

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Day to day</div>
        <h1 className="font-display text-4xl uppercase text-ink">Homework</h1>
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
        {sectionId && sessions.length === 0 && (
          <p className="text-xs text-ink-soft font-mono mt-3">
            No class sessions for this section yet —{' '}
            <Link href="/timetable" className="text-margin hover:text-marigold-deep underline">
              add one on the Timetable page
            </Link>
            .
          </p>
        )}
      </Card>

      {classSessionId && (
        <>
          <Card className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label={`Homework for ${selectedSession?.subject?.name ?? 'this class'}`}>
                <TextInput
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Worksheet 4B"
                />
              </Field>
              <Field label="Details (optional)">
                <TextArea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Complete questions 1-15, show your working."
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Assigned">
                  <TextInput
                    type="date"
                    required
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                  />
                </Field>
                <Field label="Due">
                  <TextInput type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </Field>
              </div>
              <ErrorText>{formError}</ErrorText>
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post homework'}
              </PrimaryButton>
            </form>
          </Card>

          <ErrorText>{listError}</ErrorText>
          {entries && entries.length === 0 && (
            <p className="text-ink-soft text-sm">No homework assigned for this class yet.</p>
          )}
          {entries && entries.length > 0 && (
            <div className="space-y-2">
              {entries.map((h) => (
                <Card key={h.id} className="!p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-ink font-medium">{h.title}</div>
                      {h.description && <div className="text-xs text-ink-soft mt-0.5">{h.description}</div>}
                    </div>
                    <span className="font-mono text-xs text-margin whitespace-nowrap ml-4">
                      Due{' '}
                      {new Date(h.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
