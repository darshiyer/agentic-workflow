"use client";

import { WorkflowRun, AgentStep, PolicyResult, Recommendation, NotificationPayload } from '@/lib/api';

function statusColor(status: string) {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

function decisionColor(decision: string) {
  switch (decision) {
    case 'APPROVE':
      return 'bg-green-600 text-white';
    case 'HOLD':
      return 'bg-amber-500 text-white';
    case 'ESCALATE':
      return 'bg-red-600 text-white';
    default:
      return 'bg-slate-600 text-white';
  }
}

function StepCard({ step, index }: { step: AgentStep; index: number }) {
  return (
    <div className="relative pl-8">
      <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
        {index + 1}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">{step.agent}</h3>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor(step.status)}`}>
            {step.status}
          </span>
        </div>
        <p className="text-sm text-slate-600">{step.output_summary}</p>
        {Object.keys(step.details).length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-brand-600">View details</summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-100 p-2 text-xs text-slate-700">
              {JSON.stringify(step.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

function PolicySection({ result }: { result?: PolicyResult }) {
  if (!result) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold text-slate-800">Policy Check</h3>
      <p className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${result.compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {result.compliant ? 'Compliant' : 'Non-compliant'}
      </p>
      <p className="mt-2 text-sm text-slate-600">{result.explanation}</p>
      {result.retrieved_policies.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-700">Retrieved policies:</p>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
            {result.retrieved_policies.slice(0, 3).map((p, i) => (
              <li key={i}>[{p.source}] {p.category || 'policy'}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RecommendationSection({ result }: { result?: Recommendation }) {
  if (!result) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold text-slate-800">Approval Recommendation</h3>
      <span className={`inline-block rounded px-3 py-1 text-sm font-bold ${decisionColor(result.decision)}`}>
        {result.decision}
      </span>
      <p className="mt-2 text-sm text-slate-600">{result.reason}</p>
      {result.required_actions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-700">Required actions:</p>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
            {result.required_actions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NotificationSection({ payload }: { payload?: NotificationPayload }) {
  if (!payload) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold text-slate-800">Simulated Notification</h3>
      <p className="text-sm text-slate-600">
        <span className="font-medium">To:</span> {payload.recipient}
      </p>
      <p className="text-sm text-slate-600">
        <span className="font-medium">Subject:</span> {payload.subject}
      </p>
      <p className="mt-2 text-xs text-slate-500">{payload.body}</p>
    </div>
  );
}

interface Props {
  run: WorkflowRun | null;
}

export default function TraceViewer({ run }: Props) {
  if (!run) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Workflow Trace — Run {run.run_id}</h2>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor(run.status)}`}>
          {run.status}
        </span>
      </div>

      <div className="space-y-4">
        {run.steps.map((step, idx) => (
          <StepCard key={idx} step={step} index={idx} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PolicySection result={run.policy_result} />
        <RecommendationSection result={run.recommendation} />
      </div>

      <NotificationSection payload={run.notification} />
    </div>
  );
}
