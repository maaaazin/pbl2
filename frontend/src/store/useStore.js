import { create } from 'zustand';

export const useStore = create((set) => ({
  // Authentication
  isAuthenticated: false,
  user: null,
  login: (email, password) => {
    // Mock login
    set({ isAuthenticated: true, user: { email, name: 'Guest User' } });
  },
  logout: () => set({ isAuthenticated: false, user: null }),

  // Theme support
  theme: localStorage.getItem('theme') || 'dark',
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      
      return { theme: newTheme };
    });
  },
}));

// Initialize theme immediately
if (typeof window !== 'undefined') {
  const root = window.document.documentElement;
  const initialTheme = localStorage.getItem('theme') || 'dark';
  root.classList.remove('light', 'dark');
  root.classList.add(initialTheme);
}
