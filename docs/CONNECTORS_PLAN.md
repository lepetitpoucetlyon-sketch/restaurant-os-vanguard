# Plan Connecteurs Externes — Restaurant OS

> **Philosophie** : le client choisit son provider dans les Paramètres.
> Tout ce qui se passe à l'extérieur remonte dans son interface.
> Ajouter un provider = une classe + une ligne dans un registre. Rien d'autre ne change.

## Architecture commune (pattern à répliquer partout)

Le modèle bancaire existant (`OpenBankingProviderFactory`) est la référence.
Chaque catégorie suit exactement le même schéma :

```
src/modules/<pilier>/connectors/
  types.ts                  ← interface IXxxProvider
  XxxProviderFactory.ts     ← registre + get(providerId)
  providers/
    ProviderA.ts
    ProviderB.ts
    ...
```

Le client choisit son provider dans `Paramètres → Intégrations`.
La valeur est stockée dans `tenants/{id}/settings.connectors.<category>`.
La Factory lit ce champ et instancie le bon provider.

---

## Priorité 1 — Impact immédiat pour le client

---

### 🍽️ Réservations

**Ce que ça fait** : toute réservation externe arrive dans le plan de salle en temps réel, sans double saisie.

**Interface**
```typescript
// src/modules/ops/connectors/reservations/types.ts
export interface IReservationProvider {
  listUpcoming(tenantId: string): Promise<Reservation[]>
  onCreate(webhook: unknown): Reservation
  confirmReservation(id: string): Promise<void>
  cancelReservation(id: string, reason?: string): Promise<void>
  syncAll(tenantId: string): Promise<number>          // retourne nb synced
}
```

**Providers à construire**

| Provider | Effort | Notes |
|----------|--------|-------|
| **Zenchef** 🇫🇷 | 3j | API REST publique, webhook dispo |
| **TheFork (LaFourchette)** | 3j | API partenaire, demande accréditation |
| **Google Reserve** | 2j | Google My Business API |
| **OpenTable** | 3j | API partenaire |
| **Resy** | 3j | API partenaire |
| **Widget site propre** | 2j + tuto | Route `/[slug]/reservations` déjà existante ✅ |

**Tuto "site propre"** : snippet HTML à coller sur n'importe quel site (WordPress, Wix, Squarespace). Le widget pointe vers `/{slug}/reservations`. Tuto en vidéo + écrit dans l'interface.

**Ce qui change dans l'app**
- `ReservationProviderFactory.get(tenantId)` → appelé par la route de sync
- Cron toutes les 5 min : `POST /api/connectors/reservations/sync`
- Webhook entrant : `POST /api/connectors/reservations/webhook/{provider}`
- Plan de salle mis à jour via `Nexus.adapter.set('tables/...')`

---

### 🛵 Commandes en ligne (livraison)

**Ce que ça fait** : commandes Uber Eats / Deliveroo arrivent directement dans le KDS, le stock se déduit, la caisse enregistre.

**Interface**
```typescript
// src/modules/ops/connectors/delivery/types.ts
export interface IDeliveryProvider {
  listPendingOrders(tenantId: string): Promise<DeliveryOrder[]>
  acknowledgeOrder(orderId: string): Promise<void>
  updateStatus(orderId: string, status: DeliveryStatus): Promise<void>
  onWebhook(payload: unknown): DeliveryOrder
  getMenu(tenantId: string): Promise<DeliveryMenuItem[]>
  pushMenu(tenantId: string, menu: DeliveryMenuItem[]): Promise<void>
}
```

**Providers à construire**

| Provider | Effort | Notes |
|----------|--------|-------|
| **Uber Eats** | 4j | API Restaurant Manager, accès sur demande |
| **Deliveroo** | 4j | API partenaire |
| **Just Eat** | 4j | API partenaire |
| **Lyveat** 🇫🇷 | 3j | API REST |
| **PopChef** 🇫🇷 | 3j | API REST |
| **Click & Collect propre** | 3j + tuto | Page `/[slug]/order` à créer, tuto intégration site |

