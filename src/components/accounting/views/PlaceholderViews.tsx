
"use client";

import {
    Truck,
    Users,
    BadgeEuro,
    CreditCard,
    ClipboardCheck,
    TrendingUp,
    Receipt,
    Building2,
    FileCheck,
    ArrowUpRight,
    BarChart3,
    Calendar,
    Package
} from "lucide-react";
import { PlaceholderView } from "@/components/accounting/PlaceholderView";

export function SuppliersView() { return <PlaceholderView title="Comptabilité Fournisseurs" description="Gérez les comptes auxiliaires fournisseurs, les échéances et le suivi des règlements." icon={Truck} />; }
export function CustomersView() { return <PlaceholderView title="Comptabilité Clients" description="Gérez les comptes auxiliaires clients, les créances et le suivi des encaissements." icon={Users} />; }
export function EmployeesView() { return <PlaceholderView title="Comptabilité Personnel" description="Gérez la paie, les charges sociales et les déclarations associées." icon={BadgeEuro} />; }
export function CashBankView() { return <PlaceholderView title="Caisse & Banque" description="Gérez les mouvements de trésorerie, les remises en banque et les arrêtés de caisse." icon={CreditCard} />; }
export function ReconciliationView() { return <PlaceholderView title="Rapprochement Bancaire" description="Effectuez le rapprochement entre vos relevés bancaires et votre comptabilité." icon={ClipboardCheck} />; }
export function ForecastView() { return <PlaceholderView title="Prévisions de Trésorerie" description="Projetez vos flux de trésorerie à court et moyen terme." icon={TrendingUp} />; }
export function TVAView() { return <PlaceholderView title="Déclaration TVA" description="Préparez et générez vos déclarations de TVA mensuelles ou trimestrielles." icon={Receipt} />; }
export function ISView() { return <PlaceholderView title="Impôt sur les Sociétés" description="Calculez et gérez vos acomptes et votre charge d'IS." icon={Building2} />; }
export function LiasseFiscaleView() { return <PlaceholderView title="Liasse Fiscale" description="Générez les formulaires fiscaux de fin d'exercice (2050, 2051, etc.)." icon={FileCheck} />; }
export function CashFlowView() { return <PlaceholderView title="Tableau de Flux de Trésorerie" description="Analysez l'origine et l'utilisation de vos flux de trésorerie." icon={ArrowUpRight} />; }
export function AnalyticsView() { return <PlaceholderView title="Ratios & Analyses" description="Consultez les ratios financiers clés et les indicateurs de performance." icon={BarChart3} />; }
export function MonthlyClosingView() { return <PlaceholderView title="Clôture Mensuelle" description="Effectuez les opérations de clôture mensuelle et générez les états intermédiaires." icon={Calendar} />; }
export function AnnualClosingView() { return <PlaceholderView title="Clôture Annuelle" description="Procédez à la clôture de l'exercice, aux écritures d'inventaire et à l'à-nouveau." icon={FileCheck} />; }
export function InventoryView() { return <PlaceholderView title="Inventaire" description="Gérez l'inventaire physique et les écritures de régularisation des stocks." icon={Package} />; }
