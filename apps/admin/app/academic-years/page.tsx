'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { AcademicYear } from '../../lib/types';

const emptyForm = { name: '', startDate: '', endDate: '', isCurrent: false };

function toDateInput(value: string) {
  return value ? value.slice(0, 10) : '';
}

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .get<AcademicYear[]>('/academic-years')
      .then(setYears)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load academic years.'));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(year: AcademicYear) {
    setEditingId(year.id);
    setForm({
      name: year.name,
      startDate: toDateInput(year.startDate),
      endDate: toDateInput(year.endDate),
      isCurrent: year.isCurrent,
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
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        isCurrent: form.isCurrent,
      };

      if (editingId) {
        await api.patch(`/academic-years/${editingId}`, body);
      } else {
        await api.post('/academic-years', body);
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save academic year.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(year: AcademicYear) {
    if (!window.confirm(`Delete academic year ${year.name}? Sections and exams linked to it may also be removed.`)) return;
    try {
      await api.delete(`/academic-years/${year.id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete academic year.');
    }
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Academics</div>
          <h1 className="font-display text-4xl uppercase text-ink">Academic years</h1>
          <p className="text-sm text-ink-soft mt-2 max-w-2xl">
            Set the school year used by sections, timetables and academic records. Only one year can be current at a time.
          </p>
        </div>
        <PrimaryButton onClick={() => (showForm ? setShowForm(false) : openCreate())}>
          {showForm ? 'Cancel' : '+ New academic year'}
        </PrimaryButton>
      </div>

      {showForm && (
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Name">
                <TextInput
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="2027-28"
                />
              </Field>
              <Field label="Start date">
                <TextInput
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </Field>
              <Field label="End date">
                <TextInput
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isCurrent}
                onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              />
              Make this the current academic year
            </label>

            <ErrorText>{formError}</ErrorText>
            <div className="flex gap-3">
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create academic year'}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setShowForm(false)}>
                Cancel
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!years && !error && <p className="text-ink-soft text-sm">Loading academic years…</p>}
      {years && years.length === 0 && <p className="text-ink-soft text-sm">No academic years yet — create the first one above.</p>}

      {years && years.length > 0 && (
        <div className="space-y-3">
          {years.map((year) => (
            <Card key={year.id} className="!p-4">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-xl uppercase text-ink">{year.name}</h2>
                    {year.isCurrent && (
                      <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm bg-marigold/20 text-marigold-deep">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-ink-soft mt-1">
                    {toDateInput(year.startDate)} → {toDateInput(year.endDate)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => openEdit(year)}>Edit</GhostButton>
                  <button
                    type="button"
                    onClick={() => handleDelete(year)}
                    className="text-sm font-medium text-margin px-3 py-2 hover:text-marigold-deep"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
