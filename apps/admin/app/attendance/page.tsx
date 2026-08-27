'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, PrimaryButton, Select, SuccessText, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { AttendanceRosterEntry, AttendanceStatus, ClassSession, Section } from '../../lib/types';

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  EXCUSED: 'Excused',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classSessionId, setClassSessionId] = useState('');
  const [date, setDate] = useState(today());

  const [roster, setRoster] = useState<AttendanceRosterEntry[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<Section[]>('/sections').then(setSections).catch(() => {});
  }, []);

  useEffect(() => {
    setClassSessionId('');
    setRoster(null);
    if (!sectionId) {
      setSessions([]);
      return;
    }
    api
      .get<ClassSession[]>(`/class-sessions?sectionId=${sectionId}`)
      .then(setSessions)
      .catch(() => setSessions([]));
  }, [sectionId]);

  useEffect(() => {
    setSaved(false);
    if (!classSessionId || !date) {
      setRoster(null);
      return;
    }
    setLoadingRoster(true);
    setError(null);
    api
      .get<AttendanceRosterEntry[]>(`/attendance/session/${classSessionId}?date=${date}`)
      .then((rows) => {
        setRoster(rows);
        const initial: Record<string, AttendanceStatus> = {};
        rows.forEach((r) => {
          if (r.status) initial[r.studentId] = r.status;
        });
        setStatuses(initial);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load roster.'))
      .finally(() => setLoadingRoster(false));
  }, [classSessionId, date]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === classSessionId),
    [sessions, classSessionId],
  );

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
    setSaved(false);
  }

  function markAll(status: AttendanceStatus) {
    if (!roster) return;
    const next: Record<string, AttendanceStatus> = {};
    roster.forEach((r) => (next[r.studentId] = status));
    setStatuses(next);
    setSaved(false);
  }

  async function handleSave() {
    if (!roster) return;
    setSaving(true);
    setError(null);
    try {
      const entries = roster
        .filter((r) => statuses[r.studentId])
        .map((r) => ({ studentId: r.studentId, status: statuses[r.studentId] }));
      await api.post('/attendance', { classSessionId, date, entries });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Day to day</div>
        <h1 className="font-display text-4xl uppercase text-ink">Take attendance</h1>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Section">
            <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">Select a section…</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.class?.name} {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Class session">
            <Select
              value={classSessionId}
              onChange={(e) => setClassSessionId(e.target.value)}
              disabled={!sectionId}
            >
              <option value="">Select a class…</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject?.name} — {s.startTime}–{s.endTime}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        {sectionId && sessions.length === 0 && (
          <p className="text-xs text-ink-soft font-mono mt-3">
            No class sessions scheduled for this section yet — create one via the API (POST /class-sessions).
          </p>
        )}
      </Card>

      <ErrorText>{error}</ErrorText>
      {loadingRoster && <p className="text-ink-soft text-sm">Loading roster…</p>}

      {roster && roster.length === 0 && !loadingRoster && (
        <p className="text-ink-soft text-sm">This section has no active students yet.</p>
      )}

      {roster && roster.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-paper-line">
            <div className="text-sm text-ink-soft">
              {selectedSession?.subject?.name} — {roster.length} student{roster.length === 1 ? '' : 's'}
            </div>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => markAll(s)}
                  className="text-xs font-mono text-ink-soft hover:text-margin"
                >
                  All {STATUS_LABELS[s].toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {roster.map((r) => (
              <div key={r.studentId} className="flex items-center justify-between py-1.5">
                <div className="text-sm text-ink">
                  {r.firstName} {r.lastName}
                  {r.rollNumber && <span className="ml-2 font-mono text-xs text-ink-soft">#{r.rollNumber}</span>}
                </div>
                <div className="flex gap-1.5">
                  {STATUSES.map((s) => {
                    const active = statuses[r.studentId] === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(r.studentId, s)}
                        className={`text-xs font-mono px-2.5 py-1 rounded-sm border transition-colors ${
                          active
                            ? s === 'PRESENT'
                              ? 'bg-marigold/20 border-marigold text-marigold-deep'
                              : 'bg-margin/10 border-margin text-margin'
                            : 'border-paper-line text-ink-soft hover:border-ink-soft'
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-paper-line flex items-center gap-4">
            <PrimaryButton onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save attendance'}
            </PrimaryButton>
            <SuccessText>{saved ? '✓ Saved' : null}</SuccessText>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
