import React from 'react';
import { ShieldAlert, Server, Users, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function MCCLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar MCC */}
      <aside className="w-64 bg-slate-950 border-r border-white/5 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-action-primary to-action-primary flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Nexus MCC
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-2">Mission Control Center</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/mcc/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
            <Server className="w-4 h-4" />
            <span className="text-sm font-medium">Fleet Overview</span>
          </Link>
          <Link href="/mcc/tenants" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Tenants</span>
          </Link>
          <Link href="/mcc/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Global Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-slate-900">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-action-primary/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 h-full overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
