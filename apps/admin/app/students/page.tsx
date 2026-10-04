'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, Select, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { Section, Student } from '../../lib/types';

const emptyForm = { firstName: '', lastName: '', rollNumber: '', dateOfBirth: '', sectionId: '' };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [query, setQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (showInactive) params.set('includeInactive', 'true');
      const suffix = params.toString() ? `?${params.toString()}` : '';
      setStudents(await api.get<Student[]>(`/students${suffix}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load students.');
    }
  }

  useEffect(() => {
    api.get<Section[]>('/sections').then(setSections).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [query, showInactive]);

  const activeCount = useMemo(() => students?.filter((s) => s.isActive).length ?? 0, [students]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(student: Student) {
    setEditingId(student.id);
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      rollNumber: student.rollNumber ?? '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
      sectionId: student.section?.id ?? '',
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        rollNumber: form.rollNumber || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        sectionId: form.sectionId || undefined,
      };
      if (editingId) await api.patch(`/students/${editingId}`, body);
      else await api.post('/students', body);
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save student.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deactivate(student: Student) {
    if (!window.confirm(`Deactivate ${student.firstName} ${student.lastName}?`)) return;
    try {
      await api.delete(`/students/${student.id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to deactivate student.');
    }
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">People</div>
          <h1 className="font-display text-4xl uppercase text-ink">Students</h1>
          <p className="text-sm text-ink-soft mt-2">
            {students ? `${activeCount} active student${activeCount === 1 ? '' : 's'}` : 'Manage the student register'}
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>+ New student</PrimaryButton>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or roll number…"
          className="md:max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm text-ink-soft px-2">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      {showForm && (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl uppercase text-ink">{editingId ? 'Edit student' : 'New student'}</h2>
            {editingId && <span className="font-mono text-xs text-ink-soft">Record #{editingId.slice(-6)}</span>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First name">
                <TextInput required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </Field>
              <Field label="Last name">
                <TextInput required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Roll number">
                <TextInput value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
              </Field>
              <Field label="Date of birth">
                <TextInput type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </Field>
              <Field label="Section">
                <Select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.class?.name} — {s.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <ErrorText>{formError}</ErrorText>
            <div className="flex gap-3">
              <PrimaryButton type="submit" disabled={submitting}>{submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create student'}</PrimaryButton>
              <GhostButton type="button" onClick={() => setShowForm(false)}>Cancel</GhostButton>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!students && !error && <p className="text-ink-soft text-sm">Loading students…</p>}
      {students && students.length === 0 && <p className="text-ink-soft text-sm">No matching students.</p>}

      {students && students.length > 0 && (
        <div className="bg-[#FFFDF8] border border-paper-line rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-board text-chalk text-left font-mono text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Roll No.</th>
                <th className="px-4 py-3">Class / Section</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-paper/60'}>
                  <td className="px-4 py-3 font-medium text-ink">{s.firstName} {s.lastName}</td>
                  <td className="px-4 py-3 font-mono text-ink-soft">{s.rollNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.section ? `${s.section.class.name} ${s.section.name}` : 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[11px] uppercase ${s.isActive ? 'text-green-700' : 'text-margin'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(s)} className="text-xs font-mono text-margin hover:text-marigold-deep mr-4">Edit</button>
                    {s.isActive && <button onClick={() => deactivate(s)} className="text-xs font-mono text-margin hover:text-red-700">Deactivate</button>}
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