**Flow dans l'app**
1. Webhook provider → `POST /api/connectors/delivery/webhook/{provider}`
2. Commande transformée → `Nexus.adapter.set('orders/{id}', order)`
3. KDS reçoit la commande via `onSnapshot`
4. Stock déduit via `useStockDeduction`
5. Ticket Z intégré en fin de service

---

### ⭐ Avis & Réputation

**Ce que ça fait** : chaque nouvel avis déclenche une alerte. Le gérant répond depuis l'interface. Score moyen visible sur le tableau de bord.

**Interface**
```typescript
// src/modules/commerce/connectors/reviews/types.ts
export interface IReviewProvider {
  fetchRecent(tenantId: string, since: Date): Promise<Review[]>
  postReply(reviewId: string, text: string): Promise<void>
  getAverageScore(tenantId: string): Promise<number>
}
```

**Providers à construire**

| Provider | Effort | Notes |
|----------|--------|-------|
| **Google Business Profile** | 3j | Google My Business API v4 |
| **TripAdvisor** | 2j | API Management Reviews |
| **TheFork** | 2j | Même API que réservations |
| **Yelp** | 2j | Yelp Fusion API |
| **Trustpilot** | 2j | Business API |
| **Facebook / Instagram** | 3j | Graph API, OAuth |

---

## Priorité 2 — Finance & Trésorerie

---

### 🏦 Open Banking (déjà construit ✅)

**Providers existants** : Powens 🇫🇷, Tink, GoCardless

**Providers à ajouter**

| Provider | Effort | Notes |
|----------|--------|-------|
| **Bridge by Bankin'** 🇫🇷 | 2j | API similaire à Powens |
| **Qonto (direct)** 🇫🇷 | 1j | API Qonto publique, très bien documentée |
| **Shine (direct)** 🇫🇷 | 1j | API Shine |
| **Sumeria** 🇫🇷 | 2j | API partenaire |

---

### 📨 Factures entrantes (Gmail / Outlook / IMAP)

**Ce que ça fait** : chaque email avec PDF fournisseur → extraction Gemini Vision → dépense créée → trésorerie mise à jour.

**Interface**
```typescript
// src/modules/finance/connectors/invoices/types.ts
export interface IEmailInvoiceProvider {
  connect(tenantId: string, oauthCode: string): Promise<void>
  fetchUnprocessed(tenantId: string): Promise<EmailWithAttachments[]>
  markProcessed(messageId: string): Promise<void>
}
```

**Providers à construire**

| Provider | Effort | Notes |
|----------|--------|-------|
| **Gmail** | 3j | OAuth 2.0 Google, lecture inbox |
| **Outlook** | 3j | OAuth Microsoft, Microsoft Graph API |
| **IMAP générique** | 2j | Nodemailer IMAP — couvre OVH, Infomaniak, etc. |
| **Chorus Pro** 🇫🇷 | 4j | API PISTE, facturation B2B publique |

**Pipeline commun (provider-agnostique)**
```
Email reçu → pièce jointe PDF/image
  → Gemini Vision (prompt invoice-extraction déjà fait ✅)
  → Données structurées (montant, fournisseur, TVA, articles)
  → Nexus.adapter.set('expenses/{id}', data)
  → Trésorerie mise à jour
```

---

### 💳 Paiement en ligne

**Interface**
```typescript
// src/modules/finance/connectors/payments/types.ts
export interface IPaymentProvider {
  createCheckout(order: Order, returnUrl: string): Promise<string>
  onWebhook(payload: unknown): PaymentEvent
  getTransactions(tenantId: string, since: Date): Promise<Transaction[]>
  refund(transactionId: string, amount: number): Promise<void>
}
```

**Providers à construire**

