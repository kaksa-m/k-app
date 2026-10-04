'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '../../../components/AppShell';
import { Card, ErrorText } from '../../../components/ui';
import { api, ApiError } from '../../../lib/api';

interface SchoolDetail { id:string; name:string; slug:string; city:string|null; timezone:string; users:{id:string;name:string|null;email:string;isActive:boolean}[]; _count:{users:number;students:number;teachers:number;invoices:number}; }

export default function SchoolDetailPage() {
  const params = useParams<{id:string}>(); const [school,setSchool]=useState<SchoolDetail|null>(null); const [error,setError]=useState<string|null>(null);
  useEffect(()=>{api.get<SchoolDetail>(`/platform/schools/${params.id}`).then(setSchool).catch(e=>setError(e instanceof ApiError?e.message:'Failed to load school.'));},[params.id]);
  return <AppShell><div className="mb-8"><div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Tenant</div><h1 className="font-display text-4xl uppercase text-ink">{school?.name ?? 'School'}</h1>{school&&<p className="mt-2 text-sm text-ink-soft">{school.slug} · {school.city ?? 'No city'} · {school.timezone}</p>}</div><ErrorText>{error}</ErrorText>{school&&<><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"><Metric label="Users" value={school._count.users}/><Metric label="Students" value={school._count.students}/><Metric label="Teachers" value={school._count.teachers}/><Metric label="Invoices" value={school._count.invoices}/></div><Card><h2 className="font-display text-2xl uppercase mb-4">School admins</h2><div className="space-y-3">{school.users.map(u=><div key={u.id} className="flex items-center justify-between border-b border-paper-line pb-3"><div><div className="font-medium">{u.name ?? 'Unnamed admin'}</div><div className="text-sm text-ink-soft">{u.email}</div></div><span className="font-mono text-xs text-ink-soft">{u.isActive?'ACTIVE':'INACTIVE'}</span></div>)}</div></Card></>}</AppShell>
}
function Metric({label,value}:{label:string;value:number}){return <div className="bg-[#FFFDF8] border border-paper-line p-5 rounded-sm"><div className="font-mono text-xs uppercase text-ink-soft">{label}</div><div className="font-display text-3xl text-margin mt-2">{value}</div></div>}
