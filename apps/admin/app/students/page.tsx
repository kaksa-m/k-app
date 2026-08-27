'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, Select, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { Section, Student } from '../../lib/types';

const emptyForm = { firstName: '', lastName: '', rollNumber: '', sectionId: '' };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .get<Student[]>('/students')
      .then(setStudents)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load students.'));
  }

  useEffect(() => {
    load();
    api.get<Section[]>('/sections').then(setSections).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/students', {
        firstName: form.firstName,
        lastName: form.lastName,
        rollNumber: form.rollNumber || undefined,
        sectionId: form.sectionId || undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create student.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">People</div>
          <h1 className="font-display text-4xl uppercase text-ink">Students</h1>
        </div>
        <PrimaryButton onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New student'}
        </PrimaryButton>
      </div>

      {showForm && (
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name">
                <TextInput
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </Field>
              <Field label="Last name">
                <TextInput
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Roll number (optional)">
                <TextInput
                  value={form.rollNumber}
                  onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                />
              </Field>
              <Field label="Section (optional)">
                <Select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name} {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <ErrorText>{formError}</ErrorText>
            <div className="flex gap-3">
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create student'}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setShowForm(false)}>
                Cancel
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!students && !error && <p className="text-ink-soft text-sm">Loading students…</p>}
      {students && students.length === 0 && !showForm && (
        <p className="text-ink-soft text-sm">No students yet — add the first one above.</p>
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
