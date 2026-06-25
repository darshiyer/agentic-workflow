"use client";

import { useEffect, useState } from 'react';
import { ingestInvoices, listInvoices, runWorkflow, uploadInvoice, Invoice, WorkflowRun, AgentStep } from '@/lib/api';
import AgentFlowchart from '@/components/AgentFlowchart';
import { Upload, Play, Loader2, FileText, Sparkles, ChevronRight } from 'lucide-react';

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [selectedStep, setSelectedStep] = useState<AgentStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ingestInvoices()
      .then(() => listInvoices())
      .then(setInvoices)
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

  const selectedInvoice = invoices.find((inv) => inv.id === selectedId);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Mini <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Peakflo</span>
              </h1>
              <p className="text-sm text-slate-400">Agentic AP workflow orchestration</p>
            </div>
          </div>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-sky-500 hover:text-white"
          >
            API Docs
          </a>
        </header>

        {/* Controls */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-1">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <FileText className="h-4 w-4 text-sky-400" /> Invoice
              </label>
              <select
                className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                value={selectedId || ''}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="" className="bg-slate-900">Select invoice…</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id} className="bg-slate-900">
                    {inv.id} — {inv.vendor_name} (${inv.amount.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Upload className="h-4 w-4 text-sky-400" /> Upload PDF
              </label>
              <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-300 hover:border-sky-500 hover:text-white">
                <span>Click or drop PDF</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            <div className="flex items-end md:col-span-1">
              <button
                onClick={handleRun}
                disabled={!selectedId || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                {loading ? 'Running…' : 'Run Workflow'}
              </button>
            </div>

            <div className="flex items-end md:col-span-1">
              {selectedInvoice ? (
                <div className="w-full rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-2.5 text-sm">
                  <p className="text-slate-400">Selected</p>
                  <p className="font-semibold text-white">
                    {selectedInvoice.vendor_name} · ${selectedInvoice.amount.toLocaleString()} ·{" "}
                    <span
                      className={`${
                        selectedInvoice.vendor_risk === 'high'
                          ? 'text-rose-400'
                          : selectedInvoice.vendor_risk === 'medium'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {selectedInvoice.vendor_risk} risk
                    </span>
                  </p>
                </div>
              ) : (
                <div className="w-full rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-2.5 text-sm text-slate-500">
                  No invoice selected
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}
        </div>

        {/* Workflow Graph */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Agent Orchestration Graph</h2>
            {run && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  run.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {run.status}
              </span>
            )}
          </div>
          <AgentFlowchart run={run} onNodeClick={(step) => setSelectedStep(step)} />
          <p className="mt-3 text-center text-xs text-slate-500">
            Click a node to inspect its output. Run the workflow above to see live state transitions.
          </p>
        </div>

        {/* Detail Panel */}
        {selectedStep && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white">{selectedStep.agent}</h3>
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${
                  selectedStep.status === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {selectedStep.status}
              </span>
            </div>
            <p className="text-slate-300">{selectedStep.output_summary}</p>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-sky-400">View raw details</summary>
              <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-400">
                {JSON.stringify(selectedStep.details, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}
