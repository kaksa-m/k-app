'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { Teacher } from '../../lib/types';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  department: '',
  employeeCode: '',
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .get<Teacher[]>('/teachers')
      .then(setTeachers)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load teachers.'));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/teachers', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        department: form.department || undefined,
        employeeCode: form.employeeCode || undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create teacher.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">People</div>
          <h1 className="font-display text-4xl uppercase text-ink">Teachers</h1>
        </div>
        <PrimaryButton onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New teacher'}
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
              <Field label="Login email">
                <TextInput
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="teacher@yourschool.edu"
                />
              </Field>
              <Field label="Temporary password">
                <TextInput
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Department (optional)">
                <TextInput
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </Field>
              <Field label="Employee code (optional)">
                <TextInput
                  value={form.employeeCode}
                  onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                />
              </Field>
            </div>
            <ErrorText>{formError}</ErrorText>
            <div className="flex gap-3">
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create teacher'}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setShowForm(false)}>
                Cancel
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!teachers && !error && <p className="text-ink-soft text-sm">Loading teachers…</p>}
      {teachers && teachers.length === 0 && !showForm && (
        <p className="text-ink-soft text-sm">No teachers yet — add the first one above.</p>
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
