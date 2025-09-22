import React from 'react';
import { FileText } from 'lucide-react';

function ConditionsGenerales() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-secondary-600 p-4 rounded-xl">
              <FileText className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Conditions Générales d'Utilisation et de Vente – Ring Academy
          </h1>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none text-gray-800">
          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
            <p className="leading-relaxed mb-4">
              Les présentes Conditions Générales d'Utilisation et de Vente (ci-après "CGU/CGV") définissent les modalités d'accès et d'utilisation de la plateforme Ring Academy, ainsi que les conditions applicables à l'achat de crédits et abonnements.
            </p>
            <p className="leading-relaxed">
              En créant un compte ou en utilisant la plateforme, vous acceptez sans réserve les présentes CGU/CGV.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Éditeur</h2>
            <div className="space-y-2">
              <p><strong>Nom :</strong> Matthieu ALEXANDER</p>
              <p><strong>Adresse :</strong> 721 rue de la mairie, 01120 Thil</p>
              <p><strong>Email :</strong> m.alexander@ringacademy.fr</p>
              <p><strong>SIRET :</strong> 94089804200012</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Définitions</h2>
            <ul className="space-y-3">
              <li><strong>Plateforme :</strong> le site et les services proposés sous le nom "Ring Academy".</li>
              <li><strong>Utilisateur :</strong> toute personne physique ou morale inscrite sur la plateforme.</li>
              <li><strong>Organisation :</strong> compte regroupant plusieurs utilisateurs, généralement géré par un coach, formateur, entreprise ou organisme de formation.</li>
              <li><strong>Crédit :</strong> unité de consommation permettant de lancer des sessions de simulation (1 crédit = 3 simulations).</li>
              <li><strong>Abonnement :</strong> formule de paiement récurrent donnant accès à un nombre déterminé de crédits par période.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Accès à la plateforme</h2>
            <p className="leading-relaxed mb-4">L'accès à Ring Academy nécessite :</p>
            <ul className="space-y-2 ml-6">
              <li>La création d'un compte personnel.</li>
              <li>L'acceptation des présentes CGU/CGV.</li>
              <li>Un accès Internet et un équipement compatible.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Ring Academy se réserve le droit de refuser ou suspendre un compte en cas de non-respect des présentes conditions.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Utilisation des services</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1. Comptes individuels</h3>
            <p className="leading-relaxed mb-6">
              Les utilisateurs indépendants peuvent créer un compte sans appartenir à une organisation et acheter leurs propres crédits/abonnements.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2. Comptes organisation</h3>
            <ul className="space-y-2 ml-6 mb-6">
              <li>Les organisations peuvent inviter des membres et partager leurs crédits entre eux.</li>
              <li>Le propriétaire de l'organisation est responsable de la gestion des crédits et de l'utilisation de la plateforme par ses membres.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3. Simulations d'appels</h3>
            <ul className="space-y-2 ml-6">
              <li>Les simulations d'appels sont générées par une intelligence artificielle (IA) fournie par OpenAI.</li>
              <li>Les échanges sont traités uniquement pour permettre le bon fonctionnement de la simulation et ne sont pas conservés au-delà de la session.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Système de crédits et abonnements</h2>
            <ul className="space-y-2 ml-6">
              <li><strong>Crédits :</strong> utilisables sans date limite de validité.</li>
              <li><strong>Abonnements :</strong> reconduits automatiquement à chaque période, sauf résiliation avant la date de renouvellement. Pour résilier votre abonnement, merci de me contacter directement, par mail ou téléphone.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Prix et paiement</h2>
            <ul className="space-y-2 ml-6">
              <li>Les prix sont indiqués en euros et toutes taxes comprises (TTC).</li>
              <li>Les paiements sont effectués via Stripe, prestataire certifié PCI-DSS.</li>
              <li>Ring Academy ne stocke pas les données de paiement.</li>
              <li>Le paiement est exigible immédiatement lors de la commande de crédits ou à chaque échéance d'abonnement.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Rétractation et remboursement</h2>
            <ul className="space-y-2 ml-6">
              <li>Conformément au Code de la consommation, l'utilisateur consommateur dispose d'un délai de 14 jours pour se rétracter.</li>
              <li>Toutefois, ce droit ne s'applique pas si l'utilisateur a commencé à utiliser les crédits ou à bénéficier de l'abonnement avant la fin de ce délai, ce qu'il accepte expressément.</li>
              <li>Les crédits ou abonnements consommés ne sont pas remboursables.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Responsabilités</h2>
            <p className="leading-relaxed mb-4">
              Ring Academy s'engage à fournir un service de qualité mais ne garantit pas l'absence d'interruptions ou de bugs techniques.
            </p>
            <p className="leading-relaxed mb-4">
              L'utilisateur est seul responsable de l'utilisation qu'il fait de la plateforme.
            </p>
            <p className="leading-relaxed mb-4">Ring Academy ne pourra être tenue responsable :</p>
            <ul className="space-y-2 ml-6">
              <li>Des dommages indirects liés à l'utilisation ou à l'impossibilité d'utiliser la plateforme.</li>
              <li>De tout contenu généré par l'IA pouvant contenir des erreurs ou inexactitudes.</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Protection des données</h2>
            <p className="leading-relaxed mb-4">
              Le traitement des données personnelles est détaillé dans notre Politique de confidentialité.
            </p>
            <p className="leading-relaxed">
              L'utilisateur est invité à la consulter pour connaître ses droits et les modalités de traitement.
            </p>
          </section>

          {/* Section 11 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Propriété intellectuelle</h2>
            <p className="leading-relaxed mb-4">
              Tous les contenus, marques, logos et éléments graphiques de Ring Academy sont protégés par le droit de la propriété intellectuelle.
            </p>
            <p className="leading-relaxed">
              Toute reproduction ou utilisation non autorisée est interdite.
            </p>
          </section>

          {/* Section 12 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Résiliation</h2>
            <p className="leading-relaxed mb-4">Ring Academy se réserve le droit de suspendre ou résilier un compte en cas de :</p>
            <ul className="space-y-2 ml-6">
              <li>Non-paiement.</li>
              <li>Utilisation abusive ou frauduleuse de la plateforme.</li>
              <li>Non-respect des présentes CGU/CGV.</li>
            </ul>
          </section>

          {/* Section 13 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Modifications</h2>
            <p className="leading-relaxed">
              Ring Academy peut modifier les présentes CGU/CGV à tout moment. Les utilisateurs seront informés de toute modification majeure.
            </p>
          </section>

          {/* Section 14 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Droit applicable et juridiction compétente</h2>
            <p className="leading-relaxed mb-4">
              Les présentes CGU/CGV sont soumises au droit français.
            </p>
            <p className="leading-relaxed">
              Tout litige sera porté devant les tribunaux compétents du ressort de Montpellier.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ConditionsGenerales;