"use client";

import React from "react";
import { FileText, Trash2 } from "lucide-react";
import type { User } from "@nexus/contracts";
import { type StaffDocument, KNOWN_SKILLS } from "../staffUtils";
import { JsonObject } from "@/shared/types/json";

/**
 * Onglet « Compétences » de la page Staff — extrait de page.tsx (dette-5).
 * Matrice de compétences + gestion des dossiers/CV par employé.
 */
export interface SkillsTabProps {
    staffMembers: User[];
    isManager: boolean;
    selectedSkillUser: User | null;
    docForm: { name: string; url: string } | null;
    staffDocs: StaffDocument[];
    onToggleSkill: (member: User, skill: string) => void;
    onSelectUser: (user: User) => void;
    setDocForm: React.Dispatch<React.SetStateAction<{ name: string; url: string } | null>>;
    onAddDoc: () => void;
    onDeleteDoc: (doc: StaffDocument) => void;
}

export function SkillsTab({
    staffMembers,
    isManager,
    selectedSkillUser,
    docForm,
    staffDocs,
    onToggleSkill,
    onSelectUser,
    setDocForm,
    onAddDoc,
    onDeleteDoc,
}: SkillsTabProps) {
    return (
        <section className="space-y-8">
            {/* Skill matrix */}
            <div>
                <h2 className="text-lg font-serif font-semibold mb-4">Matrice de compétences</h2>
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="text-sm">
                        <thead className="bg-surface-sidebar text-text-muted text-left">
                            <tr>
                                <th className="px-4 py-2.5 font-medium whitespace-nowrap">Employé</th>
                                {KNOWN_SKILLS.map(skill => (
                                    <th key={skill} className="px-3 py-2.5 font-medium text-center whitespace-nowrap text-[11px]">
                                        {skill}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {staffMembers.map(member => {
                                const skills = ((member as JsonObject).skills as string[] | undefined) ?? [];
                                return (
                                    <tr key={member.id} className="border-t border-border hover:bg-surface-hover">
                                        <td className="px-4 py-2.5 font-medium whitespace-nowrap">{member.name}</td>
                                        {KNOWN_SKILLS.map(skill => {
                                            const has = skills.includes(skill);
                                            return (
                                                <td key={skill} className="px-3 py-2.5 text-center">
                                                    <button
                                                        onClick={() => isManager ? onToggleSkill(member, skill) : undefined}
                                                        title={isManager ? (has ? "Retirer" : "Ajouter") : "Lecture seule"}
                                                        className={`w-6 h-6 rounded-full border-2 transition-colors ${
                                                            has
                                                                ? "bg-status-success border-status-success text-text-primary"
                                                                : "border-border text-transparent"
                                                        } ${isManager ? "hover:opacity-70 cursor-pointer" : "cursor-default"}`}
                                                    >
                                                        {has ? "✓" : ""}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                            {staffMembers.length === 0 && (
                                <tr>
                                    <td colSpan={KNOWN_SKILLS.length + 1} className="px-4 py-8 text-center text-text-muted italic">
                                        Aucun membre d&apos;équipe.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dossiers / CV */}
            <div>
                <h2 className="text-lg font-serif font-semibold mb-4">CV & Dossiers</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Employee selector */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Sélectionner un employé</p>
                        {staffMembers.map(member => (
                            <button
                                key={member.id}
                                onClick={() => onSelectUser(member)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    selectedSkillUser?.id === member.id
                                        ? "bg-action-primary/10 text-action-primary font-medium border border-action-primary/30"
                                        : "hover:bg-surface-hover text-text-muted"
                                }`}
                            >
                                {member.name}
                            </button>
                        ))}
                    </div>

                    {/* Document list + add form */}
                    <div className="lg:col-span-2">
                        {!selectedSkillUser ? (
                            <p className="text-sm text-text-muted italic py-8 text-center">
                                Sélectionnez un employé pour voir ses dossiers.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">{selectedSkillUser.name}</p>
                                    {isManager && !docForm && (
                                        <button
                                            onClick={() => setDocForm({ name: "", url: "" })}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-action-primary text-text-primary text-xs font-medium hover:opacity-90"
                                        >
                                            <FileText className="w-3.5 h-3.5" /> Ajouter un document
                                        </button>
                                    )}
                                </div>

                                {docForm && (
                                    <div className="p-4 rounded-lg border border-border bg-surface-sidebar space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Nom du document (ex : CV 2026)"
                                            value={docForm.name}
                                            onChange={e => setDocForm(f => f ? { ...f, name: e.target.value } : f)}
                                            className="w-full px-3 py-2 rounded-md border border-border bg-surface-base text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                                        />
                                        <input
                                            type="url"
                                            placeholder="URL du fichier (Drive, Dropbox, Firebase Storage…)"
                                            value={docForm.url}
                                            onChange={e => setDocForm(f => f ? { ...f, url: e.target.value } : f)}
                                            className="w-full px-3 py-2 rounded-md border border-border bg-surface-base text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setDocForm(null)} className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary">Annuler</button>
                                            <button onClick={() => onAddDoc()} className="px-3 py-1.5 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90">Enregistrer</button>
                                        </div>
                                    </div>
                                )}

                                {staffDocs.length === 0 && !docForm && (
                                    <p className="text-sm text-text-muted italic py-4 text-center">Aucun document enregistré.</p>
                                )}

                                <div className="space-y-2">
                                    {staffDocs.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-hover">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FileText className="w-4 h-4 text-action-primary shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                                    <p className="text-[11px] text-text-muted">
                                                        {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-action-primary hover:underline"
                                                >
                                                    Ouvrir
                                                </a>
                                                {isManager && (
                                                    <button
                                                        onClick={() => onDeleteDoc(doc)}
                                                        className="p-1 rounded hover:bg-surface-hover text-status-danger"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
