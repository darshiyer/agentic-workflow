"use client";

import { useEffect, useState } from 'react';
import {
  ingestInvoices,
  listInvoices,
  runWorkflow,
  uploadInvoice,
  Invoice,
  WorkflowRun,
} from '@/lib/api';
import DashboardStats from '@/components/DashboardStats';
import InvoiceChart from '@/components/InvoiceChart';
import DecisionChart from '@/components/DecisionChart';
import AgentFlowchart from '@/components/AgentFlowchart';
import WorkflowTimeline from '@/components/WorkflowTimeline';
import { Upload, Play, Loader2, FileText, Sparkles } from 'lucide-react';

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [runHistory, setRunHistory] = useState<WorkflowRun[]>([]);
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
    try {
      const result = await runWorkflow(selectedId);
      setRun(result);
      setRunHistory((prev) => [...prev, result]);
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
    try {
      const uploaded = await uploadInvoice(file);
      setSelectedId(uploaded.invoice_id);
      const result = await runWorkflow(uploaded.invoice_id);
      setRun(result);
      setRunHistory((prev) => [...prev, result]);
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
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Mini <span className="text-gradient">Peakflo</span>
              </h1>
            </div>
            <p className="mt-1 text-slate-400">Agentic accounts-payable workflow for finance teams</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-400 hover:text-white"
            >
              API Docs
            </a>
          </div>
        </header>

        {/* Stats */}
        <DashboardStats invoices={invoices} latestRun={run} />

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <InvoiceChart invoices={invoices} />
          <DecisionChart runs={runHistory} />
        </div>

        {/* Flowchart */}
        <AgentFlowchart activeAgent={run?.steps[run.steps.length - 1]?.agent} />

        {/* Controls */}
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Run Workflow</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <FileText className="h-4 w-4" /> Select synthetic invoice
              </label>
              <select
                className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                value={selectedId || ''}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="" className="bg-slate-900">Choose an invoice…</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id} className="bg-slate-900">
                    {inv.id} — {inv.vendor_name} — ${inv.amount.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Upload className="h-4 w-4" /> Or upload PDF
              </label>
              <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-300 hover:border-sky-500 hover:text-white">
                <span>Drop or click to upload</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRun}
                disabled={!selectedId || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                {loading ? 'Running…' : 'Run Agentic Workflow'}
              </button>
            </div>
          </div>

          {selectedInvoice && (
            <div className="mt-4 grid gap-3 rounded-xl bg-slate-900/30 p-4 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
              <p><span className="text-slate-500">Vendor:</span> {selectedInvoice.vendor_name}</p>
              <p><span className="text-slate-500">Amount:</span> ${selectedInvoice.amount.toLocaleString()} {selectedInvoice.currency}</p>
              <p><span className="text-slate-500">Due:</span> {selectedInvoice.due_date}</p>
              <p><span className="text-slate-500">Risk:</span> {selectedInvoice.vendor_risk}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}
        </div>

        {/* Trace */}
        {run && (
          <div className="glass rounded-2xl p-6">
            <WorkflowTimeline run={run} />
          </div>
        )}
      </div>
    </main>
  );
}
