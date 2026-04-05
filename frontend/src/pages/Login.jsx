import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Login() {
  const login = useStore(state => state.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  
  const handleLogin = (e) => {
    e.preventDefault();
    login(email || 'demo@example.com', 'password');
    navigate('/projects');
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-8 glass-card animate-slide-up">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold tracking-tighter shadow-lg shadow-primary-500/30">A</div>
        <h1 className="text-3xl font-bold font-display mb-2 text-gray-900 dark:text-white tracking-tight">Welcome to AQUA</h1>
        <p className="text-gray-500 dark:text-gray-400">Agentic QA Testing Platform</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email address</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="demo@example.com" 
            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-gray-400/80" 
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <a href="#" className="text-xs text-primary-500 hover:text-primary-600 font-medium">Forgot?</a>
          </div>
          <input 
            type="password" 
            placeholder="••••••••" 
            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-gray-400/80" 
          />
        </div>
        <button type="submit" className="w-full btn-primary py-2.5 mt-6 font-semibold">
          Sign In
        </button>
      </form>
    </div>
  );
}
