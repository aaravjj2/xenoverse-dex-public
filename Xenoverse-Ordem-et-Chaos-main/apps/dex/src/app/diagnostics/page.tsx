'use client';

import { useState, useEffect } from 'react';

interface AssetCoverageEntry {
  covered: number;
  percent: number;
  totalFiles: number;
}

interface DiagnosticData {
  database: {
    available: boolean;
    path: string;
    exists: boolean;
    size: string | null;
  };
  exports: {
    path: string;
    exists: boolean;
    files: Array<{
      name: string;
      size: string;
      modified: string;
    }>;
  };
  stats: {
    speciesCount: number;
    baseSpeciesCount: number;
    formCount: number;
    devEntryCount: number;
    movesCount: number;
    typesCount: number;
    abilitiesCount: number;
    evolutionsCount: number;
    learnsetsCount: number;
    speciesWithLearnset: number;
    itemsCount: number;
    trainersCount: number;
    trainerPartyCount: number;
    worldFactsCount: number;
    assetCoverage: {
      formEntries: number;
      icon: AssetCoverageEntry;
      front: AssetCoverageEntry;
      frontShiny: AssetCoverageEntry;
      cry: AssetCoverageEntry;
    };
  } | null;
  validation?: {
    exists: boolean;
    summary?: {
      errors: number;
      warnings: number;
      infos: number;
    };
    breakdown?: Record<string, number>;
    timestamp?: string;
  };
  latestDiff?: {
    exists: boolean;
    path: string;
    name: string;
  };
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/diagnostics');
      if (!response.ok) throw new Error('Failed to fetch diagnostics');
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${ok ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
      }`}>
      {ok ? '✓' : '✗'} {label}
    </span>
  );

  const CoverageBar = ({ entry, total, label }: { entry: AssetCoverageEntry; total: number; label: string }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={entry.percent >= 80 ? 'text-green-400' : entry.percent >= 50 ? 'text-yellow-400' : 'text-red-400'}>
          {entry.covered.toLocaleString()} / {total.toLocaleString()} ({entry.percent}%)
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-full rounded-full ${entry.percent >= 80 ? 'bg-green-500' : entry.percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          style={{ width: `${entry.percent}%` }}
        ></div>
      </div>
      {entry.totalFiles > entry.covered && (
        <div className="text-xs text-gray-500 mt-1">
          {entry.totalFiles.toLocaleString()} total files ({(entry.totalFiles / Math.max(1, entry.covered)).toFixed(1)} avg per entry)
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDiagnostics}
            className="text-blue-400 hover:text-blue-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Diagnostics</h1>
          <button
            onClick={fetchDiagnostics}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Validation Status */}
          <div className="md:col-span-2 bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Validation Status
              {data?.validation?.exists && (
                <StatusBadge
                  ok={data.validation.summary?.errors === 0}
                  label={data.validation.summary?.errors === 0 ? 'Passed' : 'Failed'}
                />
              )}
            </h2>
            {data?.validation?.exists ? (
              <div className="flex gap-6 text-sm">
                <div className={`flex flex-col items-center p-3 rounded min-w-[100px] ${data.validation.summary.errors > 0 ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                  <span className="text-2xl font-bold">{data.validation.summary.errors}</span>
                  <span>Errors</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded min-w-[100px] bg-yellow-900/30 text-yellow-400">
                  <span className="text-2xl font-bold">{data.validation.summary.warnings}</span>
                  <span>Warnings</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded min-w-[100px] bg-blue-900/30 text-blue-400">
                  <span className="text-2xl font-bold">{data.validation.summary.infos || 0}</span>
                  <span>Infos</span>
                </div>
                <div className="flex-1 flex items-end justify-end">
                  <span className="text-gray-500 text-xs">Last run: {new Date(data.validation.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No validation report found. Run `npm run validate:data`.</div>
            )}
          </div>

          {/* Warnings Breakdown */}
          {data?.validation?.breakdown && Object.keys(data.validation.breakdown).length > 0 && (
            <div className="md:col-span-2 bg-gray-900 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
                <span>Warnings Breakdown</span>
                <span className="text-xs font-normal text-yellow-500 bg-yellow-900/30 px-2 py-1 rounded">
                  Top 5 Categories
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(data.validation.breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([code, count]) => (
                    <div key={code} className="bg-gray-800/50 p-3 rounded border border-gray-700/50 flex justify-between items-center">
                      <span className="text-sm text-gray-300 font-mono truncate mr-2" title={code}>{code}</span>
                      <span className="bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded text-xs font-bold">{count}</span>
                    </div>
                  ))}
              </div>
              <div className="mt-4 text-center">
                <span className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
                  onClick={() => {
                    alert(`Full report located at: out/validation_report.json`);
                  }}
                >
                  View full validation report locations (JSON)
                </span>
              </div>
            </div>
          )}

