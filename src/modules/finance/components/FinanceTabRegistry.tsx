"use client";

import dynamic from "next/dynamic";
import { BookOpen, Receipt, Landmark, Wallet, ShieldCheck, PlusCircle } from "lucide-react";

export const AccountingTab = dynamic(() => import("./_tabs/AccountingTab").then(m => m.AccountingTab));
export const BillingTab = dynamic(() => import("./_tabs/BillingTab").then(m => m.BillingTab));
export const AuditTab = dynamic(() => import("./_tabs/AuditTab").then(m => m.AuditTab));
export const TreasuryTab = dynamic(() => import("./_tabs/TreasuryTab").then(m => m.TreasuryTab));
export const BankTab = dynamic(() => import("./_tabs/BankTab").then(m => m.BankTab));

export { BookOpen, Receipt, Landmark, Wallet, ShieldCheck, PlusCircle };
