import React from 'react';
import { Building2, Plus, ArrowRight } from 'lucide-react';

export default function MCCTenantsPage() {
  const tenants = [
    { id: 'tenant_lepetitpoucet', name: 'Le Petit Poucet', nodes: 8, status: 'Healthy', version: 'v1.4.2' },
    { id: 'tenant_sushikyo', name: 'Sushi Kyo', nodes: 6, status: 'Healthy', version: 'v1.4.2' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Tenants</h1>
          <p className="text-slate-400 mt-2">Manage connected Restaurant Brands</p>
        </div>
        <button className="flex items-center gap-2 bg-action-primary hover:bg-action-primary text-white px-4 py-2 rounded-xl font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Provision Tenant
        </button>
      </header>

      <div className="bg-slate-950/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="p-4 font-medium text-slate-400 text-sm">Tenant Name</th>
              <th className="p-4 font-medium text-slate-400 text-sm">Tenant ID</th>
              <th className="p-4 font-medium text-slate-400 text-sm">Active Nodes</th>
              <th className="p-4 font-medium text-slate-400 text-sm">Status</th>
              <th className="p-4 font-medium text-slate-400 text-sm">Core Version</th>
              <th className="p-4 font-medium text-slate-400 text-sm"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-brand" />
                    </div>
                    <span className="font-semibold text-white">{tenant.name}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-400 font-mono text-sm">{tenant.id}</td>
                <td className="p-4 text-slate-300">{tenant.nodes}</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {tenant.status}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{tenant.version}</td>
                <td className="p-4 text-right">
                  <button className="text-slate-400 hover:text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
