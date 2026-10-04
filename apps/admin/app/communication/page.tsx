'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, Select, TextArea, TextInput } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import type { Announcement, AnnouncementAudience, Section } from '../../lib/types';

const labels: Record<AnnouncementAudience, string> = {
  SCHOOL_WIDE: 'Whole school',
  SECTION: 'One section',
  STAFF_ONLY: 'Staff only',
};

export default function CommunicationPage() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('SCHOOL_WIDE');
  const [sectionId, setSectionId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setRows(await api.get<Announcement[]>('/announcements'));
      const s = await api.get<Section[]>('/sections');
      setSections(s);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load communication center.');
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (audience === 'SECTION' && !sectionId) {
      setError('Select a section for a section announcement.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/announcements', {
        title: title.trim(),
        body: body.trim(),
        audience,
        sectionId: audience === 'SECTION' ? sectionId : undefined,
      });
      setTitle(''); setBody(''); setAudience('SCHOOL_WIDE'); setSectionId('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish announcement.');
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setRows((current) => current.filter((row) => row.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete announcement.');
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Communication</div>
        <h1 className="font-display text-4xl uppercase text-ink">Communication center</h1>
        <p className="text-ink-soft mt-2">Publish school, section or staff announcements from one place.</p>
      </div>

      <ErrorText>{error}</ErrorText>
      <Card className="mb-8">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title"><TextInput required value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Audience">
              <Select value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}>
                {(Object.keys(labels) as AnnouncementAudience[]).map((key) => <option key={key} value={key}>{labels[key]}</option>)}
              </Select>
            </Field>
          </div>
          {audience === 'SECTION' && (
            <Field label="Section">
              <Select required value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                <option value="">Select section…</option>
                {sections.map((section) => <option key={section.id} value={section.id}>{section.class?.name} {section.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Message"><TextArea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
          <PrimaryButton type="submit" disabled={saving}>{saving ? 'Publishing…' : 'Publish announcement'}</PrimaryButton>
        </form>
      </Card>

      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-ink-soft">No announcements yet.</p>}
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-ink">{row.title}</h2>
                  <span className="font-mono text-xs text-ink-soft">{labels[row.audience]}</span>
                </div>
                <p className="text-sm text-ink-soft mt-2 whitespace-pre-wrap">{row.body}</p>
                <p className="text-xs text-ink-soft mt-3">{new Date(row.createdAt).toLocaleString()}</p>
              </div>
              <GhostButton type="button" onClick={() => void remove(row.id)}>Delete</GhostButton>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
