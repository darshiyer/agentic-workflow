"use client";

import { useEffect, useState } from 'react';
import {
  ingestInvoices,
  listInvoices,
  runWorkflow,
  uploadInvoice,
  getSystemInfo,
  Invoice,
  WorkflowRun,
  AgentStep,
  SystemInfo,
} from '@/lib/api';
import AgentFlowchart from '@/components/AgentFlowchart';
import {
  Upload,
  Play,
  Loader2,
  Cpu,
  Database,
  BrainCircuit,
  ScanLine,
  ShieldCheck,
  GitBranch,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const DIFFERENTIATORS = [
  {
    peakflo: "Fixed AI model for extraction & routing",
    ours: "Swappable LLM provider: OpenAI, Ollama, or deterministic fallback for zero-config demos",
    icon: BrainCircuit,
  },
  {
    peakflo: "Rule-based approval thresholds",
    ours: "RAG-grounded policy retrieval with explainable violations and warnings",
    icon: Database,
  },
  {
    peakflo: "Black-box automation decisions",
    ours: "Full structured trace per run: every agent input, output, and retrieved policy",
    icon: GitBranch,
  },
  {
    peakflo: "Cloud OCR only",
    ours: "Local Tesseract OCR + structured field extraction, no API keys required",
    icon: ScanLine,
  },
];

function StatusBadge({ text, type }: { text: string; type: 'success' | 'info' | 'warning' }) {
  const colors = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[type]}`}>
      {text}
    </span>
  );
}

function CodePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="text-xs font-semibold text-slate-400">{title}</span>
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [selectedStep, setSelectedStep] = useState<AgentStep | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([ingestInvoices().then(() => listInvoices()), getSystemInfo()])
      .then(([inv, sys]) => {
        setInvoices(inv);
        setSystemInfo(sys);
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleRun = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setRun(null);
    setSelectedStep(null);
    try {
      const result = await runWorkflow(selectedId);
      setRun(result);
      setSelectedStep(result.steps[result.steps.length - 1]);
    } catch (err: any) {
      setError(err.message || 'Workflow failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setRun(null);
    try {
      const uploaded = await uploadInvoice(file);
      setSelectedId(uploaded.invoice_id);
      const result = await runWorkflow(uploaded.invoice_id);
      setRun(result);
      setSelectedStep(result.steps[result.steps.length - 1]);
      const updated = await listInvoices();
      setInvoices(updated);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
              <Cpu className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Agentic AP <span className="text-gradient">Engine</span>
            </h1>
          </div>
          <p className="max-w-3xl text-lg text-slate-400">
            A modular, observable backend for finance workflows. Built to show how Peakflo-style AP automation
            can be improved with <strong>swappable LLMs</strong>, <strong>RAG-grounded policy checks</strong>,
            and <strong>full structured traces</strong>.
          </p>
        </header>

        {/* System Status */}
        {systemInfo && (
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Framework', value: systemInfo.stack.framework, icon: Layers },
              { label: 'LLM Provider', value: systemInfo.stack.llm_provider, icon: BrainCircuit },
              { label: 'Embedding Model', value: systemInfo.stack.embedding_model.split('/').pop(), icon: Database },
              { label: 'Indexed Policies', value: systemInfo.rag.indexed_policies.toString(), icon: ShieldCheck },
            ].map((card) => (
              <div key={card.label} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <card.icon className="h-6 w-6 text-sky-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Run Workflow */}
        <section className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Run Workflow</h2>
            {run && <StatusBadge text={run.status} type={run.status === 'completed' ? 'success' : 'warning'} />}
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-400">Select invoice</label>
              <select
                className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                value={selectedId || ''}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="" className="bg-slate-900">Choose an invoice…</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id} className="bg-slate-900">
                    {inv.id} — {inv.vendor_name} — ${inv.amount.toLocaleString()} ({inv.vendor_risk} risk)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-400">Or upload PDF</label>
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-300 hover:border-sky-500 hover:text-white">
                <Upload className="h-4 w-4" /> Upload PDF
                <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRun}
                disabled={!selectedId || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                {loading ? 'Executing…' : 'Run Workflow'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}
        </section>

        {/* Agent Architecture */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-xl font-bold text-white">Agent Orchestration Graph</h2>
            <AgentFlowchart run={run} onNodeClick={(step) => setSelectedStep(step)} />
            <p className="mt-3 text-center text-xs text-slate-500">
              Click a node to inspect its output. Each agent emits a structured step in the workflow trace.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Agent Stack</h2>
            {systemInfo?.agents.map((agent, idx) => (
              <div key={agent.name} className="flex gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-sky-400">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{agent.name}</p>
                  <p className="text-xs text-slate-500">{agent.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Results */}
        {run && (
          <section className="grid gap-6 lg:grid-cols-2">
            <CodePanel title="Retrieved Policies (RAG Context)">
              {run.policy_result?.retrieved_policies.length ? (
                <ul className="space-y-3">
                  {run.policy_result.retrieved_policies.map((p, i) => (
                    <li key={i} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
                      <span className="font-semibold text-sky-400">[{p.source}]</span>{' '}
                      {p.content.slice(0, 200)}
                      {p.content.length > 200 ? '…' : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No policies retrieved.</p>
              )}
            </CodePanel>

            <CodePanel title="Final Recommendation">
              {run.recommendation ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <StatusBadge
                      text={run.recommendation.decision}
                      type={
                        run.recommendation.decision === 'APPROVE'
                          ? 'success'
                          : run.recommendation.decision === 'ESCALATE'
                          ? 'warning'
                          : 'info'
                      }
                    />
                    <span className="text-sm text-slate-400">Approver: {run.recommendation.approver_level}</span>
                  </div>
                  <p className="text-sm text-slate-300">{run.recommendation.reason}</p>
                  {run.recommendation.required_actions.length > 0 && (
                    <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
                      {run.recommendation.required_actions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recommendation.</p>
              )}
            </CodePanel>

            <CodePanel title="Full Workflow Trace (Structured JSON)">
              <pre className="code-block max-h-96 overflow-auto text-xs text-slate-400">
                {JSON.stringify(run.steps, null, 2)}
              </pre>
            </CodePanel>

            <CodePanel title={selectedStep ? `Step: ${selectedStep.agent}` : 'Step Output'}>
              {selectedStep ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">{selectedStep.output_summary}</p>
                  <pre className="code-block max-h-96 overflow-auto text-xs text-slate-400">
                    {JSON.stringify(selectedStep.details, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Click a node in the graph above to inspect its raw output.</p>
              )}
            </CodePanel>
          </section>
        )}

        {/* Why this improves Peakflo */}
        <section className="glass rounded-2xl p-6 md:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <Sparkles className="h-5 w-5 text-sky-400" /> How this improves Peakflo-style AP automation
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {DIFFERENTIATORS.map((item) => (
              <div
                key={item.peakflo}
                className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5 transition hover:border-sky-500/30"
              >
                <div className="mb-3 flex items-center gap-2">
                  <item.icon className="h-5 w-5 text-sky-400" />
                  <h3 className="font-semibold text-slate-200">{item.ours.split('：')[0]}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-500">
                    <span className="font-medium text-slate-400">Typical approach:</span> {item.peakflo}
                  </p>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <p className="text-emerald-100/90">{item.ours}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
