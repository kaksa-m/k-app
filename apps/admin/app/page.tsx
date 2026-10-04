'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    router.replace(user.role === 'SUPER_ADMIN' ? '/platform' : user.role === 'TEACHER' ? '/teacher' : '/dashboard');
  }, [user, loading, router]);

  return null;
}