'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
type Notification = { id:string; type:string; title:string; body:string; readAt:string|null; createdAt:string };
export default function NotificationsPage(){
 const [items,setItems]=useState<Notification[]>([]); const [error,setError]=useState<string|null>(null);
 async function load(){try{setItems(await api.get<Notification[]>('/notifications'));}catch(e){setError(e instanceof ApiError?e.message:'Failed to load notifications.')}}
 useEffect(()=>{void load()},[]);
 async function read(id:string){try{await api.post(`/notifications/${id}/read`,{}); setItems(x=>x.map(n=>n.id===id?{...n,readAt:new Date().toISOString()}:n));}catch(e){setError(e instanceof ApiError?e.message:'Failed to mark notification read.')}}
 return <AppShell><div className="mb-8"><div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Inbox</div><h1 className="font-display text-4xl uppercase">Notifications</h1><p className="text-ink-soft mt-2">Announcements and security events relevant to your account.</p></div><ErrorText>{error}</ErrorText><Card><div className="space-y-1">{items.map(n=><button key={n.id} onClick={()=>!n.readAt&&read(n.id)} className={`w-full text-left border-b border-paper-line p-4 last:border-0 ${n.readAt?'opacity-70':'bg-[#fffaf0]'}`}><div className="flex justify-between gap-4"><div className="font-semibold text-sm">{n.title}</div><div className="font-mono text-[10px] text-ink-soft">{new Date(n.createdAt).toLocaleString()}</div></div><p className="text-sm text-ink-soft mt-1">{n.body}</p>{!n.readAt&&<span className="inline-block mt-2 text-[10px] uppercase tracking-wide text-margin">Unread · tap to mark read</span>}</button>)}{items.length===0&&<p className="p-4 text-sm text-ink-soft">You have no notifications.</p>}</div></Card></AppShell>
}
