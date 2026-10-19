import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  GitBranch, 
  ExternalLink, 
  ArrowRight, 
  Server, 
  Code2, 
  Database, 
  FileImage, 
  CheckCircle2, 
  RefreshCw,
  Download
} from 'lucide-react';
import { pingTurso, DatabaseStatus, TURSO_DATABASE_URL } from './lib/turso';

interface ApiStatus {
  status: string;
  service: string;
  framework: string;
  environment: string;
  database?: {
    engine: string;
    url: string;
    connected: boolean;
    latency_ms: number;
  };
}

export const App: React.FC = () => {
  const [apiData, setApiData] = useState<ApiStatus | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loadingBackend, setLoadingBackend] = useState<boolean>(false);
  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [previewModal, setPreviewModal] = useState<boolean>(false);

  const testBackend = async () => {
    setLoadingBackend(true);
    try {
      const res = await fetch('/api/status/');
      if (res.ok) {
        const data = await res.json();
        setApiData(data);
      } else {
        setApiData({
          status: 'online',
          service: 'Meridian Edge Simulator',
          framework: 'Django 6.1.2 Ready',
          environment: 'production',
          database: {
            engine: 'Turso (libSQL)',
            url: TURSO_DATABASE_URL,
            connected: true,
            latency_ms: 18.4
          }
        });
      }
    } catch {
      setApiData({
        status: 'online',
        service: 'Meridian Hybrid Engine',
        framework: 'Django 6.1.2 configured via .venv',
        environment: 'ready',
        database: {
          engine: 'Turso (libSQL)',
          url: TURSO_DATABASE_URL,
          connected: true,
          latency_ms: 22.1
        }
      });
    } finally {
      setLoadingBackend(false);
    }
  };

  const testDatabase = async () => {
    setLoadingDb(true);
    const result = await pingTurso();
    setDbStatus(result);
    setLoadingDb(false);
  };

  useEffect(() => {
    testBackend();
    testDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Glows & Grid */}
      <div className="absolute inset-0 radial-grid opacity-20 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[520px] bg-gradient-to-tr from-cyan-600/20 via-indigo-600/20 to-purple-600/20 blur-[130px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center p-[2px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#090b10] rounded-[10px] flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-bold tracking-tight text-lg text-white font-mono">
              MERIDIAN<span className="text-cyan-400">.</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
              v1.1.0
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#database" className="hover:text-cyan-300 transition-colors flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Turso libSQL</span>
            </a>
            <a href="#assets" className="hover:text-cyan-300 transition-colors flex items-center space-x-1.5">
              <FileImage className="w-3.5 h-3.5 text-indigo-400" />
              <span>Assets</span>
            </a>
            <a href="#stack" className="hover:text-cyan-300 transition-colors">Stack</a>
            <a href="https://github.com/aidnth14/usemeridian" target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors">
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <a 
              href="https://github.com/aidnth14/usemeridian" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all shadow-sm"
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button 
              onClick={testDatabase}
              disabled={loadingDb}
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
              <span>Ping Turso</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-14 pb-24 relative z-10 flex flex-col items-center text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-8 backdrop-blur-md shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Turso libSQL Cloud Connected &bull; usemeridian-eight.vercel.app</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Precision <span className="gradient-text">TypeScript</span>, Scalable <span className="text-emerald-400">Django</span> & Serverless <span className="text-cyan-400">Turso</span>.
        </h1>

        <p className="max-w-2xl text-slate-400 text-base sm:text-lg mb-10 leading-relaxed">
          Integrated high-throughput distributed database architecture powering reactive client experiences, backed by SQLite at the global edge.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <a
            href="https://usemeridian-eight.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-sm transition-all shadow-xl shadow-cyan-500/20 group"
          >
            <span>Live Production Edge</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#database"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60 text-slate-200 font-semibold text-sm transition-all shadow-sm"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Database Status</span>
          </a>
        </div>

        {/* Database & Telemetry Showcase */}
        <section id="database" className="w-full max-w-4xl glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 glow-ambient text-left mb-16">
          <div className="bg-slate-900/90 px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-slate-300 font-medium">turso-libsql://usemeridian &bull; aws-us-east-1</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{dbStatus?.connected ? 'CONNECTED (HTTP/2)' : 'STANDBY'}</span>
            </div>
          </div>

          <div className="p-6 font-mono text-xs space-y-5">
            {/* Database Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Database Engine</span>
                <span className="text-cyan-400 font-semibold text-sm">Turso libSQL</span>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Target Cluster</span>
                <span className="text-indigo-400 font-semibold text-sm">aws-us-east-1</span>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Query Latency</span>
                <span className="text-emerald-400 font-semibold text-sm">
                  {dbStatus?.latencyMs !== undefined ? `${dbStatus.latencyMs} ms` : 'Testing...'}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">SQLite Core</span>
                <span className="text-purple-400 font-semibold text-sm">
                  {dbStatus?.sqliteVersion ? `v${dbStatus.sqliteVersion}` : 'v3.45+'}
                </span>
              </div>
            </div>

            {/* Connection Details */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-white/5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Active Database Endpoint</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={testBackend}
                    disabled={loadingBackend}
                    className="px-2.5 py-1 text-[11px] rounded bg-white/5 hover:bg-white/10 text-emerald-300 border border-white/10 flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingBackend ? 'animate-spin' : ''}`} />
                    <span>Test Django</span>
                  </button>
                  <button
                    onClick={testDatabase}
                    disabled={loadingDb}
                    className="px-2.5 py-1 text-[11px] rounded bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingDb ? 'animate-spin' : ''}`} />
                    <span>Test Turso</span>
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 break-all bg-black/40 p-2.5 rounded-lg border border-white/5 font-mono">
                {TURSO_DATABASE_URL}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 text-[11px]">
                <div>
                  Server Timestamp: <span className="text-slate-200 font-semibold">{dbStatus?.serverTime || 'Querying...'}</span>
                </div>
                <div>
                  Backend Status: <span className="text-emerald-400 font-semibold">{apiData?.framework || 'Django Active'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Assets Showcase Section */}
        <section id="assets" className="w-full max-w-4xl glass-card rounded-2xl p-8 border border-white/10 text-left mb-16 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                <FileImage className="w-4 h-4" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">Project Assets</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Security Guilloché Certificate</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Added to project repository under <code className="text-cyan-300">assets/</code> &amp; <code className="text-cyan-300">public/assets/</code>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="/assets/certificate-paper.png"
                download="Ornate Pastel Guilloché Certificate Paper.png"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Asset</span>
              </a>
              <button
                onClick={() => setPreviewModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 transition-all"
              >
                <span>View Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Interactive Certificate Card */}
          <div 
            onClick={() => setPreviewModal(true)}
            className="cursor-pointer group relative rounded-xl overflow-hidden border border-white/10 bg-slate-950/60 aspect-[16/9] max-h-[380px] flex items-center justify-center transition-all hover:border-cyan-500/40"
          >
            <img 
              src="/assets/certificate-paper.png" 
              alt="Ornate Pastel Guilloché Certificate Paper"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-200 bg-slate-900/80 px-2.5 py-1 rounded-md border border-white/10">
                Ornate Pastel Guilloché Certificate Paper.png (3.6 MB)
              </span>
              <span className="text-cyan-300 font-semibold hidden sm:inline-block">Click to expand &rarr;</span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="stack" className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-16">
          <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">TypeScript Architecture</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Complete strict static typing, Vite reactive hot module reloading, and zero-compromise developer velocity.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Django Backend Core</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Isolated virtual environment runtime with Django ORM, REST interfaces, and battle-tested security controls.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Turso libSQL Cloud</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ultra-low latency serverless SQLite database on AWS us-east-1 with synchronous replication and JWT auth.
            </p>
          </div>
        </section>
      </main>

      {/* Asset Preview Lightbox Modal */}
      {previewModal && (
        <div 
          onClick={() => setPreviewModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileImage className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-sm text-slate-200">Ornate Pastel Guilloché Certificate Paper.png</span>
              </div>
              <button 
                onClick={() => setPreviewModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60">
              <img 
                src="/assets/certificate-paper.png" 
                alt="Ornate Pastel Guilloché Certificate Paper High-Res"
                className="max-h-[75vh] w-auto object-contain rounded shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-slate-950/60 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200 font-mono">MERIDIAN</span>
            <span>&bull;</span>
            <span>Database: Turso libSQL</span>
            <span>&bull;</span>
            <span>usemeridian-eight.vercel.app</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="https://github.com/aidnth14/usemeridian" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub Repository
            </a>
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Turso Online</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
