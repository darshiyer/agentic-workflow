"use client";

import { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowRun, AgentStep } from '@/lib/api';
import { FileSearch, ShieldCheck, Gavel, Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  run: WorkflowRun | null;
  onNodeClick?: (step: AgentStep | null) => void;
}

const AGENTS = [
  {
    id: 'extract',
    label: 'Data Extraction',
    subtitle: 'OCR + field parsing',
    icon: FileSearch,
  },
  {
    id: 'policy',
    label: 'Policy Check',
    subtitle: 'RAG-grounded compliance',
    icon: ShieldCheck,
  },
  {
    id: 'approval',
    label: 'Approval Recommendation',
    subtitle: 'Approve / Hold / Escalate',
    icon: Gavel,
  },
  {
    id: 'notify',
    label: 'Notification',
    subtitle: 'Simulated alert',
    icon: Mail,
  },
];

function nodeState(run: WorkflowRun | null, agentId: string): 'idle' | 'running' | 'success' | 'error' {
  if (!run) return 'idle';
  const step = run.steps.find((s) => agentNameToId(s.agent) === agentId);
  if (!step) {
    // If a previous step exists but not this one, it's waiting
    const prevIdx = AGENTS.findIndex((a) => a.id === agentId) - 1;
    if (prevIdx >= 0 && run.steps.some((s) => agentNameToId(s.agent) === AGENTS[prevIdx].id)) {
      return run.status === 'running' ? 'running' : 'idle';
    }
    return 'idle';
  }
  if (step.status === 'error') return 'error';
  return 'success';
}

function agentNameToId(name: string): string {
  if (name.includes('Extraction')) return 'extract';
  if (name.includes('Policy')) return 'policy';
  if (name.includes('Approval')) return 'approval';
  if (name.includes('Notification')) return 'notify';
  return '';
}

function CustomNode({ data }: { data: any }) {
  const { label, subtitle, icon: Icon, state, active } = data;

  const stateStyles = {
    idle: 'border-slate-700 bg-slate-900/60 text-slate-400',
    running: 'border-sky-500 bg-sky-950/60 text-sky-300 shadow-[0_0_30px_rgba(14,165,233,0.35)]',
    success: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300',
    error: 'border-rose-500 bg-rose-950/60 text-rose-300',
  };

  const StatusIcon = state === 'running' ? Loader2 : state === 'success' ? CheckCircle2 : state === 'error' ? AlertCircle : null;

  return (
    <div
      className={`relative w-56 rounded-2xl border-2 p-4 transition-all duration-500 ${stateStyles[state as keyof typeof stateStyles]} ${
        active ? 'scale-105' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3" />
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            state === 'running'
              ? 'bg-sky-500/20'
              : state === 'success'
              ? 'bg-emerald-500/20'
              : state === 'error'
              ? 'bg-rose-500/20'
              : 'bg-slate-800'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold leading-tight text-white">{label}</h4>
          <p className="mt-0.5 text-xs opacity-80">{subtitle}</p>
        </div>
        {StatusIcon && (
          <StatusIcon
            className={`h-5 w-5 shrink-0 ${state === 'running' ? 'animate-spin' : ''}`}
          />
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-sky-500 !w-3 !h-3" />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function AgentFlowchart({ run, onNodeClick }: Props) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = AGENTS.map((agent, idx) => ({
      id: agent.id,
      type: 'custom',
      position: { x: idx * 320, y: 0 },
      data: {
        label: agent.label,
        subtitle: agent.subtitle,
        icon: agent.icon,
        state: nodeState(run, agent.id),
        active: run?.status === 'running' && nodeState(run, agent.id) === 'running',
      },
    }));

    const edges: Edge[] = AGENTS.slice(0, -1).map((agent, idx) => ({
      id: `e-${agent.id}-${AGENTS[idx + 1].id}`,
      source: agent.id,
      target: AGENTS[idx + 1].id,
      animated: nodeState(run, AGENTS[idx + 1].id) === 'running' || nodeState(run, agent.id) === 'success',
      style: {
        stroke: nodeState(run, agent.id) === 'success' ? '#10b981' : '#38bdf8',
        strokeWidth: 3,
      },
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [run]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when run changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      setSelectedNode(node.id);
      if (!run) {
        onNodeClick?.(null);
        return;
      }
      const step = run.steps.find((s) => agentNameToId(s.agent) === node.id);
      onNodeClick?.(step || null);
    },
    [run, onNodeClick]
  );

  return (
    <div className="h-[420px] w-full rounded-2xl border border-slate-700/50 bg-slate-950/60">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={24} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
