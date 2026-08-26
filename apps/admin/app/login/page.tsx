'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { ApiError } from '../../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-board px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <svg width="34" height="34" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="7" fill="#0F221D" />
            <rect x="10" y="7" width="1.6" height="26" fill="#B84438" />
            <line x1="15" y1="13" x2="30" y2="13" stroke="#F5F1E4" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
            <line x1="15" y1="19" x2="30" y2="19" stroke="#F5F1E4" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
            <path d="M15 26 L20 31 L31 15" stroke="#E5A231" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="font-display text-2xl text-chalk uppercase tracking-wide">Kaksam</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#FFFDF8] rounded-sm p-8 space-y-4">
          <div>
            <h1 className="font-sans font-semibold text-lg text-ink">Log in</h1>
            <p className="text-sm text-ink-soft mt-1">Use your school email and password.</p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-paper-line bg-paper px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-margin"
              placeholder="you@yourschool.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-paper-line bg-paper px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-margin"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-margin">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-board text-chalk font-semibold text-sm rounded-sm py-2.5 hover:bg-board-deep transition-colors disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>

          <p className="text-xs text-ink-soft font-mono pt-2 border-t border-paper-line">
            Demo: admin@greenvalley.test / password123 (after running the seed script)
          </p>
        </form>
      </div>
    </div>
  );
}
