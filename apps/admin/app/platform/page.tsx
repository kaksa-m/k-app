'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { PlatformOverview } from '../../lib/types';

export default function PlatformPage() {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.get<PlatformOverview>('/platform/overview').then(setData).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load platform overview.')); }, []);
  return <AppShell>
    <div className="mb-8"><div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Platform</div><h1 className="font-display text-4xl uppercase text-ink">KAKSAM overview</h1><p className="mt-2 text-sm text-ink-soft">Manage schools and monitor the multi-tenant platform.</p></div>
    <ErrorText>{error}</ErrorText>
    {data && <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"><Metric label="Schools" value={data.schools} /><Metric label="Users" value={data.users} /><Metric label="Active students" value={data.students} /><Metric label="Outstanding fees" value={formatCurrency(data.outstandingFees)} /></div>}
    <Card><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl uppercase">Tenant administration</h2><p className="text-sm text-ink-soft mt-1">Create schools and provision their first School Admin from one place.</p></div><a href="/schools" className="bg-board text-chalk font-semibold text-sm rounded-sm px-4 py-2">Open schools</a></div></Card>
  </AppShell>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="bg-[#FFFDF8] border border-paper-line p-5 rounded-sm"><div className="font-mono text-xs uppercase tracking-wide text-ink-soft">{label}</div><div className="font-display text-3xl text-margin mt-2">{value}</div></div>; }
function formatCurrency(n: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }
