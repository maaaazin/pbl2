import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Play, Loader2, ArrowLeft, KeySquare, Download, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import TestCaseModal from '../components/TestCaseModal';
import NeedsActionModal from '../components/NeedsActionModal';

export default function ProjectDetails() {
  const { projectName } = useParams();
  const queryClient = useQueryClient();
  
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [actionRequiredData, setActionRequiredData] = useState(null);

  // MOCK or live data fetch for tests
  const { data: testCases = [], isLoading } = useQuery({
    queryKey: ['testCases', projectName],
    queryFn: async () => {
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/test-cases/${projectName}`);
      return res.data;
    }
  });

  // Execute single test
  const executeMutation = useMutation({
    mutationFn: async (testId) => {
      const res = await axios.post(`http://127.0.0.1:8000/api/v1/${projectName}/${testId}`);
      return res.data;
    },
    onSuccess: (data, testId) => {
      // Invalidate query to refresh status
      queryClient.invalidateQueries(['testCases', projectName]);
      
      if (data.status === 'waiting' || data.required_inputs) {
         toast('Action required for test!', { icon: '⚠️' });
         setActionRequiredData({ testId, inputs: data.required_inputs });
      } else if (data.status === 'passed') {
         toast.success('Test Passed!');
      } else {
         toast.error('Test Failed: ' + (data.failure_reason || 'Unknown error'));
      }
    },
    onError: (err) => {
      toast.error('Execution encountered a network error.');
      console.error(err);
    }
  });

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'passed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Passed</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">Failed</span>;
      case 'waiting':
      case 'needs action':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">Needs Action</span>;
      case 'draft':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">Draft</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    const isHigh = priority?.toLowerCase() === 'high';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${isHigh ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
        {priority || 'Medium'}
      </span>
    );
  };

  const getCategoryBadge = (category) => (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
      {category || 'Functional'}
    </span>
  );

  return (
    <div className="animate-fade-in pb-20">
      <Toaster position="top-right" />
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 text-sm font-medium mb-3 transition-colors">
            <ArrowLeft size={16} /> Back to Projects
          </button>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Project: {projectName}</h1>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary gap-2 text-sm whitespace-nowrap"><Play size={16}/> Load test</button>
          <button className="btn-secondary gap-2 text-sm whitespace-nowrap"><KeySquare size={16}/> Protected Routes Key</button>
          <button className="btn-secondary gap-2 text-sm whitespace-nowrap"><Download size={16}/> Export Report</button>
        </div>
      </div>

      {/* Table Container exactly replicating Image 2 */}
      <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#222] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#222]">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#222]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto text-primary-500"/></td></tr>
              ) : testCases.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No test cases generated yet.</td></tr>
              ) : (
                testCases.map((tc) => {
                  const isRunning = executeMutation.isPending && executeMutation.variables === tc._id;
                  const tcIdStr = tc._id.substring(0,6);
                  const logicalId = tc.metadata?.test_id || `tc-${tcIdStr}`;
                  
                  return (
                    <tr 
                      key={tc._id} 
                      className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                      onClick={(e) => {
                        // Prevent modal open if they clicked a button specifically
                        if(e.target.closest('button')) return;
                        setSelectedTestCase(tc);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400 dark:text-gray-500">{logicalId}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">{tc.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getCategoryBadge(tc.tags?.find(t => t === 'Functional') || 'Functional')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(tc.tags?.find(t => ['High','Medium','Low'].includes(t)) || tc.metadata?.priority)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(tc.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tc.duration || '--'}</td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {tc.status === 'waiting' ? (
                           <button 
                            onClick={(e) => { e.stopPropagation(); setActionRequiredData({testId: tc._id, inputs: []}); }}
                            className="inline-flex items-center justify-center rounded-lg bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-500 transition-colors border border-amber-500/20"
                           >
                            <AlertTriangle size={14} className="mr-1.5"/> Provide Auth
                           </button>
                        ) : isRunning ? (
                          <button disabled className="inline-flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#222] px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed border border-transparent dark:border-[#333]">
                            <Loader2 size={14} className="mr-1.5 animate-spin" /> Testing...
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); executeMutation.mutate(tc._id); }}
                            className="inline-flex items-center justify-center rounded-lg bg-transparent hover:bg-gray-100 dark:hover:bg-[#222] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-[#333]"
                          >
                            <Play size={14} className="mr-1.5" /> Start
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedTestCase && <TestCaseModal test={selectedTestCase} onClose={() => setSelectedTestCase(null)} />}
      
      {actionRequiredData && (
        <NeedsActionModal 
          projectName={projectName}
          data={actionRequiredData} 
          onClose={() => setActionRequiredData(null)}
          onSuccess={() => {
            setActionRequiredData(null);
            queryClient.invalidateQueries(['testCases', projectName]);
            // Conceptually we re-trigger the executeMutation here.
            executeMutation.mutate(actionRequiredData.testId);
          }}
        />
      )}
    </div>
  );
}
