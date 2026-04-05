import { useState } from 'react';
import toast from 'react-hot-toast';

export default function NeedsActionModal({ projectName, data, onClose, onSuccess }) {
  // `data.inputs` corresponds to the required_inputs array requested by LLM Playwright scripts.
  const [formData, setFormData] = useState({});

  const handleChange = (name, val) => {
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    /*
     We'd usually POST this to a backend resume endpoint. e.g.
     axios.post(`/api/v1/resume-test/${data.testId}`, formData);
    */
    toast.success("Credentials saved to environment (Mocked). Resuming Test...");
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#151a25] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Action Required</h2>
          <p className="text-sm text-gray-500 mt-1">The agent needs the following information to proceed with the test script.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {data?.inputs?.map((inputDef) => (
            <div key={inputDef.name}>
              <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">{inputDef.name}</label>
              <input 
                required 
                type={inputDef.name.toLowerCase().includes('password') ? 'password' : 'text'}
                placeholder={inputDef.hint || ''} 
                onChange={e => handleChange(inputDef.name, e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-[#0b0f19] border border-gray-200 dark:border-gray-700 outline-none  text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/50" 
              />
            </div>
          ))}
          
          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="btn-secondary w-full">Cancel</button>
             <button type="submit" className="btn-primary w-full">Submit & Resume</button>
          </div>
        </form>
      </div>
    </div>
  );
}
