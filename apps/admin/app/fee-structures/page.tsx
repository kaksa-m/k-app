'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, Select, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { FeeStructure } from '../../lib/types';

type FeeForm = { name: string; amount: string; frequency: string };
const EMPTY_FORM: FeeForm = { name: '', amount: '', frequency: 'monthly' };

export default function FeeStructuresPage() {
  const [items, setItems] = useState<FeeStructure[] | null>(null);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<FeeForm>(EMPTY_FORM);

  async function load() {
    try { setItems(await api.get<FeeStructure[]>('/fees/structures')); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to load fee structures.'); }
  }
  useEffect(() => { void load(); }, []);

  function startCreate() {
    setEditing(null); setForm(EMPTY_FORM); setFormError(null); setShow(true);
  }
  function startEdit(item: FeeStructure) {
    setEditing(item.id);
    setForm({ name: item.name, amount: String(Number(item.amount)), frequency: item.frequency });
    setFormError(null); setShow(true);
  }
  function cancelForm() { setShow(false); setEditing(null); setForm(EMPTY_FORM); setFormError(null); }

  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      const payload = { ...form, name: form.name.trim(), amount: Number(form.amount) };
      if (editing) await api.patch(`/fees/structures/${editing}`, payload);
      else await api.post('/fees/structures', payload);
      cancelForm(); await load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : `Failed to ${editing ? 'update' : 'create'} fee structure.`);
    } finally { setSaving(false); }
  }

  async function remove(item: FeeStructure) {
    if (!window.confirm(`Delete fee structure “${item.name}”? This is only possible when no invoices use it.`)) return;
    setDeleting(item.id); setError(null);
    try { await api.delete(`/fees/structures/${item.id}`); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to delete fee structure.'); }
    finally { setDeleting(null); }
  }

  return <AppShell>
    <div className="flex items-start justify-between mb-8 gap-4"><div><div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Finance</div><h1 className="font-display text-4xl uppercase text-ink">Fee structures</h1><p className="mt-2 text-sm text-ink-soft">Define the charges that invoices can use.</p></div><PrimaryButton onClick={show ? cancelForm : startCreate}>{show ? 'Cancel' : '+ New fee structure'}</PrimaryButton></div>
    {show && <Card className="mb-8"><h2 className="font-display text-xl uppercase mb-4">{editing ? 'Edit fee structure' : 'New fee structure'}</h2><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4"><Field label="Name"><TextInput required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Tuition — Class 8" /></Field><Field label="Amount (₹)"><TextInput required type="number" min="1" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></Field><Field label="Frequency"><Select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option><option value="one-time">One-time</option></Select></Field><div className="md:col-span-3"><ErrorText>{formError}</ErrorText><PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create fee structure'}</PrimaryButton><GhostButton type="button" className="ml-2" onClick={cancelForm}>Cancel</GhostButton></div></form></Card>}
    {error && <div className="mb-4"><ErrorText>{error}</ErrorText></div>}
    {items && <div className="bg-[#FFFDF8] border border-paper-line rounded-sm overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-board text-chalk text-left font-mono text-xs uppercase"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Frequency</th><th className="px-4 py-3">Actions</th></tr></thead><tbody>{items.map((item,i)=><tr key={item.id} className={i%2===0?'bg-white':'bg-paper/60'}><td className="px-4 py-4 font-medium">{item.name}</td><td className="px-4 py-4 font-mono">{formatCurrency(Number(item.amount))}</td><td className="px-4 py-4 text-ink-soft">{item.frequency}</td><td className="px-4 py-3 whitespace-nowrap"><GhostButton onClick={()=>startEdit(item)} disabled={!!deleting}>Edit</GhostButton><button type="button" onClick={()=>remove(item)} disabled={deleting===item.id} className="ml-2 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{deleting===item.id?'Deleting…':'Delete'}</button></td></tr>)}</tbody></table>{items.length===0&&<p className="p-6 text-sm text-ink-soft">No fee structures yet. Create one to get started.</p>}</div>}
  </AppShell>;
}
function formatCurrency(n:number){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n)}
