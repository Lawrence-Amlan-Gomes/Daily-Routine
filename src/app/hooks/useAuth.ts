// src/app/hooks/useAuth.ts
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  setAuth,
  setGoogleAuth,
  clearAuth,
} from '@/store/features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user) as CleanUser | null;
  const googleUser = useSelector((state: RootState) => state.auth.googleUser) as CleanGoogleUser | null;

  return {
    user,
    googleUser,
    setAuth: (user: CleanUser | null) => dispatch(setAuth(user)),
    setGoogleAuth: (user: CleanGoogleUser | null) => dispatch(setGoogleAuth(user)),
  };
};