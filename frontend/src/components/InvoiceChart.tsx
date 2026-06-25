"use client";

import { Invoice } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Props {
  invoices: Invoice[];
}

export default function InvoiceChart({ invoices }: Props) {
  const data = invoices
    .slice(0, 10)
    .map((inv) => ({
      id: inv.id,
      amount: inv.amount,
      risk: inv.vendor_risk,
    }))
    .sort((a, b) => b.amount - a.amount);

  const colorForRisk = (risk: string) => {
    switch (risk) {
      case 'high':
        return '#f43f5e';
      case 'medium':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Top 10 Invoice Amounts</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => `$${v.toLocaleString()}`} />
            <YAxis type="category" dataKey="id" stroke="#cbd5e1" width={70} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']}
            />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorForRisk(entry.risk)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
