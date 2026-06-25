"use client";

import { Invoice, WorkflowRun } from '@/lib/api';
import { DollarSign, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  latestRun: WorkflowRun | null;
}

export default function DashboardStats({ invoices, latestRun }: Props) {
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const highRiskCount = invoices.filter((inv) => inv.vendor_risk === 'high').length;
  const decision = latestRun?.recommendation?.decision;

  const cards = [
    { label: 'Total Invoices', value: invoices.length, icon: FileText, color: 'text-blue-400' },
    { label: 'Total Amount', value: `$${totalAmount.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'High-Risk Vendors', value: highRiskCount, icon: AlertTriangle, color: 'text-amber-400' },
    {
      label: 'Latest Decision',
      value: decision || '—',
      icon: CheckCircle,
      color: decision === 'APPROVE' ? 'text-emerald-400' : decision === 'ESCALATE' ? 'text-rose-400' : 'text-sky-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass rounded-2xl p-5 transition hover:-translate-y-1 hover:border-slate-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
            </div>
            <card.icon className={`h-8 w-8 ${card.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
