// src/store/ReduxProvider.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { ReactNode, useEffect } from 'react';
import { setAuth } from './features/auth/authSlice'; // Adjust path if needed
import { CleanUser } from './features/auth/authSlice'; // Adjust path if needed

export default function ReduxProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        try {
          const parsedUser: CleanUser = JSON.parse(storedUser);
          store.dispatch(setAuth(parsedUser));
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('authUser'); // Clean up invalid data
        }
      }
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}