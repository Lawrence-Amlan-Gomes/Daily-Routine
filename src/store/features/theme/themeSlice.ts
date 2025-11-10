// src/store/features/theme/themeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  theme: boolean;        // true = light, false = dark
}

const initialState: ThemeState = {
  theme: false,           // default: light mode
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = !state.theme;
    },
  },
});

export const { toggleTheme } =
  themeSlice.actions;

export default themeSlice.reducer;