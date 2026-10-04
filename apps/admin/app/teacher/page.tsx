'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, Field, PrimaryButton, Select, SuccessText, TextArea, TextInput } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import { DAY_LABELS } from '../../lib/types';
import type { AttendanceRosterEntry, AttendanceStatus, ClassSession, Classwork, Homework, Teacher } from '../../lib/types';

function todaySchemaDay() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function isoToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function TeacherPage() {
  const [teacher, setTeacher] = useState<(Teacher & { classSessions: ClassSession[] }) | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selected, setSelected] = useState<ClassSession | null>(null);
  const [roster, setRoster] = useState<AttendanceRosterEntry[]>([]);
  const [classwork, setClasswork] = useState<Classwork[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(isoToday());
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [summary, setSummary] = useState('');
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDescription, setHomeworkDescription] = useState('');
  const [homeworkDueDate, setHomeworkDueDate] = useState(isoToday());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const day = todaySchemaDay();
  const todayLabel = DAY_LABELS[day];

  async function selectSession(session: ClassSession, date = attendanceDate) {
    setSelected(session);
    setSuccess(null);
    setError(null);
    try {
      const [attendance, work, homeworkRows] = await Promise.all([
        api.get<AttendanceRosterEntry[]>(`/attendance/session/${session.id}?date=${date}`),
        api.get<Classwork[]>(`/classwork?classSessionId=${session.id}`),
        api.get<Homework[]>(`/homework?classSessionId=${session.id}`),
      ]);
      setRoster(attendance);
      setStatuses(
        Object.fromEntries(
          attendance.map((entry) => [entry.studentId, entry.status ?? 'PRESENT']),
        ) as Record<string, AttendanceStatus>,
      );
      setClasswork(work);
      setHomework(homeworkRows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load class details.');
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [me, mine] = await Promise.all([
        api.get<(Teacher & { classSessions: ClassSession[] })>('/teachers/me'),
        api.get<ClassSession[]>(`/class-sessions/mine?dayOfWeek=${day}`),
      ]);
      setTeacher(me);
      setSessions(mine);
      if (mine.length > 0) await selectSession(mine[0]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load teacher workspace.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveAttendance(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/attendance', {
        classSessionId: selected.id,
        date: attendanceDate,
        entries: roster.map((student) => ({
          studentId: student.studentId,
          status: statuses[student.studentId] ?? 'PRESENT',
        })),
      });
      setSuccess('Attendance saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  }

  async function addClasswork(e: FormEvent) {
    e.preventDefault();
    if (!selected || !summary.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/classwork', { classSessionId: selected.id, date: attendanceDate, summary: summary.trim() });
      setSummary('');
      setSuccess('Classwork added.');
      await selectSession(selected);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add classwork.');
    } finally {
      setSaving(false);
    }
  }

  async function addHomework(e: FormEvent) {
    e.preventDefault();
    if (!selected || !homeworkTitle.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/homework', {
        classSessionId: selected.id,
        assignedDate: attendanceDate,
        dueDate: homeworkDueDate,
        title: homeworkTitle.trim(),
        description: homeworkDescription.trim() || undefined,
      });
      setHomeworkTitle('');
      setHomeworkDescription('');
      setSuccess('Homework added.');
      await selectSession(selected);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add homework.');
    } finally {
      setSaving(false);
    }
  }

  const presentCount = useMemo(
    () => roster.filter((s) => statuses[s.studentId] === 'PRESENT').length,
    [roster, statuses],
  );

  if (loading) {
    return <AppShell><p className="text-ink-soft text-sm">Loading teacher workspace…</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Teacher workspace</div>
        <h1 className="font-display text-4xl uppercase text-ink">{teacher ? `Hello, ${teacher.firstName}` : 'Teacher dashboard'}</h1>
        <p className="text-ink-soft mt-2">{todayLabel} · Your classes, attendance and daily work.</p>
      </div>

      {error && <p className="text-margin text-sm mb-5">{error}</p>}
      {success && <SuccessText>{success}</SuccessText>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <Card>
          <div className="font-mono text-xs uppercase tracking-wide text-ink-soft mb-4">Today&apos;s classes</div>
          {sessions.length === 0 ? (
            <p className="text-sm text-ink-soft">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const active = selected?.id === session.id;
                return (
                  <button
                    key={session.id}
                    onClick={() => void selectSession(session)}
                    className={`w-full text-left border rounded-sm p-3 ${active ? 'border-margin bg-margin/5' : 'border-paper-line hover:border-margin'}`}
                  >
                    <div className="font-medium text-ink">{session.subject?.name ?? 'Subject'}</div>
                    <div className="text-xs text-ink-soft mt-1">{session.section?.class?.name} · {session.section?.name} · {session.startTime}–{session.endTime}</div>
                    {session.room && <div className="text-xs font-mono text-ink-soft mt-1">{session.room}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="font-mono text-xs uppercase tracking-wide text-ink-soft">Selected class</div>
              <h2 className="font-display text-2xl uppercase mt-1">{selected ? `${selected.subject?.name} · ${selected.section?.class?.name} ${selected.section?.name}` : 'No class selected'}</h2>
            </div>
            <Field label="Attendance date">
              <TextInput type="date" value={attendanceDate} onChange={(e) => { setAttendanceDate(e.target.value); if (selected) void selectSession(selected, e.target.value); }} />
            </Field>
          </div>

          {!selected ? (
            <p className="text-sm text-ink-soft">Select one of today&apos;s classes to work with its roster.</p>
          ) : (
            <form onSubmit={saveAttendance}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-xs text-ink-soft uppercase tracking-wide">Attendance · {presentCount}/{roster.length} present</div>
                <PrimaryButton type="submit" disabled={saving || roster.length === 0}>{saving ? 'Saving…' : 'Save attendance'}</PrimaryButton>
              </div>
              <div className="border border-paper-line rounded-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-board text-chalk text-left font-mono text-xs uppercase"><th className="px-3 py-2">Student</th><th className="px-3 py-2">Roll</th><th className="px-3 py-2">Status</th></tr></thead>
                  <tbody>
                    {roster.map((student, i) => (
                      <tr key={student.studentId} className={i % 2 === 0 ? 'bg-white' : 'bg-paper/60'}>
                        <td className="px-3 py-2 font-medium">{student.firstName} {student.lastName}</td>
                        <td className="px-3 py-2 font-mono text-ink-soft">{student.rollNumber ?? '—'}</td>
                        <td className="px-3 py-2"><Select value={statuses[student.studentId] ?? 'PRESENT'} onChange={(e) => setStatuses({ ...statuses, [student.studentId]: e.target.value as AttendanceStatus })}><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="EXCUSED">Excused</option></Select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </form>
          )}
        </Card>
      </div>

      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <div className="font-mono text-xs uppercase tracking-wide text-ink-soft mb-3">Classwork</div>
            <form onSubmit={addClasswork} className="space-y-3 mb-5">
              <Field label="Today&apos;s classwork"><TextArea required rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Chapter 4 — Linear Equations, Q1-Q10" /></Field>
              <PrimaryButton type="submit" disabled={saving}>Add classwork</PrimaryButton>
            </form>
            <div className="space-y-2">
              {classwork.map((item) => <div key={item.id} className="border-t border-paper-line pt-2 text-sm"><div className="font-medium">{item.summary}</div><div className="text-xs text-ink-soft">{new Date(item.date).toLocaleDateString()}</div></div>)}
              {classwork.length === 0 && <p className="text-sm text-ink-soft">No classwork yet.</p>}
            </div>
          </Card>

          <Card>
            <div className="font-mono text-xs uppercase tracking-wide text-ink-soft mb-3">Homework</div>
            <form onSubmit={addHomework} className="space-y-3 mb-5">
              <Field label="Title"><TextInput required value={homeworkTitle} onChange={(e) => setHomeworkTitle(e.target.value)} placeholder="Worksheet 4B" /></Field>
              <Field label="Description"><TextArea rows={2} value={homeworkDescription} onChange={(e) => setHomeworkDescription(e.target.value)} /></Field>
              <Field label="Due date"><TextInput type="date" required value={homeworkDueDate} onChange={(e) => setHomeworkDueDate(e.target.value)} /></Field>
              <PrimaryButton type="submit" disabled={saving}>Add homework</PrimaryButton>
            </form>
            <div className="space-y-2">
              {homework.map((item) => <div key={item.id} className="border-t border-paper-line pt-2 text-sm"><div className="font-medium">{item.title}</div><div className="text-xs text-ink-soft">Due {new Date(item.dueDate).toLocaleDateString()}</div></div>)}
              {homework.length === 0 && <p className="text-sm text-ink-soft">No homework yet.</p>}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
