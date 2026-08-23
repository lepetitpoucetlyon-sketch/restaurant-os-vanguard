# 05 — Sécurité & Intégration RBAC dans l'Interface

La matrice RBAC s'applique à 3 niveaux d'étanchéité dans l'application :

## 1. Niveau Page : `withPageGuard`
Empêche le montage des pages non autorisées pour le rôle courant (redirection vers `AccessDenied`).

```tsx
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function FinancialPage() {
  return <PageShell title="Comptabilité">...</PageShell>;
}

export default withPageGuard(FinancialPage, "finance");
```

## 2. Niveau Onglet : `<TabGuard>`
Masque les onglets dont le rôle n'a pas les droits dans `DEFAULT_TAB_ACCESS` :

```tsx
<Tabs>
  <TabGuard pageKey="pos" tabKey="tables">
    <TabsTrigger value="tables">Plan de Salle</TabsTrigger>
  </TabGuard>
  
  <TabGuard pageKey="pos" tabKey="history">
    <TabsTrigger value="history">Historique (Manager)</TabsTrigger>
  </TabGuard>
</Tabs>
```

## 3. Niveau Action Sensible : `<ActionGuard>`
Désactive ou masque les boutons d'impact financier, comptable ou managérial :

```tsx
<ActionGuard page="pos" action="apply_discount">
  <Button variant="outline">Appliquer Remise</Button>
</ActionGuard>

<ActionGuard page="finance" action="export_fec" requiresPin>
  <Button variant="default">Générer Export FEC</Button>
</ActionGuard>
```

## Matrice Initiale des Actions Protégées

- **Point de Vente (`pos`)** :
  - `void_line` : `admin`, `directeur`, `manager`
  - `apply_discount` : `admin`, `directeur`, `manager`, `chef_rang`
  - `cash_count` : `admin`, `directeur`, `manager`, `comptable`
- **Cuisine & KDS (`kds`)** :
  - `bump_order` : `admin`, `directeur`, `manager`, `chef_cuisinier`, `cuisinier`
  - `recall_ticket` : `admin`, `directeur`, `manager`, `chef_cuisinier`
- **Comptabilité (`finance`)** :
  - `export_fec` : `admin`, `comptable`
  - `seal_zday` : `admin`, `directeur`
