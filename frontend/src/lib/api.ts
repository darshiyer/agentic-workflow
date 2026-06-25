"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Invoice {
  id: string;
  vendor_name: string;
  vendor_risk: string;
  invoice_number: string;
  amount: number;
  currency: string;
  due_date: string;
  po_number: string;
  gl_code: string;
  status: string;
  risk_flags: string[];
}

export interface WorkflowRun {
  run_id: string;
  invoice_id: string;
  status: string;
  steps: AgentStep[];
  extracted_invoice?: Invoice;
  policy_result?: PolicyResult;
  recommendation?: Recommendation;
  notification?: NotificationPayload;
}

export interface AgentStep {
  agent: string;
  status: string;
  input_summary: string;
  output_summary: string;
  details: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
}

export interface PolicyResult {
  compliant: boolean;
  violations: string[];
  warnings: string[];
  retrieved_policies: { source: string; category?: string; content: string }[];
  explanation: string;
}

export interface Recommendation {
  decision: 'APPROVE' | 'HOLD' | 'ESCALATE';
  reason: string;
  approver_level?: string;
  required_actions: string[];
}

export interface NotificationPayload {
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  sent_at?: string;
}

export async function ingestInvoices(): Promise<Invoice[]> {
  const res = await fetch(`${API_BASE}/invoices/ingest`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to ingest invoices');
  return res.json();
}

export async function listInvoices(): Promise<Invoice[]> {
  const res = await fetch(`${API_BASE}/invoices`);
  if (!res.ok) throw new Error('Failed to list invoices');
  return res.json();
}

export async function runWorkflow(invoiceId: string): Promise<WorkflowRun> {
  const res = await fetch(`${API_BASE}/workflow/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });
  if (!res.ok) throw new Error('Failed to run workflow');
  return res.json();
}

export async function uploadInvoice(file: File): Promise<{ invoice_id: string; extracted: Invoice }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/invoices/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload invoice');
  return res.json();
}

export interface SystemInfo {
  stack: {
    framework: string;
    agent_orchestration: string;
    llm_provider: string;
    llm_model: string;
    embedding_model: string;
    vector_store: string;
    vector_store_path: string;
    ocr: string;
  };
  agents: { name: string; role: string }[];
  rag: {
    indexed_policies: number;
    policy_sources: string[];
  };
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const res = await fetch(`${API_BASE}/system/info`);
  if (!res.ok) throw new Error('Failed to fetch system info');
  return res.json();
}