| Provider | Effort | Notes |
|----------|--------|-------|
| **Stripe** | ✅ déjà fait (abonnement MCC) | À étendre pour paiements clients |
| **PayPal** | 2j | SDK PayPal REST |
| **Lydia Pro** 🇫🇷 | 2j | API Lydia |
| **SumUp** | 2j | SumUp API |
| **Mollie** | 2j | API REST Mollie |

---

### 📊 Comptabilité externe

**Ce que ça fait** : sync bidirectionnelle — l'expert-comptable voit tout dans son logiciel, le client voit tout dans Restaurant OS.

**Interface**
```typescript
// src/modules/finance/connectors/accounting/types.ts
export interface IAccountingProvider {
  pushEntry(entry: JournalEntry): Promise<string>
  pushExpense(expense: Expense): Promise<string>
  pullBalance(tenantId: string): Promise<AccountingBalance>
  syncPeriod(tenantId: string, from: Date, to: Date): Promise<SyncResult>
}
```

**Providers à construire**

| Provider | Effort | Notes |
|----------|--------|-------|
| **Pennylane** 🇫🇷 | 3j | API REST publique, très bien documentée |
| **Indy** 🇫🇷 | 2j | API partenaire |
| **Sage** 🇫🇷 | 4j | API Sage One |
| **QuickBooks** | 3j | Intuit API |
| **Export FEC** | ✅ déjà fait | |

---

### 🏛️ Fiscalité & Organismes (France)

**Ce que ça fait** : échéances fiscales et sociales dans le calendrier de trésorerie — aucune surprise.

| Organisme | Ce qui remonte | Effort |
|-----------|---------------|--------|
| **DGFiP** 🇫🇷 | Échéances TVA, avis d'imposition | 3j (API PISTE) |
| **Urssaf** 🇫🇷 | Cotisations dues, calendrier | 3j (DSN API) |
| **AGIRC-ARRCO** 🇫🇷 | Cotisations retraite | 2j |
| **Chorus Pro** 🇫🇷 | Factures B2B reçues/émises | 4j (mutualisé avec invoices) |

---

## Priorité 3 — Ressources Humaines

---

### 💰 Logiciel de paie

**Interface**
```typescript
// src/modules/human/connectors/payroll/types.ts
export interface IPayrollProvider {
  pushTimesheet(employeeId: string, hours: TimesheetEntry[]): Promise<void>
  fetchPayslips(tenantId: string, month: string): Promise<Payslip[]>
  fetchPayrollCost(tenantId: string, month: string): Promise<PayrollCost>
}
```

| Provider | Effort | Notes |
|----------|--------|-------|
| **SILAE** 🇫🇷 | ✅ déjà fait | |
| **PayFit** 🇫🇷 | 3j | API REST partenaire |
| **Sage Paie** 🇫🇷 | 4j | API Sage |
| **ADP** | 4j | API iHCM |

---

### 👔 Recrutement

**Interface**
```typescript
// src/modules/human/connectors/recruitment/types.ts
export interface IRecruitmentProvider {
  postJob(job: JobOffer): Promise<string>
  fetchApplications(jobId: string): Promise<Application[]>
  updateApplicationStatus(appId: string, status: ApplicationStatus): Promise<void>
}
```

| Provider | Effort | Notes |
|----------|--------|-------|
| **Indeed** | 3j | Indeed Publisher API |
| **LinkedIn** | 4j | LinkedIn Jobs API |
| **Welcome to the Jungle** 🇫🇷 | 2j | API partenaire |
| **France Travail** 🇫🇷 | 3j | API Emploi Store |
| **Formulaire propre** | 1j + tuto | Page `/[slug]/jobs` à créer |

**Tuto "formulaire propre"** : page de candidature embeddable sur le site du client. Snippet HTML, connexion automatique au pipeline RH.

---

### ⏱️ Pointage & Présence

**Interface**
```typescript
// src/modules/human/connectors/timeclock/types.ts
export interface ITimeclockProvider {
  fetchEntries(tenantId: string, date: Date): Promise<ClockEntry[]>
  onWebhook(payload: unknown): ClockEntry
}
```

