import { Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useStore();
  
  return (
    <button 
      onClick={toggleTheme} 
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-600 dark:text-gray-400 focus:outline-none"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
