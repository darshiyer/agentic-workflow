"use client";

import { Invoice } from '@/lib/api';

interface Props {
  invoices: Invoice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function InvoiceSelector({ invoices, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">Select synthetic invoice</label>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">-- choose an invoice --</option>
        {invoices.map((inv) => (
          <option key={inv.id} value={inv.id}>
            {inv.id} — {inv.vendor_name} — ${inv.amount.toLocaleString()} {inv.currency}
          </option>
        ))}
      </select>
    </div>
  );
}
