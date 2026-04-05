import { X } from 'lucide-react';

export default function TestCaseModal({ test, onClose }) {
  if (!test) return null;

  const isHigh = test.tags?.includes('High') || test.metadata?.priority?.toLowerCase() === 'high';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121212] border border-[#222] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up text-gray-200 custom-scrollbar">
        
        {/* Header directly replicating screenshot */}
        <div className="p-6 pb-2 relative border-b border-[#222] bg-[#0f0f0f]">
          <h2 className="text-2xl font-bold text-white pr-8 mb-2">{test.name || 'Test Case Detail'}</h2>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <p className="text-[#a1a1aa] text-sm leading-relaxed mb-6">
            {test.description || 'Description not provided.'}
          </p>

          {/* Tags Section */}
          <div className="flex gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-lg p-3 w-32 border border-[#222]">
               <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Category</div>
               <span className="bg-[#1e1b4b] text-indigo-400 px-2.5 py-1 rounded-md text-xs font-semibold">Functional</span>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-3 w-32 border border-[#222]">
               <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Priority</div>
               <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${isHigh ? 'bg-[#431407] text-orange-400' : 'bg-[#27272a] text-gray-400'}`}>
                 {isHigh ? 'High' : 'Medium'}
               </span>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-3 w-32 border border-[#222]">
               <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Status</div>
               {test.status === 'passed' ? (
                 <span className="bg-[#064e3b] text-emerald-400 px-2.5 py-1 rounded-md text-xs font-semibold">Passed</span>
               ) : test.status === 'failed' ? (
                 <span className="bg-[#4c0519] text-rose-400 px-2.5 py-1 rounded-md text-xs font-semibold">Failed</span>
               ) : (
                 <span className="bg-[#27272a] text-gray-400 px-2.5 py-1 rounded-md text-xs font-semibold">Draft</span>
               )}
            </div>
          </div>
        </div>

        {/* Steps section */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Test Steps</h3>
          <div className="space-y-4 mb-8">
            {test.steps && test.steps.length > 0 ? (
              test.steps.map((step, idx) => (
                <div key={idx} className="bg-[#161616] border border-[#222] rounded-xl p-4 flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-[#f4f4f5] mb-1">
                      {typeof step === 'string' ? step : step.value || step.action || JSON.stringify(step)}
                    </div>
                    {/* Assuming expected result text may not natively exist per step in DB schema, doing mockup styling if present */}
                    {step.expected && (
                        <div className="text-sm text-[#a1a1aa]"><span className="font-medium text-gray-400">Expected:</span> {step.expected}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic">No steps recorded.</div>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-4">Expected Results</h3>
          <div className="bg-[#161616] border border-[#222] rounded-xl p-4 text-[#a1a1aa] text-sm">
             {test.metadata?.expected_result || test.expected_result || 'All validation rules work correctly.'}
          </div>
        </div>
      </div>
    </div>
  );
}
