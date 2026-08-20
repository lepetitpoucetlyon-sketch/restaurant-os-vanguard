import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sécurité — Restaurant OS Trust Center',
  description: 'Comment Restaurant OS protège vos données : chiffrement, isolation, sauvegardes, conformité RGPD et NF525.',
};

export default function SecurityPage() {
  return (
    <section className="pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-invert prose-amber max-w-none">
        <h1>🔐 Sécurité &amp; Confiance</h1>
        <p className="lead">
          La sécurité de vos données est notre priorité absolue.
          Voici comment nous protégeons votre établissement.
        </p>

        <h2>Chiffrement</h2>
        <ul>
          <li><strong>En transit</strong> : TLS 1.3 sur toutes les connexions (HTTPS obligatoire)</li>
          <li><strong>Au repos</strong> : AES-256 pour toutes les données stockées (Firebase / Cloud Storage)</li>
          <li><strong>Sceaux fiscaux</strong> : SHA-256 avec chaîne HMAC pour le scellement NF525</li>
        </ul>

        <h2>Isolation des données</h2>
        <p>
          Chaque client (tenant) dispose d&apos;un <strong>namespace Firestore isolé</strong>.
          Les règles de sécurité Firebase vérifient le <code>tenantId</code> dans les claims
          JWT à chaque opération. Aucun accès inter-tenant n&apos;est possible.
        </p>

        <h2>Authentification</h2>
        <ul>
          <li>Firebase Authentication avec JWT signé</li>
          <li>MFA (authentification multi-facteurs) pour les administrateurs</li>
          <li>Rotation automatique des tokens (1h)</li>
          <li>Verrouillage après 5 tentatives échouées</li>
        </ul>

        <h2>Sauvegardes</h2>
        <ul>
          <li><strong>Automatiques quotidiennes</strong> : chaque tenant sauvegardé à minuit</li>
          <li><strong>Rétention</strong> : 90 jours de sauvegardes glissantes</li>
          <li><strong>Archivage fiscal</strong> : 10 ans (obligation légale)</li>
          <li><strong>Restauration</strong> : possible en moins de 30 minutes via le MCC</li>
        </ul>

        <h2>Infrastructure</h2>
        <table>
          <thead>
            <tr><th>Service</th><th>Fournisseur</th><th>Localisation</th></tr>
          </thead>
          <tbody>
            <tr><td>Base de données</td><td>Firebase (Google Cloud)</td><td>europe-west1 (Belgique)</td></tr>
            <tr><td>Application web</td><td>Vercel</td><td>cdg1 (Paris)</td></tr>
            <tr><td>Paiements</td><td>Stripe</td><td>UE</td></tr>
            <tr><td>Monitoring</td><td>Sentry</td><td>UE</td></tr>
            <tr><td>Sauvegardes</td><td>Cloud Storage</td><td>europe-west1</td></tr>
          </tbody>
        </table>

        <h2>Conformité</h2>
        <ul>
          <li>✅ <strong>NF525</strong> — Certification logiciel de caisse</li>
          <li>✅ <strong>RGPD</strong> — Traitement conforme, DPA disponible</li>
          <li>✅ <strong>HACCP</strong> — Module traçabilité alimentaire intégré</li>
          <li>🔜 <strong>ISO 27001</strong> — Certification en cours de planification</li>
        </ul>

        <h2>Tests de sécurité</h2>
        <ul>
          <li>Tests unitaires et d&apos;intégration automatisés (Vitest)</li>
          <li>Analyse de dépendances (Snyk / npm audit)</li>
          <li>Revue de code systématique avant merge</li>
          <li>Tests de pénétration annuels planifiés</li>
        </ul>

        <h2>Signaler une vulnérabilité</h2>
        <p>
          Si vous découvrez une faille de sécurité, contactez-nous de manière responsable :<br />
          <strong>security@restaurant-os.fr</strong><br />
          Nous nous engageons à répondre sous 48h et à corriger les vulnérabilités critiques sous 72h.
        </p>
      </div>
    </section>
  );
}
