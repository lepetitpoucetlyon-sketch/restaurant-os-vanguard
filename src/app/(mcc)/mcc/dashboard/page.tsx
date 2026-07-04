import React from 'react';
import { Activity, Server, Shield, Users } from 'lucide-react';

export default function MCCDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Fleet Overview</h1>
        <p className="text-slate-400 mt-2">Mission Control Center for Restaurant OS</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { title: "Active Tenants", value: "2", icon: Users, color: "text-brand" },
          { title: "Connected Nodes", value: "14", icon: Server, color: "text-brand" },
          { title: "System Health", value: "99.9%", icon: Activity, color: "text-emerald-400" },
          { title: "Active Seals", value: "1,204", icon: Shield, color: "text-brand" },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/10 transition-all" />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                <h3 className="text-3xl font-bold text-white mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map or System Graph Area */}
      <div className="p-8 rounded-3xl bg-slate-950/50 border border-white/5 flex flex-col items-center justify-center min-h-[400px]">
        <Server className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300">Fleet Topology Network</h3>
        <p className="text-slate-500 mt-2 max-w-md text-center">
          Live visualization of all connected Tenant instances and devices worldwide.
        </p>
      </div>
    </div>
  );
}
