"use client";

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface Props {
  activeAgent?: string;
}

const agentNodes = [
  { id: 'extract', label: 'Data Extraction', description: 'OCR + field parsing' },
  { id: 'policy', label: 'Policy Check', description: 'RAG-grounded compliance' },
  { id: 'approval', label: 'Approval Rec.', description: 'Approve / Hold / Escalate' },
  { id: 'notify', label: 'Notification', description: 'Simulated alert' },
];

export default function AgentFlowchart({ activeAgent }: Props) {
  const nodes: Node[] = useMemo(
    () =>
      agentNodes.map((agent, idx) => ({
        id: agent.id,
        position: { x: idx * 260, y: 80 },
        data: {
          label: (
            <div className="text-center">
              <div className="font-semibold text-slate-100">{agent.label}</div>
              <div className="text-xs text-slate-400">{agent.description}</div>
            </div>
          ),
        },
        style: {
          background: activeAgent === agent.label || activeAgent?.includes(agent.label.replace(' Rec.', 'Recommendation'))
            ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
            : '#1e293b',
          color: '#fff',
          border: '1px solid rgba(148,163,184,0.2)',
          borderRadius: '16px',
          padding: '12px',
          width: 200,
          boxShadow: activeAgent?.includes(agent.label.replace(' Rec.', 'Recommendation'))
            ? '0 0 20px rgba(14,165,233,0.4)'
            : 'none',
        },
      })),
    [activeAgent]
  );

  const edges: Edge[] = useMemo(
    () =>
      agentNodes.slice(0, -1).map((agent, idx) => ({
        id: `e${agent.id}-${agentNodes[idx + 1].id}`,
        source: agent.id,
        target: agentNodes[idx + 1].id,
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
      })),
    []
  );

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-2 text-lg font-semibold text-white">Agent Orchestration Flow</h3>
      <div className="h-80 w-full rounded-xl bg-slate-900/50">
        <ReactFlow nodes={nodes} edges={edges} fitView attributionPosition="bottom-left">
          <Background color="#475569" gap={20} />
          <Controls />
          <MiniMap nodeStrokeWidth={3} className="!bg-slate-800" />
        </ReactFlow>
      </div>
    </div>
  );
}
