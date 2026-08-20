import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certification NF525 — Restaurant OS',
  description: 'Tout savoir sur la certification NF525 de Restaurant OS : scellement fiscal, chaîne WORM, FEC, ticket Z automatique.',
};

export default function NF525Page() {
  return (
    <section className="pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-invert prose-amber max-w-none">
        <h1>Certification NF525</h1>
        <p className="lead">
          Restaurant OS est un logiciel de caisse <strong>certifié conforme NF525</strong>,
          garantissant l&apos;inaltérabilité, la sécurisation, la conservation et l&apos;archivage
          des données de caisse.
        </p>

        <h2>Qu&apos;est-ce que la norme NF525 ?</h2>
        <p>
          La norme NF525 (publiée par l&apos;AFNOR/Infocert) est le référentiel de certification
          des logiciels de caisse en France. Depuis le 1er janvier 2018, tout commerçant
          assujetti à la TVA doit utiliser un logiciel de caisse certifié ou attesté conforme.
        </p>

        <h2>Les 4 piliers de conformité</h2>

        <h3>🔒 1. Inaltérabilité</h3>
        <p>
          Chaque opération de caisse est <strong>scellée cryptographiquement</strong> (SHA-256)
          dans une chaîne de hachage WORM (Write Once, Read Many). Toute tentative de modification
          est détectée et bloquée. Les collections fiscales sont protégées par le{' '}
          <code>SovereignGuard</code> qui refuse toute mutation.
        </p>

        <h3>🛡️ 2. Sécurisation</h3>
        <p>
          Authentification forte (Firebase Auth + MFA pour les administrateurs),
          isolation par tenant, chiffrement AES-256 en transit et au repos.
          Les clés de scellement sont stockées en HSM (Hardware Security Module).
        </p>

        <h3>💾 3. Conservation</h3>
        <p>
          Toutes les données de caisse sont conservées pendant <strong>6 ans minimum</strong>
          (obligation fiscale) et <strong>10 ans</strong> pour les documents comptables.
          Les sauvegardes automatiques quotidiennes garantissent la pérennité.
        </p>

        <h3>📦 4. Archivage</h3>
        <p>
          Les archives fiscales sont signées et horodatées. Le ticket Z de clôture
          est généré automatiquement à chaque fermeture de service avec le total
          des opérations, les modes de paiement et le sceau fiscal.
        </p>

        <h2>Exports disponibles</h2>
        <ul>
          <li><strong>FEC</strong> (Fichier des Écritures Comptables) — Format normé pour l&apos;administration fiscale</li>
          <li><strong>Grand Livre</strong> — Export PDF et CSV</li>
          <li><strong>Journaux comptables</strong> — Ventes, achats, banque</li>
          <li><strong>Ticket Z</strong> — Automatique, daté et scellé</li>
          <li><strong>Registre fiscal</strong> — Historique complet des opérations</li>
        </ul>

        <h2>Multi-caisse</h2>
        <p>
          En environnement multi-caisse, chaque terminal scelle ses opérations
          <strong> indépendamment</strong>. Le ticket Z consolide l&apos;ensemble des caisses
          avec un sceau global. Cette architecture garantit la conformité même en cas de
          défaillance réseau entre les terminaux.
        </p>

        <h2>Certificat</h2>
        <p>
          Le certificat de conformité NF525 est disponible sur demande auprès
          de notre service commercial : <strong>contact@restaurant-os.fr</strong>
        </p>

        <div className="mt-8 p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-amber-400 font-medium m-0">
            💡 En cas de contrôle fiscal, Restaurant OS génère automatiquement
            tous les documents requis en 1 clic depuis le portail comptable.
          </p>
        </div>
      </div>
    </section>
  );
}
