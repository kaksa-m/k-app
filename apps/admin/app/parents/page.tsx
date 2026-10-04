'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { Parent } from '../../lib/types';

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', password: '' };

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[] | null>(null);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setError(null);
      const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
      setParents(await api.get<Parent[]>(`/parents${suffix}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load parents.');
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(parent: Parent) {
    setEditingId(parent.id);
    setForm({
      firstName: parent.firstName,
      lastName: parent.lastName,
      email: parent.user.email,
      phone: parent.phone ?? '',
      password: '',
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const body: Record<string, string> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
      };
      if (form.password) body.password = form.password;

      if (editingId) await api.patch(`/parents/${editingId}`, body);
      else await api.post('/parents', body);
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save parent.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(parent: Parent) {
    try {
      await api.patch(`/parents/${parent.id}/active`, { isActive: !parent.user.isActive });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update parent.');
    }
  }

  async function remove(parent: Parent) {
    if (!window.confirm(`Delete ${parent.firstName} ${parent.lastName}?`)) return;
    try {
      await api.delete(`/parents/${parent.id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete parent.');
    }
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">People</div>
          <h1 className="font-display text-4xl uppercase text-ink">Parents</h1>
          <p className="text-sm text-ink-soft mt-2">Manage parent accounts and linked students.</p>
        </div>
        <PrimaryButton onClick={openCreate}>+ New parent</PrimaryButton>
      </div>

      <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone…" className="md:max-w-sm mb-6" />

      {showForm && (
        <Card className="mb-8">
          <h2 className="font-display text-xl uppercase text-ink mb-4">{editingId ? 'Edit parent' : 'New parent'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First name"><TextInput required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
              <Field label="Last name"><TextInput required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Email"><TextInput required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Phone"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label={editingId ? 'New password (optional)' : 'Password (optional)'}>
                <TextInput type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? 'Leave blank to keep' : 'Default: password123'} />
              </Field>
            </div>
            <ErrorText>{formError}</ErrorText>
            <div className="flex gap-3"><PrimaryButton type="submit" disabled={submitting}>{submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create parent'}</PrimaryButton><GhostButton type="button" onClick={() => setShowForm(false)}>Cancel</GhostButton></div>
          </form>
        </Card>
      )}

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!parents && !error && <p className="text-ink-soft text-sm">Loading parents…</p>}
      {parents && parents.length === 0 && <p className="text-ink-soft text-sm">No parents found.</p>}

      {parents && parents.length > 0 && (
        <div className="bg-[#FFFDF8] border border-paper-line rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-board text-chalk text-left font-mono text-xs uppercase tracking-wide"><th className="px-4 py-3">Parent</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Students</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody>{parents.map((p, i) => <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-paper/60'}>
              <td className="px-4 py-3 font-medium text-ink">{p.firstName} {p.lastName}</td>
              <td className="px-4 py-3 text-ink-soft">{p.user.email}<br />{p.phone ?? '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{p.students.length ? p.students.map(s => `${s.firstName} ${s.lastName}`).join(', ') : 'None linked'}</td>
              <td className="px-4 py-3"><span className={`font-mono text-[11px] uppercase ${p.user.isActive ? 'text-green-700' : 'text-margin'}`}>{p.user.isActive ? 'Active' : 'Inactive'}</span></td>
              <td className="px-4 py-3 text-right whitespace-nowrap"><button onClick={() => openEdit(p)} className="text-xs font-mono text-margin hover:text-marigold-deep mr-4">Edit</button><button onClick={() => toggleActive(p)} className="text-xs font-mono text-margin hover:text-marigold-deep mr-4">{p.user.isActive ? 'Deactivate' : 'Activate'}</button><button onClick={() => remove(p)} className="text-xs font-mono text-margin hover:text-red-700">Delete</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
