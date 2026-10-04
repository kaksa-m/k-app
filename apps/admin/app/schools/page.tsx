'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { SchoolSummary } from '../../lib/types';

const emptyForm = { schoolName: '', schoolSlug: '', city: '', timezone: 'Asia/Kolkata', adminName: '', adminEmail: '', adminPassword: '' };

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolSummary[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.get<SchoolSummary[]>('/platform/schools').then(setSchools).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load schools.'));
  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setFormError(null); setSaving(true);
    try { await api.post('/platform/schools', form); setForm(emptyForm); setShowForm(false); await load(); }
    catch (e) { setFormError(e instanceof ApiError ? e.message : 'Failed to create school.'); }
    finally { setSaving(false); }
  }

  return <AppShell>
    <div className="flex items-start justify-between mb-8"><div><div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Tenants</div><h1 className="font-display text-4xl uppercase text-ink">Schools</h1><p className="mt-2 text-sm text-ink-soft">Each school is an isolated tenant with its own users, students, academics and billing.</p></div><PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add school'}</PrimaryButton></div>
    {showForm && <Card className="mb-8"><form onSubmit={submit} className="space-y-5"><div className="grid grid-cols-2 gap-4"><Field label="School name"><TextInput required value={form.schoolName} onChange={e => setForm({...form, schoolName:e.target.value})}/></Field><Field label="School slug"><TextInput required value={form.schoolSlug} onChange={e => setForm({...form, schoolSlug:e.target.value})}/></Field><Field label="City"><TextInput value={form.city} onChange={e => setForm({...form, city:e.target.value})}/></Field><Field label="Timezone"><TextInput value={form.timezone} onChange={e => setForm({...form, timezone:e.target.value})}/></Field></div><div className="border-t border-paper-line pt-5"><div className="font-display text-xl uppercase mb-3">First school admin</div><div className="grid grid-cols-3 gap-4"><Field label="Name"><TextInput required value={form.adminName} onChange={e => setForm({...form, adminName:e.target.value})}/></Field><Field label="Email"><TextInput required type="email" value={form.adminEmail} onChange={e => setForm({...form, adminEmail:e.target.value})}/></Field><Field label="Temporary password"><TextInput required minLength={8} type="password" value={form.adminPassword} onChange={e => setForm({...form, adminPassword:e.target.value})}/></Field></div></div><ErrorText>{formError}</ErrorText><div className="flex gap-3"><PrimaryButton type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create school'}</PrimaryButton><GhostButton type="button" onClick={() => setShowForm(false)}>Cancel</GhostButton></div></form></Card>}
    {error && <ErrorText>{error}</ErrorText>}
    {!schools && !error && <p className="text-sm text-ink-soft">Loading schools…</p>}
    {schools && <div className="bg-[#FFFDF8] border border-paper-line rounded-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-board text-chalk text-left font-mono text-xs uppercase tracking-wide"><th className="px-4 py-3">School</th><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Students</th><th className="px-4 py-3">Teachers</th><th className="px-4 py-3">Invoices</th></tr></thead><tbody>{schools.map((s,i)=><tr key={s.id} className={i%2===0?'bg-white':'bg-paper/60'}><td className="px-4 py-4"><Link className="font-medium text-ink hover:text-margin" href={`/schools/${s.id}`}>{s.name}</Link><div className="font-mono text-xs text-ink-soft mt-1">{s.slug}{s.city ? ` · ${s.city}` : ''}</div></td><td className="px-4 py-4 text-ink-soft">{s.admin ? <><div>{s.admin.name}</div><div className="font-mono text-xs">{s.admin.email}</div></> : 'No admin'}</td><td className="px-4 py-4 font-mono">{s.counts.students}</td><td className="px-4 py-4 font-mono">{s.counts.teachers}</td><td className="px-4 py-4 font-mono">{s.counts.invoices}</td></tr>)}</tbody></table></div>}
  </AppShell>;
}
