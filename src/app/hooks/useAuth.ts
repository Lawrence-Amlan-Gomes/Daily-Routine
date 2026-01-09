// src/app/hooks/useAuth.ts
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  setAuth,
  setGoogleAuth,
  // clearAuth,  // ← NOT exported from authSlice → removed
} from '@/store/features/auth/authSlice';
import type { CleanUser } from '@/store/features/auth/authSlice'; // optional: explicit import if needed

// If you need CleanGoogleUser, define or import it similarly
// For now, assuming it's defined elsewhere or in the slice
// import type { CleanGoogleUser } from '@/store/features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user) as CleanUser | null;
  const googleUser = useSelector((state: RootState) => state.auth.googleUser) as unknown | null; // replace `any` if type exists

  return {
    user,
    googleUser,
    setAuth: (user: CleanUser | null) => dispatch(setAuth(user)),
    setGoogleAuth: (user: unknown | null) => dispatch(setGoogleAuth(user)), // fix type if CleanGoogleUser exists
  };
};