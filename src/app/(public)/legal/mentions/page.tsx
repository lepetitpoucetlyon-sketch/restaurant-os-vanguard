// NO 'use client' — Page serveur statique.
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions légales | Restaurant OS',
  description: 'Mentions légales de la plateforme Restaurant OS, éditeur et hébergeur.',
};

export default function MentionsPage() {
  const lastUpdate = '17 juillet 2026';

  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions légales</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {lastUpdate}</p>

      <p className="text-gray-700 leading-relaxed mb-8">
        Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en
        l'économie numérique (LCEN), les présentes mentions légales précisent l'identité des
        différents intervenants dans le cadre de la réalisation et du suivi de la plateforme SaaS
        Restaurant OS accessible à l'adresse restaurant-os.app.
      </p>

      {/* Éditeur */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Éditeur de la plateforme</h2>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Dénomination sociale</dt>
              <dd className="text-gray-700">Restaurant OS SAS</dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Forme juridique</dt>
              <dd className="text-gray-700">Société par Actions Simplifiée (SAS)</dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Capital social</dt>
              <dd className="text-gray-700">10 000 €</dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Siège social</dt>
              <dd className="text-gray-700">
                [Adresse à compléter]<br />
                69001 Lyon, France
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Immatriculation RCS</dt>
              <dd className="text-gray-700">RCS Lyon — [Numéro à compléter]</dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Numéro SIRET</dt>
              <dd className="text-gray-700">[SIRET à compléter — 14 chiffres]</dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Numéro de TVA</dt>
              <dd className="text-gray-700">FR [Numéro intracommunautaire à compléter]</dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Directeur de publication</dt>
              <dd className="text-gray-700">[Prénom Nom], Gérant</dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Contact</dt>
              <dd className="text-gray-700">
                <a href="mailto:contact@restaurant-os.app" className="text-blue-600 hover:underline">
                  contact@restaurant-os.app
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Hébergeur */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Hébergement</h2>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Hébergeur</dt>
              <dd className="text-gray-700">Vercel Inc.</dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Siège social</dt>
              <dd className="text-gray-700">
                340 Pine Street Suite 701<br />
                San Francisco, CA 94104<br />
                États-Unis d'Amérique
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="font-semibold text-gray-900 w-48 shrink-0">Site web</dt>
              <dd className="text-gray-700">
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  vercel.com
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Les données sont hébergées sur des serveurs situés dans l'Union Européenne et/ou aux
          États-Unis. Le transfert de données vers les États-Unis est encadré par les Clauses
          Contractuelles Types (CCT) approuvées par la Commission Européenne. Pour plus
          d'informations, consultez notre{' '}
          <Link href="/legal/rgpd" className="text-blue-600 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>

      {/* Propriété intellectuelle */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Propriété intellectuelle</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          L'ensemble du contenu de la plateforme Restaurant OS (textes, images, interfaces graphiques,
          algorithmes, code source, marques, logos, dénominations sociales) est protégé par le droit de
          la propriété intellectuelle et demeure la propriété exclusive de Restaurant OS SAS ou de ses
          partenaires.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Toute reproduction, représentation, modification, adaptation, traduction ou distribution, même
          partielle, de ces éléments sans autorisation écrite préalable de Restaurant OS SAS est strictement
          interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du
          Code de la propriété intellectuelle.
        </p>
      </section>

      {/* Données personnelles */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Données personnelles et cookies</h2>
        <p className="text-gray-700 leading-relaxed">
          La collecte et le traitement de données à caractère personnel effectués dans le cadre de
          l'utilisation de la plateforme sont détaillés dans notre{' '}
          <Link href="/legal/rgpd" className="text-blue-600 hover:underline">
            politique de confidentialité
          </Link>
          . La plateforme n'utilise que des cookies strictement nécessaires à son fonctionnement.
        </p>
      </section>

      {/* Facturation secteur public */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Facturation secteur public (B2G)</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          La facturation électronique à destination des entités publiques (État, collectivités
          territoriales, établissements publics) est obligatoire et s'effectue exclusivement via le
          portail{' '}
          <a
            href="https://chorus-pro.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Chorus Pro
          </a>{' '}
          (Direction Générale des Finances Publiques — DGFiP), conformément à l'ordonnance
          n° 2014-697 du 26 juin 2014.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Le numéro SIRET de Restaurant OS SAS figure dans l'encadré "Éditeur de la plateforme"
          ci-dessus et doit être renseigné sur toute facture émise vers une entité publique.
        </p>
      </section>

      {/* Responsabilité */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitation de responsabilité</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Restaurant OS SAS met tout en œuvre pour assurer l'exactitude des informations publiées sur
          la plateforme, mais ne peut garantir leur exhaustivité, leur exactitude ou leur mise à jour
          permanente.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Restaurant OS SAS décline toute responsabilité pour les dommages directs ou indirects résultant
          de l'accès à la plateforme, de son utilisation ou de son indisponibilité temporaire. Les liens
          hypertextes présents sur la plateforme pointant vers des sites tiers sont fournis à titre
          informatif ; Restaurant OS SAS n'assume aucune responsabilité quant à leur contenu.
        </p>
      </section>

      {/* Médiation */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Médiation des litiges</h2>
        <p className="text-gray-700 leading-relaxed">
          En cas de litige, le Client peut recourir à une procédure de médiation conventionnelle ou à
          tout autre mode alternatif de règlement des différends. En dernier recours, le litige sera
          soumis aux juridictions compétentes de Lyon conformément aux conditions générales applicables.
        </p>
      </section>

      {/* Contact légal */}
      <section className="mt-10 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
        <p className="text-gray-700 text-sm">
          Pour toute question d'ordre juridique :{' '}
          <a href="mailto:contact@restaurant-os.app" className="text-blue-600 hover:underline">
            contact@restaurant-os.app
          </a>
        </p>
      </section>
    </article>
  );
}