| Provider | Effort | Notes |
|----------|--------|-------|
| **Saisie manuelle** | ✅ déjà fait | |
| **NFC / Badge** | 3j | Webhook depuis lecteur NFC réseau |
| **QR Code** | 2j | QR généré dans l'app, scan = pointage |
| **Kelio** 🇫🇷 | 3j | API partenaire |
| **Skello** 🇫🇷 | 3j | API Skello |
| **App mobile propre** | 5j | PWA avec géolocalisation optionnelle |

---

## Priorité 4 — Logistique & HACCP

---

### 🚚 Commandes fournisseurs

**Interface**
```typescript
// src/modules/logistics/connectors/suppliers/types.ts
export interface ISupplierProvider {
  fetchCatalog(tenantId: string): Promise<SupplierProduct[]>
  placeOrder(items: OrderItem[]): Promise<string>
  fetchDeliveryNotes(since: Date): Promise<DeliveryNote[]>
  onWebhook(payload: unknown): DeliveryNote
}
```

| Provider | Effort | Notes |
|----------|--------|-------|
| **Transgourmet** 🇫🇷 | 4j | EDI ou portail API |
| **Metro** 🇫🇷 | 4j | API Metro Pro |
| **Brake France** 🇫🇷 | 3j | EDI ORDERS/ORDRSP |
| **Promocash** 🇫🇷 | 3j | API partenaire |
| **EDI standard** | 5j | EDIFACT générique — couvre la majorité des grossistes |
| **Email PDF auto** | 2j | Mutualisé avec pipeline factures entrantes |

---

### 🌡️ Capteurs IoT (HACCP)

**Ce que ça fait** : relevés de température automatiques toutes les N minutes → plus de saisie manuelle → alertes instantanées si hors norme → non-conformité créée automatiquement.

**Interface**
```typescript
// src/modules/compliance/connectors/iot/types.ts
export interface IIoTProvider {
  subscribe(tenantId: string, onReading: (r: SensorReading) => void): () => void
  fetchHistory(sensorId: string, from: Date, to: Date): Promise<SensorReading[]>
  listSensors(tenantId: string): Promise<Sensor[]>
}
```

| Provider | Protocole | Effort | Notes |
|----------|-----------|--------|-------|
| **Lacroix Sensing** 🇫🇷 | HTTPS webhook | 3j | Leader FR capteurs frigo |
| **Sigfox** 🇫🇷 | Sigfox callback | 3j | Réseau LPWAN français |
| **Monnit** | HTTPS webhook | 2j | Large gamme |
| **Dragino** | MQTT | 3j | LoRaWAN, bon marché |
| **MQTT générique** | MQTT | 3j | Couvre tous les capteurs compatibles |

**Flow commun**
```
Capteur → webhook/MQTT → POST /api/connectors/iot/{provider}
  → SensorReading créé dans Nexus (iotHistory immuable ✅)
  → Si hors norme → HACCPLogService.recordNonConformity() ✅
  → Notification push au responsable ✅
```

---

### 🔬 Laboratoires d'analyse

**Ce que ça fait** : rapport PDF d'analyse microbiologique → extrait par IA → versé au registre HACCP automatiquement.

| Provider | Effort | Notes |
|----------|--------|-------|
| **Eurofins** 🇫🇷 | 2j | Email PDF → pipeline extraction IA |
| **SGS France** 🇫🇷 | 2j | Idem |
| **Wessling** 🇫🇷 | 2j | Idem |
| **Générique (email PDF)** | 1j | Mutualisé avec pipeline factures entrantes |

---

## Priorité 5 — Marketing & Intelligence

---

### 📧 Email Marketing

**Interface**
```typescript
// src/modules/commerce/connectors/emailing/types.ts
export interface IEmailMarketingProvider {
  sendCampaign(campaign: Campaign): Promise<string>
  fetchStats(campaignId: string): Promise<CampaignStats>
  syncContacts(contacts: Contact[]): Promise<void>
  createAutomation(trigger: AutomationTrigger): Promise<string>
}
```

