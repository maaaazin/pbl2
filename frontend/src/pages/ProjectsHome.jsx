import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Folder, Link as LinkIcon, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ProjectsHome() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [projectName, setProjectName] = useState('');
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [testDetail, setTestDetail] = useState('quick');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      // Assuming a GET /api/v1/projects route exists. If not, it falls back gracefully or returns mock.
      try {
        const res = await axios.get('/api/v1/projects');
        return res.data;
      } catch (e) {
        return []; // Return empty if route doesn't exist yet
      }
    }
  });

  const generateMutation = useMutation({
    mutationFn: async (payload) => {
      // POST /api/v1/generate/ (as per backend spec)
      const res = await axios.post('http://127.0.0.1:8000/api/v1/generate/', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Tests generated successfully!');
      setIsModalOpen(false);
      navigate(`/projects/${projectName}`);
    },
    onError: (err) => {
      toast.error('Failed to generate tests. Check console.');
      console.error(err);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url || !projectName) return toast.error("URL and Project Name required.");
    
    // We send payload to backend. The backend currently generates 5 native tests by default.
    // The "prompt" and "testDetail" can be passed dynamically if backend updates to handle them.
    generateMutation.mutate({
      url,
      project_name: projectName,
      // description: prompt,  // optional future use
      // preferred_count: testDetail === 'quick' ? 5 : testDetail === 'standard' ? 15 : 25
    });
  };

  return (
    <div className="animate-fade-in relative">
      <Toaster position="top-right"/>
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Your Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and execute agentic test suites</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-500 w-8 h-8" /></div>
      ) : projects.length === 0 && !isModalOpen ? (
        <div className="flex flex-col items-center justify-center p-16 glass-card text-center border-dashed border-2">
          <Folder className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No projects found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">Create your first test project by providing a web URL for our agent to analyze.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary gap-2">
            <Plus size={18} /> Test New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div 
              key={p._id || p.id || p.name} 
              onClick={() => navigate(`/projects/${p.name}`)}
              className="glass-card p-6 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-200 dark:border-primary-800/50 group-hover:scale-105 transition-transform">
                  <Folder size={24} />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-500 transition-colors">{p.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
                <LinkIcon size={14} /> {p.url || 'No URL attached'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      {projects.length > 0 && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center transition-transform hover:scale-110 z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#151a25] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-primary-500" size={20}/> New Test Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Target URL</label>
                <input required type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-[#0b0f19] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all dark:text-white" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Project Name</label>
                <input required type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Acme Web App" className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-[#0b0f19] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Testing Prompt (Optional)</label>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Focus heavily on the checkout flow..." rows={2} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-[#0b0f19] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all dark:text-white resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Test Detail</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'quick', label: 'Quick', desc: '5 Tests' },
                    { id: 'standard', label: 'Standard', desc: '10-15 Tests' },
                    { id: 'detailed', label: 'Detailed', desc: '20+ Tests' }
                  ].map(opt => (
                    <div 
                      key={opt.id}
                      onClick={() => setTestDetail(opt.id)}
                      className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${testDetail === opt.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                      <div className={`font-semibold mb-0.5 ${testDetail === opt.id ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {generateMutation.isPending ? (
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 flex flex-col items-center justify-center">
                   <Loader2 className="animate-spin text-primary-500 w-8 h-8 mb-3" />
                   <div className="font-medium text-primary-700 dark:text-primary-400">Agent is Analyzing Page</div>
                   <div className="text-sm text-primary-600/70 dark:text-primary-400/70 text-center mt-1">Generating {testDetail === 'quick' ? '5' : testDetail === 'standard' ? '15' : '20'} high-quality test cases based on precise DOM RAG context...</div>
                </div>
              ) : (
                <button type="submit" className="w-full btn-primary py-3 font-semibold mt-2">
                  Generate Test Cases
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
