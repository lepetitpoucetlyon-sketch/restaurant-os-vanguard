// NO 'use client' — Page serveur statique.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité (RGPD) | Restaurant OS',
  description: 'Politique de confidentialité et protection des données personnelles — plateforme Restaurant OS.',
};

export default function RGPDPage() {
  const lastUpdate = '17 juillet 2026';

  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Politique de confidentialité et protection des données personnelles
      </h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {lastUpdate}</p>

      <p className="text-gray-700 leading-relaxed mb-8">
        La présente politique décrit comment les données à caractère personnel sont collectées,
        traitées et protégées dans le cadre de l'utilisation de la plateforme SaaS Restaurant OS,
        conformément au Règlement (UE) 2016/679 du 27 avril 2016 relatif à la protection des
        données personnelles (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée (loi
        Informatique et Libertés).
      </p>

      {/* Responsable de traitement */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Responsable de traitement</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Dans le cadre de l'utilisation de la plateforme Restaurant OS, le <strong>responsable de
          traitement</strong> est <strong>le gestionnaire du restaurant</strong> — c'est-à-dire le
          professionnel ou la personne morale qui souscrit à la plateforme et exploite un établissement
          de restauration. C'est cette entité qui détermine les finalités et les moyens des traitements
          de données relatifs à ses clients, collaborateurs et opérations.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Distinction importante</p>
          <p>
            Restaurant OS SAS agit en qualité de <strong>sous-traitant</strong> (au sens de l'article 28
            du RGPD) : l'éditeur met à disposition les outils techniques et traite les données
            uniquement selon les instructions du responsable de traitement.
          </p>
        </div>
      </section>

      {/* Sous-traitant */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Sous-traitant — DPA</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          <strong>Restaurant OS SAS</strong> (siège social : [Adresse à compléter], 69001 Lyon) agit
          en qualité de sous-traitant des données traitées via la Plateforme.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          Un Accord de Traitement des Données (DPA — Data Processing Agreement), conforme à l'article 28
          du RGPD, est conclu avec chaque client professionnel lors de la souscription. Ce DPA précise :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>La nature et la finalité des traitements sous-traités ;</li>
          <li>Les catégories de données à caractère personnel concernées ;</li>
          <li>Les mesures de sécurité techniques et organisationnelles mises en place ;</li>
          <li>Les conditions d'intervention des sous-traitants ultérieurs (Vercel, Firebase/Google).</li>
        </ul>
      </section>

      {/* Données collectées */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Données collectées et finalités</h2>

        <div className="space-y-6">
          {/* Clients restaurant */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-900 text-white px-4 py-2 font-semibold text-sm">
              Clients du restaurant
            </div>
            <div className="p-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Données collectées</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>Nom, prénom</li>
                    <li>Adresse email</li>
                    <li>Numéro de téléphone</li>
                    <li>Historique des réservations</li>
                    <li>Préférences alimentaires (si renseignées)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Finalité</p>
                  <p className="text-gray-700">Gestion des réservations, suivi client, fidélisation, communication opérationnelle</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Base légale</p>
                  <p className="text-gray-700 font-medium text-green-700">Exécution du contrat</p>
                  <p className="text-gray-600 mt-1">Article 6(1)(b) RGPD</p>
                </div>
              </div>
            </div>
          </div>

          {/* Collaborateurs */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-900 text-white px-4 py-2 font-semibold text-sm">
              Collaborateurs (données RH)
            </div>
            <div className="p-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Données collectées</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>Nom, prénom</li>
                    <li>IBAN (pour la paie)</li>
                    <li>Numéro de sécurité sociale</li>
                    <li>Congés et absences</li>
                    <li>Planning hebdomadaire</li>
                    <li>Rémunération et bulletins de paie</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Finalité</p>
                  <p className="text-gray-700">Gestion de la paie, planification des équipes, suivi des absences, obligations déclaratives sociales</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Base légale</p>
                  <p className="text-gray-700 font-medium text-orange-700">Obligation légale</p>
                  <p className="text-gray-600 mt-1">Article 6(1)(c) RGPD — Code du travail</p>
                </div>
              </div>
            </div>
          </div>

          {/* Données fiscales */}
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <div className="bg-red-900 text-white px-4 py-2 font-semibold text-sm">
              Données fiscales NF525 (IMMUABLES)
            </div>
            <div className="p-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Données collectées</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>Tickets de caisse et lignes de vente</li>
                    <li>Journaux comptables (journalEntries)</li>
                    <li>Sceaux fiscaux chaînés (SHA-256)</li>
                    <li>Données client associées à une transaction</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Finalité</p>
                  <p className="text-gray-700">Conformité fiscale NF525, piste d'audit comptable, déclarations TVA, contrôle fiscal</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Base légale</p>
                  <p className="text-gray-700 font-medium text-red-700">Obligation légale</p>
                  <p className="text-gray-600 mt-1">Article 6(1)(c) RGPD — Code général des impôts, article L102 B du LPF — Conservation 10 ans</p>
                </div>
              </div>
              <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 text-xs font-semibold">
                  ATTENTION — Données fiscales immuables : conformément à la norme NF525 et au Code général
                  des impôts, les données fiscales (tickets, journaux, sceaux) sont techniquement et
                  juridiquement IMMUABLES. Aucune suppression ni modification n'est possible, y compris
                  en cas d'exercice du droit à l'effacement. Cette contrainte est imposée par la loi
                  (article L102 B du Livre des procédures fiscales).
                </p>
              </div>
            </div>
          </div>

          {/* Données analytiques */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-900 text-white px-4 py-2 font-semibold text-sm">
              Données analytiques et opérationnelles
            </div>
            <div className="p-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Données collectées</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>Statistiques de ventes</li>
                    <li>Données d'affluence</li>
                    <li>Performance des plats</li>
                    <li>Logs d'utilisation de la plateforme</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Finalité</p>
                  <p className="text-gray-700">Tableaux de bord de pilotage, intelligence artificielle prédictive, amélioration du service</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Base légale</p>
                  <p className="text-gray-700 font-medium text-purple-700">Intérêt légitime</p>
                  <p className="text-gray-600 mt-1">Article 6(1)(f) RGPD — Amélioration du service et du pilotage opérationnel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Durée de conservation */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Durée de conservation</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-4 py-3 text-left font-semibold">Catégorie de données</th>
                <th className="px-4 py-3 text-left font-semibold">Durée de conservation</th>
                <th className="px-4 py-3 text-left font-semibold">Fondement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-white">
                <td className="px-4 py-3 text-gray-700">Données clients du restaurant</td>
                <td className="px-4 py-3 text-gray-700">3 ans après la dernière visite ou interaction</td>
                <td className="px-4 py-3 text-gray-600">Prescription commerciale</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Données RH des collaborateurs</td>
                <td className="px-4 py-3 text-gray-700">5 ans après la fin du contrat de travail</td>
                <td className="px-4 py-3 text-gray-600">Code du travail, prescription sociale</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-gray-700 font-medium">Données fiscales NF525</td>
                <td className="px-4 py-3 text-red-700 font-semibold">10 ans — IMMUABLES</td>
                <td className="px-4 py-3 text-gray-600">Article L102 B LPF, CGI</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Données analytiques</td>
                <td className="px-4 py-3 text-gray-700">25 mois glissants (sous forme agrégée)</td>
                <td className="px-4 py-3 text-gray-600">Intérêt légitime</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-gray-700">Compte utilisateur plateforme</td>
                <td className="px-4 py-3 text-gray-700">Durée de l'abonnement + 30 jours</td>
                <td className="px-4 py-3 text-gray-600">Portabilité et export des données</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Droits des personnes */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Droits des personnes concernées</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Conformément au RGPD (articles 15 à 22), les personnes dont les données sont traitées
          bénéficient des droits suivants :
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
          {[
            { right: 'Droit d\'accès', desc: 'Obtenir confirmation du traitement et une copie des données vous concernant (art. 15).' },
            { right: 'Droit de rectification', desc: 'Faire corriger des données inexactes ou incomplètes (art. 16).' },
            { right: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format structuré et lisible par machine (art. 20).' },
            { right: 'Droit à l\'effacement', desc: 'Demander la suppression de vos données, sous réserve des obligations légales (art. 17).' },
            { right: 'Droit d\'opposition', desc: 'Vous opposer au traitement fondé sur l\'intérêt légitime (art. 21).' },
            { right: 'Droit à la limitation', desc: 'Demander la suspension temporaire d\'un traitement en cas de contestation (art. 18).' },
          ].map(({ right, desc }) => (
            <div key={right} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-1">{right}</p>
              <p className="text-gray-700">{desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-amber-900 mb-1">Limitation légale — Données fiscales</p>
          <p className="text-amber-800">
            Le droit à l'effacement (article 17 RGPD) <strong>ne s'applique pas</strong> aux données
            fiscales intégrées dans la chaîne NF525 (tickets, journaux comptables, sceaux fiscaux).
            Ces données sont légalement immuables en vertu de l'article L102 B du Livre des procédures
            fiscales (LPF). Toute demande d'effacement portant sur ces données sera refusée et motivée
            par référence à cette obligation légale.
          </p>
        </div>
        <p className="text-gray-700 text-sm mt-4">
          Pour exercer vos droits, contactez notre Délégué à la Protection des Données (DPO) à
          l'adresse :{' '}
          <a href="mailto:dpo@restaurant-os.app" className="text-blue-600 hover:underline">
            dpo@restaurant-os.app
          </a>
          . Nous nous engageons à répondre dans un délai d'un (1) mois à compter de la réception de
          votre demande.
        </p>
      </section>

      {/* Transferts hors UE */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Transferts de données hors Union Européenne</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          La plateforme Restaurant OS utilise des services tiers dont les serveurs peuvent être situés
          hors de l'Union Européenne, notamment :
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-4 py-3 text-left font-semibold">Prestataire</th>
                <th className="px-4 py-3 text-left font-semibold">Pays</th>
                <th className="px-4 py-3 text-left font-semibold">Garantie</th>
                <th className="px-4 py-3 text-left font-semibold">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-white">
                <td className="px-4 py-3 text-gray-700 font-medium">Vercel Inc.</td>
                <td className="px-4 py-3 text-gray-700">USA (+ EU edge)</td>
                <td className="px-4 py-3 text-gray-700">Clauses Contractuelles Types (CCT) — Décision 2021/914/UE</td>
                <td className="px-4 py-3 text-gray-700">Hébergement, CDN, déploiement</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700 font-medium">Google Firebase</td>
                <td className="px-4 py-3 text-gray-700">USA (+ EU)</td>
                <td className="px-4 py-3 text-gray-700">Clauses Contractuelles Types (CCT)</td>
                <td className="px-4 py-3 text-gray-700">Base de données Firestore, authentification</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-gray-700 font-medium">Stripe</td>
                <td className="px-4 py-3 text-gray-700">USA (+ IE)</td>
                <td className="px-4 py-3 text-gray-700">PCI-DSS + CCT</td>
                <td className="px-4 py-3 text-gray-700">Paiement par carte bancaire</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-700 text-sm">
          Ces transferts sont encadrés par les Clauses Contractuelles Types (CCT) approuvées par la
          Commission Européenne conformément à l'article 46(2)(c) du RGPD, garantissant un niveau de
          protection équivalent à celui exigé au sein de l'Union Européenne.
        </p>
      </section>

      {/* Cookies */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies et traceurs</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          La plateforme Restaurant OS n'utilise que des <strong>cookies strictement nécessaires</strong>
          à son fonctionnement (session d'authentification, préférences d'interface). Aucun cookie
          publicitaire ni de suivi comportemental tiers n'est déposé sans votre consentement explicite.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-4 py-3 text-left font-semibold">Cookie</th>
                <th className="px-4 py-3 text-left font-semibold">Finalité</th>
                <th className="px-4 py-3 text-left font-semibold">Durée</th>
                <th className="px-4 py-3 text-left font-semibold">Consentement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-white">
                <td className="px-4 py-3 text-gray-700 font-mono text-xs">auth-session</td>
                <td className="px-4 py-3 text-gray-700">Maintien de la session authentifiée</td>
                <td className="px-4 py-3 text-gray-700">Session (fermeture navigateur)</td>
                <td className="px-4 py-3 text-green-700 font-medium">Non requis — essentiel</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700 font-mono text-xs">cookie-consent</td>
                <td className="px-4 py-3 text-gray-700">Mémorisation du choix de cookies</td>
                <td className="px-4 py-3 text-gray-700">13 mois</td>
                <td className="px-4 py-3 text-green-700 font-medium">Non requis — essentiel</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Sécurité */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Sécurité des données</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Restaurant OS SAS met en œuvre les mesures techniques et organisationnelles appropriées pour
          garantir la sécurité des données traitées :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Chiffrement des données en transit (TLS 1.3) et au repos (AES-256) ;</li>
          <li>Chaîne de scellement SHA-256 pour les données fiscales NF525 (intégrité garantie) ;</li>
          <li>Authentification multi-facteurs disponible pour les accès administrateurs ;</li>
          <li>Isolement multi-tenant strict — aucune donnée d'un établissement n'est accessible
              par un autre (SovereignGuard) ;</li>
          <li>Journalisation des accès et des modifications sensibles ;</li>
          <li>Sauvegardes quotidiennes avec rétention de 30 jours.</li>
        </ul>
      </section>

      {/* DPO et réclamations */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Délégué à la Protection des Données (DPO)</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Restaurant OS SAS a désigné un Délégué à la Protection des Données (DPO) joignable à
          l'adresse suivante :
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
          <p className="text-gray-700">
            <strong>DPO — Restaurant OS SAS</strong><br />
            Email :{' '}
            <a href="mailto:dpo@restaurant-os.app" className="text-blue-600 hover:underline">
              dpo@restaurant-os.app
            </a>
          </p>
        </div>
        <p className="text-gray-700 text-sm mt-4">
          Si vous estimez que vos droits ne sont pas respectés, vous avez le droit d'introduire une
          réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) :{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            www.cnil.fr
          </a>{' '}
          — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
        </p>
      </section>

      {/* Modification */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Modifications de la politique</h2>
        <p className="text-gray-700 leading-relaxed">
          La présente politique peut être mise à jour à tout moment pour refléter des évolutions
          légales, réglementaires ou techniques. Toute modification significative sera notifiée aux
          utilisateurs par email au moins trente (30) jours avant son entrée en vigueur.
        </p>
      </section>

      {/* Contact */}
      <section className="mt-10 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact RGPD</h2>
        <p className="text-gray-700 text-sm">
          Pour toute question relative à cette politique ou pour exercer vos droits :{' '}
          <a href="mailto:dpo@restaurant-os.app" className="text-blue-600 hover:underline">
            dpo@restaurant-os.app
          </a>
        </p>
      </section>
    </article>
  );
}
