"use client";

interface Props {
  onRun: () => void;
  loading: boolean;
  disabled: boolean;
}

export default function WorkflowRunner({ onRun, loading, disabled }: Props) {
  return (
    <button
      onClick={onRun}
      disabled={disabled || loading}
      className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {loading ? 'Running agentic workflow…' : 'Run Agentic Workflow'}
    </button>
  );
}