| Provider | Effort | Notes |
|----------|--------|-------|
| **Campagnes natives** | ✅ déjà fait | |
| **Brevo (Sendinblue)** 🇫🇷 | 2j | API REST v3, excellente doc |
| **Mailchimp** | 2j | API Mailchimp v3 |
| **Klaviyo** | 3j | API REST |

---

### 🌤️ Météo & Événements locaux

**Ce que ça fait** : prévision J+7 → anticipation du nombre de couverts → suggestion automatique des commandes fournisseurs.

**Interface**
```typescript
// src/modules/intelligence/connectors/weather/types.ts
export interface IWeatherProvider {
  getForecast(lat: number, lng: number, days: number): Promise<WeatherForecast[]>
}

export interface IEventsProvider {
  getLocalEvents(lat: number, lng: number, radius: number, days: number): Promise<LocalEvent[]>
}
```

| Provider | Effort | Notes |
|----------|--------|-------|
| **Météo France** 🇫🇷 | 1j | API publique gratuite |
| **OpenWeatherMap** | 1j | Gratuit jusqu'à 1000 appels/jour |
| **Ticketmaster** | 2j | API événements |
| **Eventbrite** | 2j | API événements |
| **Infoconcerts** 🇫🇷 | 2j | Événements culturels FR |

---

### 📱 Réseaux sociaux

| Provider | Ce qui remonte | Effort |
|----------|---------------|--------|
| **Instagram (Meta)** | Stats posts, nombre d'abonnés, nouveaux commentaires | 3j |
| **Facebook Pages** | Avis, posts, events | 3j |
| **TikTok Business** | Vues, abonnés, performance | 3j |
| **Google Ads** | CPC, impressions, conversions | 2j |
| **WhatsApp Business** | Messages clients → CRM unifié | 4j |

---

### 🌐 SEO & Présence web

| Provider | Ce qui remonte | Effort |
|----------|---------------|--------|
| **Google Search Console** | Impressions, clics, position moyenne | 2j |
| **Google Analytics 4** | Sessions, conversions, pages vues | 2j |
| **Plausible** 🇫🇷 | Analytics RGPD natif | 1j |
| **Site propre** | Tuto création page restaurant + widget réservation | 2j + tuto |

---

## Priorité 6 — Infrastructure

---

### 🔔 Notifications

| Provider | Effort | Notes |
|----------|--------|-------|
| **WebPush natif** | ✅ déjà fait | |
| **SMS via OVH SMS** 🇫🇷 | 1j | API OVH SMS, très fiable |
| **SMS via Twilio** | 1j | SDK Twilio |
| **Slack** | 1j | Webhook entrant Slack |
| **WhatsApp** | 2j | WhatsApp Business API |

---

### 🖨️ Impression & Matériel

| Provider | Effort | Notes |
|----------|--------|-------|
| **Epson ESC/POS** | ✅ déjà fait | |
| **Star Micronics** | ✅ déjà fait | |
| **Brother** | 1j | SDK Brother |
| **Zebra** | 1j | SDK ZPL |

---

## Récapitulatif effort total

| Priorité | Catégorie | Effort estimé |
|----------|-----------|---------------|
| 🔴 1 | Réservations (1 provider) | 2-3 jours |
| 🔴 1 | Commandes en ligne (1 provider) | 3-4 jours |
| 🔴 1 | Avis Google Business | 3 jours |
| 🟠 2 | Factures Gmail | 3 jours |
| 🟠 2 | Qonto direct | 1 jour |
| 🟠 2 | Pennylane | 3 jours |
| 🟡 3 | Capteurs IoT MQTT | 3 jours |
| 🟡 3 | Météo France | 1 jour |
| 🟢 4 | Autres (au fil des demandes clients) | variable |

**Règle** : on construit un connecteur quand un client en a besoin, pas avant.
L'architecture est prête — le code métier ne change jamais.
