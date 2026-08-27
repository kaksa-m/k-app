'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, Select, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { ClassSession, Section, Subject, Teacher } from '../../lib/types';
import { DAY_LABELS } from '../../lib/types';

const emptyForm = {
  subjectId: '',
  teacherId: '',
  dayOfWeek: '0',
  startTime: '09:00',
  endTime: '09:45',
  room: '',
};

export default function TimetablePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [sessions, setSessions] = useState<ClassSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<Section[]>('/sections').then(setSections).catch(() => {});
    api.get<Subject[]>('/subjects').then(setSubjects).catch(() => {});
    api.get<Teacher[]>('/teachers').then(setTeachers).catch(() => {});
  }, []);

  function loadSessions(id: string) {
    setError(null);
    api
      .get<ClassSession[]>(`/class-sessions?sectionId=${id}`)
      .then(setSessions)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load timetable.'));
  }

  useEffect(() => {
    setShowForm(false);
    if (sectionId) loadSessions(sectionId);
    else setSessions(null);
  }, [sectionId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/class-sessions', {
        sectionId,
        subjectId: form.subjectId,
        teacherId: form.teacherId,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room || undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      loadSessions(sectionId);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to add class session.');
    } finally {
      setSubmitting(false);
    }
  }

  // Group sessions by day for a readable weekly view, in schema day order.
  const byDay: ClassSession[][] = DAY_LABELS.map((_, dayIndex) =>
    (sessions ?? [])
      .filter((s) => s.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Academics</div>
          <h1 className="font-display text-4xl uppercase text-ink">Timetable</h1>
        </div>
        {sectionId && (
          <PrimaryButton onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add class session'}
          </PrimaryButton>
        )}
      </div>

      <Card className="mb-6">
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
      </Card>

      {!sectionId && (
        <p className="text-ink-soft text-sm">Pick a section above to see or build its weekly timetable.</p>
      )}

      {sectionId && showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Subject">
                <Select
                  required
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Teacher">
                <Select
                  required
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Field label="Day">
                <Select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
                  {DAY_LABELS.map((label, i) => (
                    <option key={label} value={i}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Start time">
                <TextInput
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </Field>
              <Field label="End time">
                <TextInput
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </Field>
              <Field label="Room (optional)">
                <TextInput value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
              </Field>
            </div>
            <ErrorText>{formError}</ErrorText>
            <div className="flex gap-3">
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add to timetable'}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setShowForm(false)}>
                Cancel
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      <ErrorText>{error}</ErrorText>

      {sectionId && sessions && sessions.length === 0 && !showForm && (
        <p className="text-ink-soft text-sm">No class sessions scheduled yet — add the first one above.</p>
      )}

      {sectionId && sessions && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DAY_LABELS.map((label, dayIndex) =>
            byDay[dayIndex].length > 0 ? (
              <Card key={label}>
                <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3 pb-2 border-b border-paper-line">
                  {label}
                </h3>
                <div className="space-y-2">
                  {byDay[dayIndex].map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-ink font-medium">{s.subject?.name}</span>
                        <span className="text-ink-soft ml-2">
                          {s.teacher?.firstName} {s.teacher?.lastName}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-margin whitespace-nowrap">
                        {s.startTime}–{s.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null,
          )}
        </div>
      )}
    </AppShell>
  );
}
