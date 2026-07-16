'use client';

import { useEffect } from 'react';
import { useAuth } from '@/features/auth/useAuth';

export function AutoLogout() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
