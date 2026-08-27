'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, Select, TextArea, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { Announcement, AnnouncementAudience, Section } from '../../lib/types';

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  SCHOOL_WIDE: 'Whole school',
  SECTION: 'One section',
  STAFF_ONLY: 'Staff only',
};

const emptyForm = { title: '', body: '', audience: 'SCHOOL_WIDE' as AnnouncementAudience, sectionId: '' };

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .get<Announcement[]>('/announcements')
      .then(setAnnouncements)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load announcements.'));
  }

  useEffect(() => {
    load();
    api.get<Section[]>('/sections').then(setSections).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/announcements', {
        title: form.title,
        body: form.body,
        audience: form.audience,
        sectionId: form.audience === 'SECTION' ? form.sectionId || undefined : undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Day to day</div>
          <h1 className="font-display text-4xl uppercase text-ink">Announcements</h1>
        </div>
        <PrimaryButton onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New announcement'}
        </PrimaryButton>
      </div>

      {showForm && (
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title">
              <TextInput
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Independence Day event"
              />
            </Field>
            <Field label="Message">
              <TextArea
                required
                rows={3}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="School assembly at 9am, followed by a half day."
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Audience">
                <Select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value as AnnouncementAudience })}
                >
                  {(Object.keys(AUDIENCE_LABELS) as AnnouncementAudience[]).map((a) => (
                    <option key={a} value={a}>
                      {AUDIENCE_LABELS[a]}
                    </option>
                  ))}
                </Select>
              </Field>
              {form.audience === 'SECTION' && (
                <Field label="Section">
                  <Select
                    required
                    value={form.sectionId}
                    onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.class?.name} {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
            <ErrorText>{formError}</ErrorText>
            <div className="flex gap-3">
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post announcement'}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setShowForm(false)}>
                Cancel
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!announcements && !error && <p className="text-ink-soft text-sm">Loading announcements…</p>}
      {announcements && announcements.length === 0 && !showForm && (
        <p className="text-ink-soft text-sm">No announcements yet — post the first one above.</p>
      )}

      {announcements && announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
                  <p className="text-sm text-ink-soft mt-1">{a.body}</p>
                </div>
                <span className="font-mono text-xs text-ink-soft whitespace-nowrap">
                  {AUDIENCE_LABELS[a.audience]}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
