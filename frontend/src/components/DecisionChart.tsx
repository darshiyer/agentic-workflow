"use client";

import { WorkflowRun } from '@/lib/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  runs: WorkflowRun[];
}

export default function DecisionChart({ runs }: Props) {
  const counts = runs.reduce(
    (acc, run) => {
      const decision = run.recommendation?.decision || 'UNKNOWN';
      acc[decision] = (acc[decision] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  const COLORS: Record<string, string> = {
    APPROVE: '#10b981',
    HOLD: '#f59e0b',
    ESCALATE: '#f43f5e',
    UNKNOWN: '#64748b',
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Decision Distribution</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#64748b'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
