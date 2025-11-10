// src/app/hooks/useTheme.ts
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  toggleTheme,
} from '@/store/features/theme/themeSlice';

export const useTheme = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((state: RootState) => state.theme.theme);

  return {
    theme,
    toggleTheme: () => dispatch(toggleTheme()),
  };
};