"use client";

import React, { useEffect, useState } from 'react';
import { Package, Plus, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';

interface CatalogItem {
  id: string;
  name: string;
  basePrice: number;
  category: string;
}

export function PluginCatalogManager() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CatalogItem>>({});
  
  const [isCreating, setIsCreating] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await authedFetch('/api/admin/fleet/catalog');
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      const itemsArray = Object.entries(data.catalog || {}).map(([id, val]: [string, Record<string, unknown>]) => ({
        id,
        ...val
      }));
      setCatalog(itemsArray as unknown as CatalogItem[]);
    } catch (e) {
      toast.error('Impossible de charger le catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  const handleSave = async (id: string, form: Partial<CatalogItem>) => {
    if (!id.trim()) { toast.error('L\'identifiant du plugin est obligatoire'); return; }
    if (!form.name?.trim()) { toast.error('Le nom du plugin est obligatoire'); return; }
    try {
      const payload = { id: id.trim(), ...form };
      const res = await authedFetch('/api/admin/fleet/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Save error');
      toast.success('Offre sauvegardée avec succès');
      setEditingId(null);
      setIsCreating(false);
      await loadCatalog();
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette offre du catalogue ?')) return;
    try {
      const res = await authedFetch(`/api/admin/fleet/catalog?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete error');
      toast.success('Offre supprimée');
      await loadCatalog();
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditForm({ id: '', name: '', basePrice: 0, category: 'General' });
  };

  return (
    <div className="p-6 bg-surface-card backdrop-blur-md border border-border-subtle rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-brand" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Gestion du Catalogue</h3>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nouvelle Offre
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : (
        <div className="space-y-4">
          {isCreating && (
            <div className="p-4 bg-brand/5 border border-brand/20 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="ID Unique (ex: my_plugin)"
                  value={editForm.id || ''}
                  onChange={e => setEditForm({ ...editForm, id: e.target.value })}
                  className="bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-sm"
                />
                <input 
                  type="text" 
                  placeholder="Nom de l'offre"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-sm"
                />
                <input 
                  type="number" 
                  placeholder="Prix mensuel (€)"
                  value={editForm.basePrice || ''}
                  onChange={e => setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) })}
                  className="bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-sm"
                />
                <input 
                  type="text" 
                  placeholder="Catégorie (ex: Marketing)"
                  value={editForm.category || ''}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-xs text-secondary hover:text-text-primary">Annuler</button>
                <button onClick={() => handleSave(editForm.id!, editForm)} className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" /> Sauvegarder
                </button>
              </div>
            </div>
          )}

          {catalog.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-surface-card border border-border-subtle rounded-xl group hover:border-focus/30 transition-all">
              {editingId === item.id ? (
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 mr-4">
                  <input 
                    type="text" 
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-surface-card border border-border-subtle rounded-lg px-3 py-1 text-sm col-span-2"
                  />
                  <input 
                    type="number" 
                    value={editForm.basePrice !== undefined ? editForm.basePrice : ''}
                    onChange={e => setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) })}
                    className="bg-surface-card border border-border-subtle rounded-lg px-3 py-1 text-sm"
                  />
                  <input 
                    type="text" 
                    value={editForm.category || ''}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="bg-surface-card border border-border-subtle rounded-lg px-3 py-1 text-sm"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{item.name}</span>
                    <span className="px-2 py-0.5 bg-brand/10 text-brand text-nano font-black rounded uppercase tracking-widest">{item.category}</span>
                  </div>
                  <div className="text-nano text-secondary font-mono mt-1">ID: {item.id}</div>
                </div>
              )}

              <div className="flex items-center gap-4">
                {editingId !== item.id && (
                  <div className="text-sm font-bold">{item.basePrice.toFixed(2)} € <span className="text-nano text-secondary font-normal">/ mois</span></div>
                )}
                
                <div className="flex items-center gap-2">
                  {editingId === item.id ? (
                    <>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-secondary hover:text-text-primary"><X className="w-4 h-4" /></button>
                      <button onClick={() => handleSave(item.id, editForm)} className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded"><Save className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(item)} className="p-1.5 text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
