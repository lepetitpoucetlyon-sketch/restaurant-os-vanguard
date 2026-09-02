import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DPA — Accord de traitement des données | Restaurant OS',
  description: 'Accord de traitement des données personnelles (DPA) de Restaurant OS conforme au RGPD.',
};

export default function DpaPage() {
  return (
    <section className="pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-invert prose-amber max-w-none">
        <h1>Accord de Traitement des Données (DPA)</h1>
        <p className="lead">Dernière mise à jour : Août 2026</p>

        <h2>1. Objet</h2>
        <p>
          Le présent Accord de Traitement des Données (« DPA ») fait partie intégrante des Conditions
          Générales de Vente de Restaurant OS SAS (le « Sous-traitant ») et s'applique dans la mesure
          où le Sous-traitant traite des Données Personnelles pour le compte du Client
          (le « Responsable de Traitement ») dans le cadre de la fourniture du Service.
        </p>

        <h2>2. Définitions</h2>
        <p>
          Les termes « Données Personnelles », « Traitement », « Responsable de Traitement »,
          « Sous-traitant », « Personne Concernée » ont le sens qui leur est donné par le
          Règlement (UE) 2016/679 (RGPD).
        </p>

        <h2>3. Obligations du Sous-traitant</h2>
        <ul>
          <li>Traiter les Données Personnelles uniquement sur instruction documentée du Responsable.</li>
          <li>Garantir que les personnes autorisées à traiter les données sont soumises à une obligation de confidentialité.</li>
          <li>Mettre en œuvre les mesures techniques et organisationnelles appropriées (chiffrement AES-256, isolation par tenant, contrôle d&apos;accès RBAC).</li>
          <li>Ne pas faire appel à un autre sous-traitant sans l&apos;autorisation écrite préalable du Responsable.</li>
          <li>Assister le Responsable dans le respect des droits des Personnes Concernées (accès, rectification, effacement, portabilité).</li>
          <li>Supprimer ou restituer les Données Personnelles à l&apos;issue du Service, selon le choix du Responsable.</li>
          <li>Mettre à disposition du Responsable toutes les informations nécessaires pour démontrer le respect des obligations RGPD.</li>
        </ul>

        <h2>4. Sous-traitants ultérieurs</h2>
        <div className="w-full overflow-x-auto custom-scrollbar my-4">
          <table className="w-full min-w-[550px]">
            <thead>
              <tr><th>Sous-traitant</th><th>Finalité</th><th>Localisation</th></tr>
            </thead>
            <tbody>
              <tr><td>Google Cloud (Firebase)</td><td>Hébergement base de données et authentification</td><td>europe-west1 (Belgique)</td></tr>
              <tr><td>Vercel</td><td>Hébergement application web</td><td>cdg1 (Paris)</td></tr>
              <tr><td>Stripe</td><td>Traitement des paiements</td><td>UE</td></tr>
              <tr><td>Sentry</td><td>Monitoring erreurs (données anonymisées)</td><td>UE</td></tr>
            </tbody>
          </table>
        </div>

        <h2>5. Transferts internationaux</h2>
        <p>
          Aucun transfert de Données Personnelles hors de l&apos;Espace Économique Européen n&apos;est effectué.
          Tous les serveurs sont situés dans l&apos;UE.
        </p>

        <h2>6. Notification de violation</h2>
        <p>
          En cas de violation de données, le Sous-traitant en informera le Responsable dans un délai
          de 48 heures maximum après en avoir pris connaissance, en fournissant toutes les informations
          nécessaires (nature de la violation, catégories de données, mesures correctives).
        </p>

        <h2>7. Durée et résiliation</h2>
        <p>
          Ce DPA prend effet à la date de souscription au Service et reste en vigueur tant que le
          Sous-traitant traite des Données Personnelles pour le Responsable.
        </p>

        <h2>8. Contact</h2>
        <p>
          Pour toute question relative à ce DPA :<br />
          <strong>DPO Restaurant OS</strong><br />
          Email : dpo@restaurant-os.fr
        </p>
      </div>
    </section>
  );
}