          {/* Database Status */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Database
              <StatusBadge ok={data?.database.available || false} label={data?.database.available ? 'Connected' : 'Disconnected'} />
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Path</span>
                <span className="font-mono text-xs truncate max-w-[200px]" title={data?.database.path}>
                  {data?.database.path}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">File Exists</span>
                <span>{data?.database.exists ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Size</span>
                <span>{data?.database.size || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Export Files */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Export Files
              <StatusBadge ok={data?.exports.exists || false} label={data?.exports.exists ? 'Found' : 'Missing'} />
            </h2>

            <div className="space-y-2 text-sm">
              {data?.exports.files.map(file => (
                <div key={file.name} className="flex justify-between items-center">
                  <span className="font-mono">{file.name}</span>
                  <span className="text-gray-400">{file.size}</span>
                </div>
              ))}
              {(!data?.exports.files || data.exports.files.length === 0) && (
                <p className="text-gray-500">No export files found</p>
              )}
            </div>
          </div>

          {/* Database Counts */}
          {data?.stats && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Data Counts</h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-blue-400">{data.stats.speciesCount.toLocaleString()}</div>
                  <div className="text-gray-400">Total Species</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.stats.baseSpeciesCount} base • {data.stats.formCount} forms
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-green-400">{data.stats.movesCount.toLocaleString()}</div>
                  <div className="text-gray-400">Moves</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-yellow-400">{data.stats.typesCount}</div>
                  <div className="text-gray-400">Types</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-purple-400">{data.stats.abilitiesCount}</div>
                  <div className="text-gray-400">Abilities</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-orange-400">{data.stats.evolutionsCount.toLocaleString()}</div>
                  <div className="text-gray-400">Evolutions</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-pink-400">{data.stats.learnsetsCount.toLocaleString()}</div>
                  <div className="text-gray-400">Learnset Entries</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.stats.speciesWithLearnset} species covered
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-emerald-400">{data.stats.itemsCount.toLocaleString()}</div>
                  <div className="text-gray-400">Items</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-rose-400">{data.stats.trainersCount.toLocaleString()}</div>
                  <div className="text-gray-400">Trainers</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.stats.trainerPartyCount} party members
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-cyan-400">{data.stats.worldFactsCount.toLocaleString()}</div>
                  <div className="text-gray-400">World Facts</div>
                </div>
              </div>

              {/* Dev entries indicator */}
              {data.stats.devEntryCount > 0 && (
                <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700 rounded text-sm">
                  <span className="text-amber-400">⚠️ {data.stats.devEntryCount} dev/placeholder entries</span>
                  <span className="text-gray-400 ml-2">(hidden from default lists)</span>
                </div>
              )}
            </div>
          )}

          {/* Asset Coverage */}
          {data?.stats && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Asset Coverage</h2>

              <CoverageBar entry={data.stats.assetCoverage.icon} total={data.stats.assetCoverage.formEntries} label="Icons" />
              <CoverageBar entry={data.stats.assetCoverage.front} total={data.stats.assetCoverage.formEntries} label="Front Sprites" />
              <CoverageBar entry={data.stats.assetCoverage.frontShiny} total={data.stats.assetCoverage.formEntries} label="Shiny Sprites" />
              <CoverageBar entry={data.stats.assetCoverage.cry} total={data.stats.assetCoverage.formEntries} label="Cries" />
            </div>
          )}

          {/* Changelog */}
          {data?.latestDiff && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Latest Changelog</h2>
              <div className="text-sm text-gray-400 mb-2">Build: {data.latestDiff.name}</div>
              <div className="flex gap-2">
                <code className="bg-gray-800 p-2 rounded text-xs flex-1 truncate">{data.latestDiff.path}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(data.latestDiff!.path)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                >
                  Copy Path
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-900 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Pipeline Commands</h2>
          <div className="bg-gray-800 rounded p-4 font-mono text-sm space-y-2">
            <div className="text-gray-400"># Stage A: Export data from .dat files</div>
            <div>node tools/export/index.js</div>
            <div className="text-gray-400 mt-4"># Stage B: Resolve asset paths</div>
            <div>node tools/assets/index.js</div>
            <div className="text-gray-400 mt-4"># Stage C: Ingest into SQLite</div>
            <div>node tools/ingest/index.js</div>
          </div>
        </div>
      </div>
    </div>
  );
}
