"use client";

import { useEffect, useState } from 'react';
import InvoiceSelector from '@/components/InvoiceSelector';
import WorkflowRunner from '@/components/WorkflowRunner';
import TraceViewer from '@/components/TraceViewer';
import { ingestInvoices, listInvoices, runWorkflow, uploadInvoice, Invoice, WorkflowRun } from '@/lib/api';

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState<WorkflowRun | null>(null);
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
      // Refresh list so the uploaded invoice appears
      const updated = await listInvoices();
      setInvoices(updated);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-900">Mini Peakflo</h1>
        <p className="mt-1 text-slate-600">Agentic accounts-payable workflow prototype</p>
      </header>

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">1. Choose or upload an invoice</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InvoiceSelector invoices={invoices} selectedId={selectedId} onSelect={setSelectedId} />
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Upload PDF invoice</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">2. Run the agentic workflow</h2>
        <WorkflowRunner onRun={handleRun} loading={loading} disabled={!selectedId} />
      </section>

      {error && (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {run && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <TraceViewer run={run} />
        </section>
      )}
    </main>
  );
}
