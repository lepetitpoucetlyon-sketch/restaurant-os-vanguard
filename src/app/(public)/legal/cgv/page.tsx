// NO 'use client' — Page serveur statique.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente | Restaurant OS',
  description: 'Conditions générales de vente et tarification de la plateforme SaaS Restaurant OS.',
};

export default function CGVPage() {
  const lastUpdate = '17 juillet 2026';

  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Conditions Générales de Vente
      </h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {lastUpdate}</p>

      {/* Article 1 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 1 — Champ d'application</h2>
        <p className="text-gray-700 leading-relaxed">
          Les présentes Conditions Générales de Vente (ci-après « CGV ») s'appliquent à toutes les
          souscriptions d'abonnements à la plateforme SaaS « Restaurant OS » conclues entre Restaurant OS SAS
          (ci-après « l'Éditeur ») et tout professionnel (ci-après « le Client »). Elles complètent les
          Conditions Générales d'Utilisation (CGU). En cas de contradiction, les CGV prévalent sur les CGU
          pour les questions commerciales et financières.
        </p>
      </section>

      {/* Article 2 — Tarification */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 2 — Tarification</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          L'Éditeur propose les formules d'abonnement suivantes, exprimées en montants hors taxes (HT) :
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-4 py-3 text-left font-semibold">Formule</th>
                <th className="px-4 py-3 text-right font-semibold">Prix mensuel HT</th>
                <th className="px-4 py-3 text-right font-semibold">Prix annuel HT</th>
                <th className="px-4 py-3 text-left font-semibold">Périmètre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-900">STANDARD</td>
                <td className="px-4 py-3 text-right text-gray-700">79 € / mois</td>
                <td className="px-4 py-3 text-right text-gray-700">759 € / an</td>
                <td className="px-4 py-3 text-gray-600">POS, KDS, stocks, réservations</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">PREMIUM</td>
                <td className="px-4 py-3 text-right text-gray-700">149 € / mois</td>
                <td className="px-4 py-3 text-right text-gray-700">1 431 € / an</td>
                <td className="px-4 py-3 text-gray-600">STANDARD + Finance NF525, RH, IA analytics</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-900">ENTERPRISE</td>
                <td className="px-4 py-3 text-right text-gray-700">299 € / mois</td>
                <td className="px-4 py-3 text-right text-gray-700">2 870 € / an</td>
                <td className="px-4 py-3 text-gray-600">PREMIUM + multi-sites, API dédiée, SLA renforcé, onboarding personnalisé</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-gray-700 leading-relaxed text-sm">
          Tous les prix sont indiqués hors taxes (HT). La TVA applicable au taux en vigueur (20 %) sera
          ajoutée au moment de la facturation. Les tarifs sont susceptibles d'évoluer ; toute modification
          sera notifiée avec un préavis de trente (30) jours.
        </p>
      </section>

      {/* Article 3 — Abonnements */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 3 — Modalités d'abonnement</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Les abonnements sont disponibles selon deux périodicités :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-3">
          <li><strong>Mensuel :</strong> l'abonnement est souscrit mois par mois, sans engagement de durée
              minimale au-delà du mois en cours. Il est renouvelé automatiquement à la même date chaque mois.</li>
          <li><strong>Annuel :</strong> l'abonnement est souscrit pour une durée d'un (1) an. Le paiement
              est effectué en une seule fois à la souscription. Le Client bénéficie d'une
              <strong> réduction de 20 %</strong> par rapport au tarif mensuel appliqué sur douze mois.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          À l'échéance, l'abonnement annuel se renouvelle automatiquement pour la même durée et au tarif
          en vigueur, sauf résiliation notifiée au moins trente (30) jours avant la date de renouvellement.
        </p>
      </section>

      {/* Article 4 — Paiement */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 4 — Conditions de paiement</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Le paiement s'effectue exclusivement par <strong>carte bancaire</strong> via la plateforme de
          paiement sécurisée Stripe (Stripe Payments Europe, Ltd.). Les informations bancaires ne sont
          jamais stockées sur les serveurs de l'Éditeur ; elles sont traitées directement par Stripe dans
          le respect des normes PCI-DSS.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          Le prélèvement est effectué :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-3">
          <li>Pour l'abonnement mensuel : à la date de souscription initiale, puis à la même date chaque mois ;</li>
          <li>Pour l'abonnement annuel : à la date de souscription initiale, puis à la date anniversaire.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          En cas d'échec de paiement, l'Éditeur notifiera le Client par email. Sans régularisation dans
          les quinze (15) jours, l'accès à la Plateforme pourra être suspendu puis le contrat résilié
          conformément aux CGU.
        </p>
      </section>

      {/* Article 5 — Remboursements */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 5 — Politique de remboursement</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Conformément à l'article L.221-28 du Code de la consommation relatif aux contrats de service
          numérique exécutés immédiatement, <strong>aucun remboursement au prorata temporis n'est accordé</strong>
          en cas de résiliation en cours de période d'abonnement souscrite.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          Des remboursements peuvent toutefois être accordés dans les cas suivants :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-3">
          <li><strong>Erreur de facturation</strong> imputable à l'Éditeur (double prélèvement, montant incorrect) :
              remboursement intégral de la somme indûment perçue sous sept (7) jours ouvrés ;</li>
          <li><strong>Indisponibilité dépassant le SLA garanti</strong> : avoir sur la prochaine facture selon
              les pénalités définies à l'article 7.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          Toute demande de remboursement doit être formulée par écrit à l'adresse contact@restaurant-os.app
          dans un délai de trente (30) jours suivant la facturation litigieuse.
        </p>
      </section>

      {/* Article 6 — Essai gratuit */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 6 — Période d'essai</h2>
        <p className="text-gray-700 leading-relaxed">
          L'Éditeur peut proposer une période d'essai gratuite d'une durée de quatorze (14) jours sur les
          formules STANDARD et PREMIUM. À l'issue de la période d'essai, l'abonnement bascule
          automatiquement sur la formule choisie et le premier prélèvement est effectué. Le Client peut
          annuler son abonnement sans frais à tout moment pendant la période d'essai.
        </p>
      </section>

      {/* Article 7 — SLA */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 7 — Garanties de service (SLA)</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          L'Éditeur garantit la disponibilité mensuelle de la Plateforme selon les niveaux suivants,
          mesurés sur le mois calendaire complet :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-3">
          <li><strong>STANDARD :</strong> disponibilité garantie à 99,5 % (soit moins de 3h39 d'indisponibilité cumulée par mois) ;</li>
          <li><strong>PREMIUM :</strong> disponibilité garantie à 99,7 % (soit moins de 2h11 d'indisponibilité cumulée par mois) ;</li>
          <li><strong>ENTERPRISE :</strong> disponibilité garantie à 99,9 % (soit moins de 43 minutes d'indisponibilité cumulée par mois).</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mb-3">
          En cas de dépassement, le Client est éligible à un avoir mensuel calculé comme suit :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-3">
          <li>Entre 0,01 % et 0,5 % de dépassement : avoir de 10 % du montant mensuel HT ;</li>
          <li>Entre 0,5 % et 1 % de dépassement : avoir de 25 % du montant mensuel HT ;</li>
          <li>Au-delà de 1 % de dépassement : avoir de 50 % du montant mensuel HT.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed text-sm italic">
          Le SLA ne s'applique pas aux interruptions planifiées (maintenance), aux cas de force majeure
          ou aux interruptions imputables à l'infrastructure du Client.
        </p>
      </section>

      {/* Article 8 — Résiliation et exportation */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 8 — Résiliation et portabilité des données</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Le Client peut résilier son abonnement à tout moment depuis son espace de gestion ou par email
          adressé à contact@restaurant-os.app avec un préavis de trente (30) jours.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          À compter de la date effective de résiliation, le Client dispose d'une période de <strong>trente (30)
          jours</strong> pour exporter l'intégralité de ses données opérationnelles (menus, commandes, clients,
          plannings) aux formats CSV et JSON via les outils d'export intégrés à la Plateforme.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Les données fiscales (tickets NF525, journaux comptables, sceaux fiscaux) soumises à une obligation
          légale de conservation de dix (10) ans resteront accessibles en lecture seule pendant toute la
          durée légale applicable, sans frais supplémentaires.
        </p>
      </section>

      {/* Article 9 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 9 — Droit applicable</h2>
        <p className="text-gray-700 leading-relaxed">
          Les présentes CGV sont soumises au droit français. Tout litige relatif à leur interprétation
          ou exécution sera soumis, à défaut de résolution amiable, à la compétence exclusive du
          Tribunal de Commerce de Lyon.
        </p>
      </section>

      {/* Contact */}
      <section className="mt-10 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact facturation</h2>
        <p className="text-gray-700 text-sm">
          Pour toute question relative à votre facturation :{' '}
          <a href="mailto:contact@restaurant-os.app" className="text-blue-600 hover:underline">
            contact@restaurant-os.app
          </a>
        </p>
      </section>
    </article>
  );
}
