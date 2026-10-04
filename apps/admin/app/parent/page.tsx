'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card } from '../../components/ui';
import { ApiError, api } from '../../lib/api';

type ParentDashboard = {
  parent: { id: string; firstName: string; lastName: string };
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    rollNumber: string | null;
    section: { name: string; class: { name: string } } | null;
    attendance: Array<{
      id: string;
      date: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      classSession: { subject: { name: string } };
    }>;
    invoices: Array<{
      id: string;
      amountDue: string | number;
      amountPaid: string | number;
      dueDate: string;
      status: string;
      feeStructure: { name: string };
      payments: Array<{ id: string; amount: string | number; paidAt: string }>;
    }>;
  }>;
  homework: Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    classSession: { subject: { name: string }; section: { name: string; class: { name: string } } };
  }>;
  classwork: Array<{
    id: string;
    date: string;
    summary: string;
    classSession: { subject: { name: string }; section: { name: string; class: { name: string } } };
  }>;
  announcements: Array<{ id: string; title: string; body: string; createdAt: string }>;
};

const money = (value: string | number) => `₹${Number(value).toLocaleString('en-IN')}`;

export default function ParentPage() {
  const [data, setData] = useState<ParentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .get<ParentDashboard>('/parent-portal/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load parent portal.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell><p className="text-ink-soft text-sm">Loading parent portal…</p></AppShell>;
  if (error) return <AppShell><p className="text-margin text-sm">{error}</p></AppShell>;
  if (!data) return <AppShell><p className="text-ink-soft text-sm">No parent data found.</p></AppShell>;

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Parent portal</div>
        <h1 className="font-display text-4xl uppercase text-ink">Hello, {data.parent.firstName}</h1>
        <p className="text-ink-soft mt-2">A simple view of your children&apos;s school day.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {data.students.map((student) => {
          const recentAbsent = student.attendance.filter((a) => a.status === 'ABSENT').length;
          const outstanding = student.invoices.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.amountDue) - Number(invoice.amountPaid)), 0);
          return (
            <Card key={student.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl uppercase">{student.firstName} {student.lastName}</h2>
                  <p className="text-sm text-ink-soft mt-1">
                    {student.section ? `${student.section.class.name} · ${student.section.name}` : 'No section assigned'}
                    {student.rollNumber ? ` · Roll ${student.rollNumber}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs text-ink-soft uppercase">Outstanding</div>
                  <div className="font-display text-xl">{money(outstanding)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                <div className="border border-paper-line p-3"><div className="text-xs text-ink-soft">Recent absences</div><div className="font-display text-xl mt-1">{recentAbsent}</div></div>
                <div className="border border-paper-line p-3"><div className="text-xs text-ink-soft">Invoices</div><div className="font-display text-xl mt-1">{student.invoices.length}</div></div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="font-mono text-xs uppercase tracking-wide text-ink-soft mb-4">Homework</div>
          <div className="space-y-3">
            {data.homework.map((item) => (
              <div key={item.id} className="border-t border-paper-line pt-3">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-ink-soft mt-1">{item.classSession.subject.name} · {item.classSession.section.class.name} {item.classSession.section.name} · Due {new Date(item.dueDate).toLocaleDateString()}</div>
                {item.description && <div className="text-sm mt-2">{item.description}</div>}
              </div>
            ))}
            {data.homework.length === 0 && <p className="text-sm text-ink-soft">No homework published yet.</p>}
          </div>
        </Card>

        <Card>
          <div className="font-mono text-xs uppercase tracking-wide text-ink-soft mb-4">Recent classwork</div>
          <div className="space-y-3">
            {data.classwork.slice(0, 10).map((item) => (
              <div key={item.id} className="border-t border-paper-line pt-3">
                <div className="font-medium">{item.summary}</div>
                <div className="text-xs text-ink-soft mt-1">{item.classSession.subject.name} · {new Date(item.date).toLocaleDateString()}</div>
              </div>
            ))}
            {data.classwork.length === 0 && <p className="text-sm text-ink-soft">No classwork published yet.</p>}
          </div>
        </Card>

        <Card>
          <div className="font-mono text-xs uppercase tracking-wide text-ink-soft mb-4">Announcements</div>
          <div className="space-y-3">
            {data.announcements.map((item) => (
              <div key={item.id} className="border-t border-paper-line pt-3">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm mt-1">{item.body}</div>
                <div className="text-xs text-ink-soft mt-1">{new Date(item.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
            {data.announcements.length === 0 && <p className="text-sm text-ink-soft">No announcements.</p>}
          </div>
        </Card>

        <Card>
          <div className="font-mono text-xs uppercase tracking-wide text-ink-soft mb-4">Attendance</div>
          <div className="space-y-4">
            {data.students.map((student) => (
              <div key={student.id}>
                <div className="font-medium mb-2">{student.firstName} {student.lastName}</div>
                <div className="space-y-1">
                  {student.attendance.slice(0, 7).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm">
                      <span>{new Date(entry.date).toLocaleDateString()} · {entry.classSession.subject.name}</span>
                      <span className="font-mono text-xs">{entry.status}</span>
                    </div>
                  ))}
                  {student.attendance.length === 0 && <p className="text-sm text-ink-soft">No attendance recorded.</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
