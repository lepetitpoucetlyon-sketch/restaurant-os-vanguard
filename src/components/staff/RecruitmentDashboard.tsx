// @ts-nocheck
// @ts-nocheck
"use client";

import { useAtom } from "jotai";
import { 
    staffSearchQueryAtom, 
    staffStatusFilterAtom, 
    staffCandidateModalOpenAtom, 
    staffEditingCandidateAtom 
} from "@/store/staffAtoms";
import { useRecruitment } from "@/hooks/useRecruitment";
import { Candidate, CandidateStatus } from "@/types/recruitment";
import { 
    Search, 
    Plus, 
    FileText, 
    UserPlus, 
    Mail, 
    Phone, 
    Download, 
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
    Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CandidateModal } from "./CandidateModal";
import { useToast } from "@/components/ui/Toast";

const STATUS_CONFIG: Record<CandidateStatus, { label: string; icon: any; color: string; bg: string }> = {
    new: { label: "Nouveau", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50" },
    interview: { label: "Entretien", icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
    trial: { label: "Essai", icon: CheckCircle2, color: "text-amber-500", bg: "bg-amber-50" },
    hired: { label: "Embauché", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
    refused: { label: "Refusé", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

export const RecruitmentDashboard = () => {
    const { candidates, updateCandidateStatus } = useRecruitment();
    const [searchQuery, setSearchQuery] = useAtom(staffSearchQueryAtom);
    const [statusFilter, setStatusFilter] = useAtom(staffStatusFilterAtom);
    const [showCandidateModal, setShowCandidateModal] = useAtom(staffCandidateModalOpenAtom);
    const [editingCandidate, setEditingCandidate] = useAtom(staffEditingCandidateAtom);
    const { showToast } = useToast();

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = `${c.firstName} ${c.lastName} ${c.appliedRole}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleOpenModal = (candidate?: Candidate) => {
        setEditingCandidate(candidate || null);
        setShowCandidateModal(true);
    };

    const handleUpdateStatus = async (id: string, newStatus: CandidateStatus) => {
        try {
            await updateCandidateStatus(id, newStatus);
            showToast(`Statut mis à jour vers ${STATUS_CONFIG[newStatus].label}`, "success");
        } catch (error) {
            showToast("Erreur lors de la mise à jour", "error");
        }
    };

    const handleDownloadCV = (cvUrl: string, name: string) => {
        const link = document.createElement('a');
        link.href = cvUrl;
        link.download = `CV_${name.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {(Object.entries(STATUS_CONFIG) as [CandidateStatus, any][]).map(([status, config]) => {
                    const count = candidates.filter(c => c.status === status).length;
                    return (
                        <motion.div
                            key={status}
                            whileHover={{ y: -4 }}
                            className={cn(
                                "p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between transition-all cursor-pointer",
                                statusFilter === status ? "ring-2 ring-accent bg-bg-secondary" : "bg-bg-secondary/50 backdrop-blur-xl"
                            )}
                            onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-2.5 rounded-xl", config.bg, config.color)}>
                                    <config.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total</span>
                            </div>
                            <div>
                                <h4 className="text-3xl font-serif font-bold text-text-primary">{count}</h4>
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mt-1">{config.label}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="bg-bg-secondary/50 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Rechercher un candidat, un rôle..."
                        className="w-full h-12 pl-12 pr-4 bg-bg-tertiary rounded-xl border border-border focus:border-accent font-medium outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline" 
                        className="flex-1 md:flex-none h-12 rounded-xl border-border px-6 hover:bg-bg-tertiary transition-all"
                        onClick={() => setStatusFilter('all')}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Tous
                    </Button>
                    <Button 
                        className="flex-1 md:flex-none h-12 rounded-xl bg-accent hover:bg-black text-white px-8 font-bold uppercase text-[10px] tracking-[0.15em] shadow-lg shadow-accent/10 transition-all"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter Candidat
                    </Button>
                </div>
            </div>

            {/* Candidates List */}
            <div className="bg-bg-secondary/50 backdrop-blur-xl rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-tertiary/20 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border/50">
                                <th className="px-8 py-6">Candidat</th>
                                <th className="px-6 py-6 font-serif uppercase tracking-widest">Poste</th>
                                <th className="px-6 py-6 font-serif">Application</th>
                                <th className="px-6 py-6">Statut</th>
                                <th className="px-6 py-6">RGPD</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            <AnimatePresence mode="popLayout">
                                {filteredCandidates.map((candidate) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={candidate.id}
                                        className="group hover:bg-bg-tertiary/10 transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center font-serif text-lg font-bold text-text-primary group-hover:bg-accent group-hover:text-white transition-all">
                                                    {candidate.firstName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h5 className="font-serif font-bold text-text-primary text-[15px] group-hover:text-accent transition-colors">
                                                        {candidate.firstName} {candidate.lastName}
                                                    </h5>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted italic">
                                                            <Mail className="w-3 h-3 opacity-50" /> {candidate.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-[11px] font-bold text-text-primary uppercase tracking-wider border border-border">
                                                {candidate.appliedRole}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 font-mono text-[13px] text-text-muted">
                                            {format(new Date(candidate.createdAt), 'dd MMM yyyy', { locale: fr })}
                                        </td>
                                        <td className="px-6 py-5">
                                            <select
                                                value={candidate.status}
                                                onChange={(e) => handleUpdateStatus(candidate.id, e.target.value as CandidateStatus)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current/10 bg-transparent cursor-pointer outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg-secondary focus:ring-accent",
                                                    STATUS_CONFIG[candidate.status].color
                                                )}
                                            >
                                                {(Object.keys(STATUS_CONFIG) as CandidateStatus[]).map(status => (
                                                    <option key={status} value={status} className="bg-bg-secondary text-text-primary uppercase font-black">
                                                        {STATUS_CONFIG[status].label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2" title={`Consenti le ${format(new Date(candidate.gdpr.date), 'dd/MM/yyyy')}`}>
                                                {candidate.gdpr.consented ? (
                                                    <div className="flex items-center gap-1.5 text-success">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">RGPD-OK</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-error">
                                                        <XCircle className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">RGPD-REFUS</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {candidate.cvUrl && (
                                                    <button 
                                                        onClick={() => handleDownloadCV(candidate.cvUrl!, `${candidate.firstName} ${candidate.lastName}`)}
                                                        className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-muted hover:bg-accent hover:text-white transition-all shadow-sm"
                                                        title="Télécharger CV"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleOpenModal(candidate)}
                                                    className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-muted hover:bg-accent hover:text-white transition-all shadow-sm"
                                                    title="Éditer / Voir"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredCandidates.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-text-muted space-y-4">
                                            <FileText className="w-16 h-16 opacity-20" strokeWidth={1} />
                                            <div>
                                                <h6 className="text-[14px] font-bold uppercase tracking-widest">Aucun candidat trouvé</h6>
                                                <p className="text-[13px] mt-2">Dossiers centralisés sur la plateforme Cloud ORACLE.</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                className="mt-6 border-accent text-accent hover:bg-accent hover:text-white"
                                                onClick={() => handleOpenModal()}
                                            >
                                                Ajouter mon premier candidat
                     </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCandidateModal && (
                <CandidateModal 
                    isOpen={showCandidateModal}
                    onClose={() => setShowCandidateModal(false)}
                    candidate={editingCandidate}
                />
            )}
        </div>
    );
};
