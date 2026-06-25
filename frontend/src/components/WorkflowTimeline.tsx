"use client";

import { WorkflowRun, AgentStep, PolicyResult, Recommendation, NotificationPayload } from '@/lib/api';
import { CheckCircle, AlertCircle, XCircle, Clock, FileSearch, ShieldCheck, Gavel, Mail } from 'lucide-react';

const agentIcons: Record<string, React.ElementType> = {
  DataExtractionAgent: FileSearch,
  PolicyCheckAgent: ShieldCheck,
  ApprovalRecommendationAgent: Gavel,
  NotificationAgent: Mail,
};

function statusIcon(status: string) {
  if (status === 'success') return <CheckCircle className="h-5 w-5 text-emerald-400" />;
  if (status === 'error') return <XCircle className="h-5 w-5 text-rose-400" />;
  return <Clock className="h-5 w-5 text-slate-400" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

export default function WorkflowTimeline({ run }: { run: WorkflowRun }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          Workflow Trace <span className="text-gradient">#{run.run_id}</span>
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            run.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}
        >
          {run.status}
        </span>
      </div>

      <div className="relative space-y-4">
        {run.steps.map((step, idx) => {
          const Icon = agentIcons[step.agent] || AlertCircle;
          return (
            <div key={idx} className="relative flex gap-4">
              {idx < run.steps.length - 1 && (
                <div className="absolute left-6 top-14 h-full w-0.5 bg-gradient-to-b from-sky-500/50 to-transparent" />
              )}
              <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 ring-2 ring-sky-500/30">
                <Icon className="h-5 w-5 text-sky-400" />
              </div>
              <div className="glass w-full rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-100">{step.agent.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  {statusIcon(step.status)}
                </div>
                <p className="mt-1 text-sm text-slate-300">{step.output_summary}</p>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-sky-400">View details</summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-400">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Policy Check Result">
          {run.policy_result ? (
            <>
              <div className="flex items-center gap-2">
                {run.policy_result.compliant ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-300">COMPLIANT</span>
                ) : (
                  <span className="rounded-full bg-rose-500/20 px-2 py-1 text-xs font-bold text-rose-300">NON-COMPLIANT</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-300">{run.policy_result.explanation}</p>
              {run.policy_result.retrieved_policies.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-400">Retrieved policies</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {run.policy_result.retrieved_policies.slice(0, 4).map((p, i) => (
                      <span key={i} className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                        {p.source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">No policy result yet.</p>
          )}
        </Section>

        <Section title="Approval Recommendation">
          {run.recommendation ? (
            <>
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${
                  run.recommendation.decision === 'APPROVE'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : run.recommendation.decision === 'ESCALATE'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {run.recommendation.decision}
              </span>
              <p className="mt-2 text-sm text-slate-300">{run.recommendation.reason}</p>
              {run.recommendation.required_actions.length > 0 && (
                <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-400">
                  {run.recommendation.required_actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">No recommendation yet.</p>
          )}
        </Section>
      </div>

      {run.notification && (
        <Section title="Simulated Notification">
          <div className="space-y-1 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">Channel:</span> {run.notification.channel}
            </p>
            <p>
              <span className="text-slate-500">To:</span> {run.notification.recipient}
            </p>
            <p>
              <span className="text-slate-500">Subject:</span> {run.notification.subject}
            </p>
            <p className="mt-2 text-xs text-slate-400">{run.notification.body}</p>
          </div>
        </Section>
      )}
    </div>
  );
}
