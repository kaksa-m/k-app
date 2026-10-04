'use client';

import { FormEvent, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, PrimaryButton } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function AccountPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Account</div>
        <h1 className="font-display text-4xl uppercase text-ink">Security</h1>
        <p className="mt-2 text-sm text-ink-soft">Manage your login password and account access.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl uppercase mb-2">Profile</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-ink-soft">Name</span><div className="font-medium">{user?.name ?? '—'}</div></div>
            <div><span className="text-ink-soft">Email</span><div className="font-medium">{user?.email}</div></div>
            <div><span className="text-ink-soft">Role</span><div className="font-mono text-xs">{user?.role.replace('_', ' ')}</div></div>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl uppercase mb-2">Change password</h2>
          <p className="text-sm text-ink-soft mb-5">Use at least 8 characters. Your current password is required.</p>
          <ErrorText>{error}</ErrorText>
          {success && <div className="mb-4 text-sm text-green-700">{success}</div>}
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm">Current password<input required type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="mt-1 w-full border border-paper-line bg-paper px-3 py-2" /></label>
            <label className="block text-sm">New password<input required minLength={8} type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="mt-1 w-full border border-paper-line bg-paper px-3 py-2" /></label>
            <label className="block text-sm">Confirm new password<input required minLength={8} type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="mt-1 w-full border border-paper-line bg-paper px-3 py-2" /></label>
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Change password'}</PrimaryButton>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
