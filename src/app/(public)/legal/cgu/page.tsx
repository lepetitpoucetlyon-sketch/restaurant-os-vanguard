// NO 'use client' — Page serveur statique.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation | Restaurant OS",
  description: "Conditions générales d'utilisation de la plateforme SaaS Restaurant OS.",
};

export default function CGUPage() {
  const lastUpdate = '17 juillet 2026';

  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Conditions Générales d'Utilisation
      </h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {lastUpdate}</p>

      {/* Article 1 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 1 — Objet</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les
          conditions dans lesquelles Restaurant OS SAS (ci-après « l'Éditeur ») met à disposition des
          utilisateurs professionnels (ci-après « l'Utilisateur ») la plateforme SaaS « Restaurant OS »
          (ci-après « la Plateforme »), accessible depuis le domaine restaurant-os.app et ses sous-domaines.
        </p>
        <p className="text-gray-700 leading-relaxed">
          La Plateforme est un système d'exploitation intelligent destiné à la gestion opérationnelle,
          financière et analytique des établissements de restauration professionnelle. Elle intègre notamment
          des modules de point de vente (POS), de gestion de cuisine (KDS), de gestion des stocks, de
          comptabilité fiscale conforme NF525 et d'intelligence artificielle.
        </p>
      </section>

      {/* Article 2 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 2 — Conditions d'accès</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          L'accès à la Plateforme est réservé exclusivement aux professionnels agissant dans le cadre de
          leur activité commerciale. Toute utilisation à des fins personnelles ou non professionnelles est
          strictement exclue.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          Pour accéder à la Plateforme, l'Utilisateur doit :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-3">
          <li>Être une personne physique majeure agissant en qualité de professionnel ou de représentant
              légal d'une personne morale ;</li>
          <li>Avoir complété le processus d'inscription et accepté les présentes CGU ainsi que les Conditions
              Générales de Vente (CGV) ;</li>
          <li>Être à jour dans le paiement de ses abonnements.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          L'Utilisateur est seul responsable de la sécurité de ses identifiants de connexion et s'engage à
          ne pas les divulguer à des tiers non autorisés. En cas de compromission, il doit en informer
          immédiatement l'Éditeur à l'adresse contact@restaurant-os.app.
        </p>
      </section>

      {/* Article 3 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 3 — Obligations de l'Éditeur</h2>
        <p className="text-gray-700 leading-relaxed mb-3">L'Éditeur s'engage à :</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Fournir un accès à la Plateforme conforme aux spécifications décrites dans les CGV, sous
              réserve des dispositions relatives à la force majeure ;</li>
          <li>Assurer la disponibilité de la Plateforme selon le niveau de service souscrit (SLA défini
              dans les CGV) ;</li>
          <li>Mettre en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour
              protéger les données de l'Utilisateur ;</li>
          <li>Informer l'Utilisateur de toute maintenance programmée susceptible d'affecter l'accès à la
              Plateforme avec un préavis raisonnable ;</li>
          <li>Traiter les données personnelles conformément au Règlement Général sur la Protection des
              Données (RGPD) et à la politique de confidentialité disponible à l'adresse
              /legal/rgpd.</li>
        </ul>
      </section>

      {/* Article 4 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 4 — Obligations de l'Utilisateur</h2>
        <p className="text-gray-700 leading-relaxed mb-3">L'Utilisateur s'engage à :</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Utiliser la Plateforme dans le strict respect des lois et réglementations en vigueur,
              notamment les obligations fiscales issues du Code général des impôts et les exigences de
              la norme NF525 applicables aux logiciels de caisse ;</li>
          <li>Ne pas tenter de contourner les mécanismes de sécurité ou les contrôles d'accès de la
              Plateforme ;</li>
          <li>Ne pas reproduire, modifier, adapter, décompiler ou désassembler tout ou partie de la
              Plateforme ;</li>
          <li>Ne pas utiliser la Plateforme à des fins illicites, frauduleuses ou portant atteinte aux
              droits de tiers ;</li>
          <li>S'assurer de l'exactitude et de la légalité des données saisies dans la Plateforme,
              notamment les données fiscales, les prix et les informations relatives aux tiers ;</li>
          <li>Maintenir à jour ses informations de contact et de facturation.</li>
        </ul>
      </section>

      {/* Article 5 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 5 — Propriété intellectuelle</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          La Plateforme, son code source, ses algorithmes, son architecture, ses interfaces graphiques,
          ses marques, logos et tout élément qui la compose demeurent la propriété exclusive de l'Éditeur
          ou de ses concédants de licence.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          L'Utilisateur bénéficie d'un droit d'accès et d'utilisation personnel, non exclusif, non
          cessible et non sous-licenciable à la Plateforme, pour la durée de son abonnement et aux fins
          de ses activités professionnelles.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Les données saisies par l'Utilisateur dans la Plateforme restent sa propriété. L'Éditeur dispose
          uniquement d'un droit d'utilisation limité à la fourniture des services, à l'amélioration de la
          Plateforme (sous forme anonymisée et agrégée) et au respect de ses obligations légales.
        </p>
      </section>

      {/* Article 6 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 6 — Données personnelles</h2>
        <p className="text-gray-700 leading-relaxed">
          La collecte et le traitement des données personnelles effectués dans le cadre de l'utilisation
          de la Plateforme sont régis par la politique de confidentialité de l'Éditeur, disponible à
          l'adresse /legal/rgpd. L'Utilisateur est invité à en prendre connaissance attentivement.
          En qualité de responsable de traitement pour les données de ses propres clients et collaborateurs,
          l'Utilisateur s'engage à se conformer au RGPD et à informer les personnes concernées des
          traitements effectués via la Plateforme.
        </p>
      </section>

      {/* Article 7 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 7 — Responsabilité limitée</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          La Plateforme est fournie à titre d'outil professionnel. L'Éditeur met tout en œuvre pour
          assurer son bon fonctionnement mais ne saurait garantir une disponibilité absolue ni l'absence
          d'erreurs.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          <strong>L'Éditeur n'est en aucun cas responsable</strong> des préjudices résultant :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-3">
          <li>Des données fiscales incorrectes, incomplètes ou frauduleuses saisies par l'Utilisateur
              ou ses préposés dans la Plateforme. L'Utilisateur assume seul la responsabilité de
              l'exactitude des informations fiscales et comptables qu'il enregistre ;</li>
          <li>D'une mauvaise utilisation de la Plateforme non conforme aux présentes CGU ;</li>
          <li>D'une interruption de service due à un tiers (fournisseur d'accès, hébergeur, force
              majeure) ;</li>
          <li>De la perte de données causée par une action de l'Utilisateur (suppression volontaire,
              mauvaise configuration) ;</li>
          <li>Des décisions de gestion prises par l'Utilisateur sur la base des analyses et recommandations
              fournies par la Plateforme, qui ont un caractère indicatif.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          En toute hypothèse, la responsabilité de l'Éditeur est plafonnée au montant des abonnements
          effectivement payés par l'Utilisateur au cours des douze (12) mois précédant l'événement
          générateur du préjudice.
        </p>
      </section>

      {/* Article 8 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 8 — Force majeure</h2>
        <p className="text-gray-700 leading-relaxed">
          Aucune des parties ne pourra être tenue responsable d'un manquement à ses obligations
          contractuelles causé par un événement de force majeure au sens de l'article 1218 du Code
          civil français, incluant notamment les catastrophes naturelles, les cyberattaques d'ampleur
          nationale, les pannes d'infrastructures de réseau au niveau des fournisseurs tiers, les
          décisions gouvernementales ou réglementaires imprévisibles, ou tout autre événement
          extérieur, imprévisible et irrésistible. La partie affectée devra notifier l'autre partie
          dans les meilleurs délais et reprendra l'exécution de ses obligations dès que l'événement
          de force majeure aura cessé.
        </p>
      </section>

      {/* Article 9 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 9 — Durée et résiliation</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Les présentes CGU sont conclues pour la durée de l'abonnement souscrit par l'Utilisateur,
          renouvelable selon les modalités définies dans les CGV.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          Chaque partie peut résilier le contrat en respectant un <strong>préavis de trente (30) jours</strong>,
          notifié par écrit (email avec accusé de réception) à l'autre partie.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          L'Éditeur se réserve le droit de suspendre ou de résilier l'accès à la Plateforme sans préavis
          et sans indemnité en cas de :
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-3">
          <li>Non-paiement persistant au-delà de quinze (15) jours après la date d'échéance ;</li>
          <li>Violation grave ou répétée des présentes CGU ;</li>
          <li>Utilisation frauduleuse ou illicite de la Plateforme ;</li>
          <li>Mise en danger de la sécurité ou de l'intégrité de la Plateforme ou des données des
              autres utilisateurs.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          En cas de résiliation, quelle qu'en soit la cause, l'Utilisateur bénéficie d'une période de
          trente (30) jours pour exporter ses données via les outils mis à disposition. À l'expiration
          de ce délai, les données sont supprimées des serveurs de production, à l'exception des données
          fiscales soumises à des obligations légales de conservation.
        </p>
      </section>

      {/* Article 10 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 10 — Modification des CGU</h2>
        <p className="text-gray-700 leading-relaxed">
          L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les modifications
          seront notifiées à l'Utilisateur par email au moins trente (30) jours avant leur entrée en
          vigueur. L'utilisation continue de la Plateforme après ce délai vaut acceptation des nouvelles
          conditions. En cas de refus, l'Utilisateur peut résilier son abonnement dans les conditions
          de l'article 9.
        </p>
      </section>

      {/* Article 11 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 11 — Droit applicable et juridiction compétente</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Les présentes CGU sont régies exclusivement par le droit français.
        </p>
        <p className="text-gray-700 leading-relaxed">
          En cas de litige relatif à l'interprétation ou à l'exécution des présentes CGU, les parties
          s'engagent à rechercher une solution amiable dans un délai de trente (30) jours à compter
          de la notification du différend. À défaut d'accord amiable, le litige sera soumis à la
          compétence exclusive du <strong>Tribunal de Commerce de Lyon</strong>, nonobstant pluralité de
          défendeurs ou appel en garantie.
        </p>
      </section>

      {/* Article 12 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Article 12 — Dispositions diverses</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Si l'une quelconque des dispositions des présentes CGU était déclarée nulle ou inapplicable
          par une juridiction compétente, les autres dispositions demeureront en vigueur et conserveront
          leur plein effet.
        </p>
        <p className="text-gray-700 leading-relaxed mb-3">
          Le fait pour l'Éditeur de ne pas se prévaloir d'une disposition des présentes CGU ne saurait
          être interprété comme une renonciation à s'en prévaloir ultérieurement.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Les présentes CGU constituent l'intégralité de l'accord entre les parties concernant leur
          objet et remplacent toutes les communications, offres ou accords antérieurs, écrits ou
          verbaux, relatifs à cet objet.
        </p>
      </section>

      {/* Contact */}
      <section className="mt-10 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
        <p className="text-gray-700 text-sm">
          Pour toute question relative aux présentes CGU :{' '}
          <a href="mailto:contact@restaurant-os.app" className="text-blue-600 hover:underline">
            contact@restaurant-os.app
          </a>
        </p>
      </section>
    </article>
  );
}
