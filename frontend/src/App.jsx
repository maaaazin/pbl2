import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import ProjectsHome from './pages/ProjectsHome';
import ProjectDetails from './pages/ProjectDetails';
import ThemeToggle from './components/ThemeToggle';

// Safe rendering check for incomplete pages
const Placeholder = ({ name }) => (
  <div className="p-12 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
    {name} Page works!
  </div>
);

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
          <nav className="border-b border-gray-200 dark:border-gray-800/80 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center text-white font-bold tracking-tighter shadow-sm shadow-primary-500/20">A</div>
              <span className="text-xl font-bold font-display tracking-tight text-gray-900 dark:text-white">AQUA</span>
            </div>
            <ThemeToggle />
          </nav>
          
          <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8 animate-fade-in">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/projects" element={<ProtectedRoute><ProjectsHome /></ProtectedRoute>} />
              <Route path="/projects/:projectName" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
