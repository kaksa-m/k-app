'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { api, ApiError } from '../../lib/api';
import type { AdminDashboard } from '../../lib/types';

export default function DashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminDashboard>('/dashboard/admin')
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.'));
  }, []);

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Today</div>
        <h1 className="font-display text-4xl uppercase text-ink">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h1>
      </div>

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!data && !error && <p className="text-ink-soft text-sm">Loading today's numbers…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard
              label="Students present"
              value={`${data.students.present} / ${data.students.total}`}
            />
            <StatCard label="Fees collected today" value={formatCurrency(data.feesCollectedToday)} />
            <StatCard label="Outstanding fees" value={formatCurrency(data.outstandingFees)} />
            <StatCard label="Students absent today" value={String(data.alerts.studentsAbsentToday)} />
          </div>

          <div className="bg-[#FFFDF8] border border-paper-line rounded-sm p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4 pb-3 border-b border-paper-line">
              Alerts
            </h2>
            <ul className="space-y-2.5 text-sm">
              <AlertRow
                count={data.alerts.teachersMissingAttendance}
                label="teachers haven't marked attendance yet today"
              />
              <AlertRow
                count={data.alerts.sessionsMissingClasswork}
                label="classes have no classwork update today"
              />
              <AlertRow count={data.alerts.feePaymentsOverdue} label="fee payments are overdue" />
              {data.alerts.teachersMissingAttendance === 0 &&
                data.alerts.sessionsMissingClasswork === 0 &&
                data.alerts.feePaymentsOverdue === 0 && (
                  <li className="text-ink-soft">Nothing needs attention right now.</li>
                )}
            </ul>
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#FFFDF8] border border-paper-line rounded-sm p-5">
      <div className="font-mono text-2xl text-margin">{value}</div>
      <div className="text-xs text-ink-soft mt-1">{label}</div>
    </div>
  );
}

function AlertRow({ count, label }: { count: number; label: string }) {
  if (count === 0) return null;
  return (
    <li className="flex gap-2">
      <span className="font-mono text-margin">{count}</span>
      <span className="text-ink">{label}</span>
    </li>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount,
  );
}
