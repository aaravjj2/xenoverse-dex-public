'use client';

import { useState } from 'react';

type Stage = 'export' | 'assets' | 'ingest';
type Status = 'idle' | 'running' | 'success' | 'error';

interface StageStatus {
  status: Status;
  output: string;
  error?: string;
}

export default function RebuildPage() {
  const [stages, setStages] = useState<Record<Stage, StageStatus>>({
    export: { status: 'idle', output: '' },
    assets: { status: 'idle', output: '' },
    ingest: { status: 'idle', output: '' },
  });
  const [isRunning, setIsRunning] = useState(false);

  const updateStage = (stage: Stage, update: Partial<StageStatus>) => {
    setStages(prev => ({
      ...prev,
      [stage]: { ...prev[stage], ...update },
    }));
  };

  const runStage = async (stage: Stage, command: string): Promise<boolean> => {
    updateStage(stage, { status: 'running', output: `Running: ${command}\n`, error: undefined });
    
    try {
      const response = await fetch('/api/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        updateStage(stage, { 
          status: 'success', 
          output: result.output || 'Completed successfully',
        });
        return true;
      } else {
        updateStage(stage, { 
          status: 'error', 
          output: result.output || '',
          error: result.error || 'Unknown error',
        });
        return false;
      }
    } catch (err) {
      updateStage(stage, { 
        status: 'error', 
        error: err instanceof Error ? err.message : 'Network error',
      });
      return false;
    }
  };

  const runAllStages = async () => {
    setIsRunning(true);
    
    // Reset all stages
    setStages({
      export: { status: 'idle', output: '' },
      assets: { status: 'idle', output: '' },
      ingest: { status: 'idle', output: '' },
    });
    
    // Run stages in sequence
    const exportOk = await runStage('export', 'node tools/export/index.js');
    if (!exportOk) {
      setIsRunning(false);
      return;
    }
    
    const assetsOk = await runStage('assets', 'node tools/assets/index.js');
    if (!assetsOk) {
      setIsRunning(false);
      return;
    }
    
    await runStage('ingest', 'node tools/ingest/index.js');
    setIsRunning(false);
  };

  const runSingleStage = async (stage: Stage) => {
    setIsRunning(true);
    await runStage(stage, `node tools/${stage === 'export' ? 'export' : stage}/index.js`);
    setIsRunning(false);
  };

  const StatusIcon = ({ status }: { status: Status }) => {
    switch (status) {
      case 'idle': return <span className="text-gray-500">○</span>;
      case 'running': return <span className="animate-spin">◐</span>;
      case 'success': return <span className="text-green-400">✓</span>;
      case 'error': return <span className="text-red-400">✗</span>;
    }
  };

  const StageCard = ({ stage, title, description }: { stage: Stage; title: string; description: string }) => {
    const state = stages[stage];
    
    return (
      <div className={`bg-gray-900 rounded-lg p-4 border-2 ${
        state.status === 'running' ? 'border-blue-500' :
        state.status === 'success' ? 'border-green-500' :
        state.status === 'error' ? 'border-red-500' :
        'border-transparent'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon status={state.status} />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <button
            onClick={() => runSingleStage(stage)}
            disabled={isRunning}
            className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1 rounded"
          >
            Run
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mb-3">{description}</p>
        
        {(state.output || state.error) && (
          <div className="bg-gray-800 rounded p-3 max-h-48 overflow-y-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {state.output}
              {state.error && <span className="text-red-400">{state.error}</span>}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Rebuild Pipeline</h1>
            <p className="text-gray-400 text-sm">
              Re-extract data from the Xenoverse repo and rebuild the database
            </p>
          </div>
          <button
            onClick={runAllStages}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded font-medium"
          >
            {isRunning ? 'Running...' : 'Run All Stages'}
          </button>
        </div>
        
        <div className="space-y-4">
          <StageCard 
            stage="export"
            title="Stage A: Export"
            description="Parse Data/*.dat files (Ruby Marshal format) and export to normalized JSON"
          />
          
          <div className="flex justify-center">
            <div className="text-gray-500 text-2xl">↓</div>
          </div>
          
          <StageCard 
            stage="assets"
            title="Stage B: Assets"
            description="Resolve sprite and cry file paths for each species and form"
          />
          
          <div className="flex justify-center">
            <div className="text-gray-500 text-2xl">↓</div>
          </div>
          
          <StageCard 
            stage="ingest"
            title="Stage C: Ingest"
            description="Load exported JSON into SQLite database for fast querying"
          />
        </div>
        
        {/* Note about server-side execution */}
        <div className="mt-8 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-yellow-400 font-medium mb-2">⚠️ Note</h3>
          <p className="text-sm text-gray-300">
            The rebuild functionality requires server-side execution of Node.js scripts.
            For now, run these commands manually in the terminal:
          </p>
          <div className="mt-3 bg-gray-800 rounded p-3 font-mono text-sm">
            <div>cd /home/aarav/Aarav/Xenoverse/Xenoverse-Ordem-et-Chaos-main</div>
            <div>node tools/export/index.js</div>
            <div>node tools/assets/index.js</div>
            <div>node tools/ingest/index.js</div>
          </div>
        </div>
      </div>
    </div>
  );
}
