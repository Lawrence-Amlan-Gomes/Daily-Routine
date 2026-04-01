// src/app/hooks/useAuth.ts
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { setAuth } from '@/store/features/auth/authSlice';
import type { CleanUser } from '@/store/features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) =>
    state.auth.user
  ) as CleanUser | null;

  return {
    user,

    setAuth: (payload: CleanUser | null) =>
      dispatch(setAuth(payload)),
  };
};