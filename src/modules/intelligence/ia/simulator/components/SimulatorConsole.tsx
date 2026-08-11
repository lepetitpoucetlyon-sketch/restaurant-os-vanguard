"use client";

import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { simulator } from '../TemporalSimulator';
import { simulationMetricsAtom, isSimulationRunningAtom } from '../store/simulatorAtoms';
import type { SimulationProfile } from '../SimulationService';
import { ProposalPanel } from '@/kernel/nexus/guards/admin/ProposalPanel';
import { NexusStaffingOracle as StaffingOracle } from '@/modules/human';
import { SovereignLedger } from '@/modules/finance/services/SovereignLedger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/shared/hooks';
import { SimulatorControlBar } from './SimulatorControlBar';
import { SimulatorMetricsGrid } from './SimulatorMetricsGrid';
import { SimulatorOverridesPanel } from './SimulatorOverridesPanel';
import { SimulatorBinaryTerminal } from './SimulatorBinaryTerminal';

export function SimulatorConsole() {
    const { activeTenantId } = useTenant();
    const [metrics, setMetrics] = useAtom(simulationMetricsAtom);
    const [isRunning, setIsRunning] = useAtom(isSimulationRunningAtom);
    const [speed, setSpeed] = useState(5);
    const [profile] = useState<SimulationProfile>('PIZZERIA_RUSH');
    const [logs, setLogs] = useState<{id: string, message: string, type: string, timestamp: string}[]>([]);
    const [history, setHistory] = useState<number[]>([]);
    const [staffRatio, setStaffRatio] = useState(25);
    const [accountingMode, setAccountingMode] = useState<string>('EXPERT');
    const [isOverridesOpen, setIsOverridesOpen] = useState(false);
    const [integrityStatus, setIntegrityStatus] = useState<'IDLE' | 'VERIFYING' | 'SECURE' | 'BREACH'>('IDLE');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await Nexus.adapter.get(Nexus.getTenantPath('settings/global')) as import('@nexus/contracts').GlobalSettings;
                if (data?.planningConfig?.staffToCoversRatio) setStaffRatio(data.planningConfig.staffToCoversRatio);
                if (data?.accountingConfig?.complexityMode) setAccountingMode(data.accountingConfig.complexityMode);
            } catch (_e) {}
        };
        loadSettings();
    }, []);

    const updateStaffRatio = async (val: number) => {
        setStaffRatio(val);
        try {
            const data = await Nexus.adapter.get(Nexus.getTenantPath('settings/global')) as import('@nexus/contracts').GlobalSettings;
            const newSettings = {
                ...data,
                planningConfig: { ...data?.planningConfig, staffToCoversRatio: val }
            };
            await Nexus.adapter.set(Nexus.getTenantPath('settings/global'), newSettings);
            addLog(`Oracle Ratio Adjusted: 1:${val}`, 'info');
            
            if (isRunning) {
                await StaffingOracle.analyzeStaffingGaps(new Date().toISOString().split('T')[0]);
            }
        } catch (e) {
            console.error("Staff Ratio update failed", e);
        }
    };

    const toggleAccountingMode = async () => {
        const prevMode = accountingMode;
        const newMode = prevMode === 'SIMPLE' ? 'EXPERT' : 'SIMPLE';
        setAccountingMode(newMode);
        try {
            const data = await Nexus.adapter.get(Nexus.getTenantPath('settings/global')) as import('@nexus/contracts').GlobalSettings;
            await Nexus.adapter.set(Nexus.getTenantPath('settings/global'), {
                ...data,
                accountingConfig: { ...data?.accountingConfig, complexityMode: newMode }
            });
            addLog(`Financial Complexity: ${newMode}`, 'info');

            if (newMode === 'EXPERT') {
                runInquisiteurQA();
            } else {
                setIntegrityStatus('IDLE');
            }
        } catch (_e) {
            setAccountingMode(prevMode);
            addLog('Financial Complexity toggle failed — reverted.', 'error');
        }
    };

    const runInquisiteurQA = async () => {
        setIntegrityStatus('VERIFYING');
        try {
            const audit = await SovereignLedger.getInstance(activeTenantId ?? 'unknown').runInquisiteurQA();
            setIntegrityStatus(audit.secure ? 'SECURE' : 'BREACH');
            if (!audit.secure) {
                addLog(`INQUISITEUR QA: Critical Balance Breach! Diff: ${(Math.abs(audit.expected - audit.actual)/100).toFixed(2)}€`, 'error');
            } else {
                addLog('INQUISITEUR QA: Ledger Integrity Certified (Grade X).', 'info');
            }
        } catch(_e) {
            setIntegrityStatus('BREACH');
            addLog('INQUISITEUR QA: System Failure during scan.', 'error');
        }
    };
    
    useEffect(() => {
        if (!isRunning) return;
        
        const interval = setInterval(() => {
            const currentMetrics = simulator.getMetrics();
            setMetrics({ ...currentMetrics });
            setHistory(prev => [...prev, currentMetrics.totalRevenueCents].slice(-20));
        }, 500);
        
        return () => clearInterval(interval);
    }, [isRunning, setMetrics]);

    const handleStart = async () => {
        await simulator.initialize();
        simulator.start(profile, speed);
        setIsRunning(true);
        addLog(`Protocol Grade X initiated: ${profile}`, 'info');
    };

    const handleStop = () => {
        simulator.stop();
        setIsRunning(false);
        addLog('Reality restored. Simulation data archived in Sandbox.', 'warn');
    };

    const addLog = (message: string, type: string) => {
        setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), message, type, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
            <SimulatorControlBar
                speed={speed}
                setSpeed={setSpeed}
                isRunning={isRunning}
                isOverridesOpen={isOverridesOpen}
                setIsOverridesOpen={setIsOverridesOpen}
                handleStart={handleStart}
                handleStop={handleStop}
            />

            <SimulatorMetricsGrid
                metrics={metrics}
                history={history}
                isRunning={isRunning}
                formatCurrency={formatCurrency}
            />

            <ProposalPanel />

            <SimulatorOverridesPanel
                isOverridesOpen={isOverridesOpen}
                setIsOverridesOpen={setIsOverridesOpen}
                staffRatio={staffRatio}
                updateStaffRatio={updateStaffRatio}
                accountingMode={accountingMode}
                toggleAccountingMode={toggleAccountingMode}
                integrityStatus={integrityStatus}
            />

            <SimulatorBinaryTerminal
                metrics={metrics}
                logs={logs}
            />
        </div>
    );
}
