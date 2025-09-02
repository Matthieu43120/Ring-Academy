import React from 'react';
import { Shield } from 'lucide-react';

function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-secondary-600 p-4 rounded-xl">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Politique de confidentialité
          </h1>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none text-gray-800">
          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="leading-relaxed mb-4">
              La présente politique de confidentialité a pour but d'informer les utilisateurs de la plateforme Ring Academy sur la manière dont leurs données personnelles sont collectées, traitées et protégées, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi française "Informatique et Libertés".
            </p>
            <p className="leading-relaxed">
              En utilisant Ring Academy, vous acceptez les pratiques décrites ci-dessous.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Responsable du traitement</h2>
            <div className="space-y-2">
              <p><strong>Nom :</strong> Matthieu ALEXANDER</p>
              <p><strong>Adresse :</strong> 1420 chemin de moularès, 34070 Montpellier</p>
              <p><strong>Email :</strong> m.alexander@ringacademy.fr</p>
              <p><strong>SIRET :</strong> 94089804200012</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Données collectées</h2>
            <p className="leading-relaxed mb-4">
              Nous collectons uniquement les données nécessaires au fonctionnement de Ring Academy :
            </p>
            <ul className="space-y-3 ml-6">
              <li><strong>Données de compte :</strong> nom, prénom, adresse e-mail, numéro de téléphone.</li>
              <li><strong>Données organisationnelles :</strong> appartenance à une organisation, crédits disponibles, historique des sessions.</li>
              <li><strong>Données de paiement :</strong> traitées exclusivement par Stripe (numéro de carte, date d'expiration, etc., jamais stockées par Ring Academy).</li>
              <li><strong>Données de simulation :</strong> textes ou paroles échangées lors des entraînements, transmises uniquement à OpenAI pour générer les réponses en temps réel.</li>
              <li><strong>Données techniques :</strong> adresse IP, type de navigateur, pages visitées (dans le cadre d'analyses statistiques anonymisées).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Finalités du traitement</h2>
            <p className="leading-relaxed mb-4">Vos données sont traitées pour :</p>
            <ul className="space-y-2 ml-6">
              <li>Créer et gérer votre compte utilisateur.</li>
              <li>Fournir les services de simulation et de formation.</li>
              <li>Gérer vos crédits et abonnements.</li>
              <li>Traiter vos paiements de manière sécurisée.</li>
              <li>Améliorer les performances et l'expérience utilisateur sur Ring Academy.</li>
              <li>Respecter nos obligations légales et comptables.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prestataires et sous-traitants</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1. Supabase</h3>
            <p className="leading-relaxed mb-6">
              Vos données personnelles (informations de compte, crédits, historique de sessions) sont hébergées et sécurisées via Supabase. Supabase agit uniquement comme sous-traitant technique et n'utilise pas vos données à d'autres fins. La supervision et la gestion restent sous la responsabilité exclusive de Ring Academy.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2. Stripe</h3>
            <p className="leading-relaxed mb-6">
              Les paiements sont traités par Stripe, prestataire certifié PCI-DSS. Les données de paiement sont cryptées, transmises directement à Stripe et ne sont jamais stockées par Ring Academy. Stripe agit uniquement comme intermédiaire technique.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3. OpenAI</h3>
            <p className="leading-relaxed mb-4">
              Lors des simulations d'appels, certaines données (contenu des échanges nécessaires à la simulation) sont transmises à OpenAI dans le seul but de générer les réponses de l'agent virtuel.
            </p>
            <p className="leading-relaxed">
              OpenAI n'utilise pas ces données pour entraîner ses modèles et ne les conserve que temporairement, conformément à sa politique de confidentialité.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Base légale du traitement</h2>
            <p className="leading-relaxed mb-4">Nous traitons vos données personnelles sur la base :</p>
            <ul className="space-y-2 ml-6">
              <li>De votre consentement (lors de la création de compte ou de l'utilisation de la simulation).</li>
              <li>De l'exécution d'un contrat (CGU/CGV acceptées lors de l'inscription).</li>
              <li>D'obligations légales (facturation, comptabilité).</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Durée de conservation des données</h2>
            <ul className="space-y-2 ml-6">
              <li><strong>Données de compte :</strong> conservées tant que votre compte est actif et jusqu'à 3 ans après sa dernière utilisation.</li>
              <li><strong>Données de paiement :</strong> jamais stockées par Ring Academy.</li>
              <li><strong>Données de simulation :</strong> stockées uniquement le temps nécessaire au traitement technique de la session, puis supprimées.</li>
              <li><strong>Données techniques :</strong> jusqu'à 12 mois maximum à des fins statistiques.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Droits des utilisateurs</h2>
            <p className="leading-relaxed mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="space-y-2 ml-6">
              <li>Droit d'accès à vos données.</li>
              <li>Droit de rectification.</li>
              <li>Droit à l'effacement ("droit à l'oubli").</li>
              <li>Droit de limitation du traitement.</li>
              <li>Droit d'opposition.</li>
              <li>Droit à la portabilité des données.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Pour exercer vos droits, vous pouvez nous contacter à : m.alexander@ringacademy.fr
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Sécurité des données</h2>
            <p className="leading-relaxed">
              Nous mettons en œuvre toutes les mesures techniques et organisationnelles nécessaires pour protéger vos données contre tout accès non autorisé, perte, altération ou destruction.
            </p>
          </section>

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies</h2>
            <p className="leading-relaxed">
              Ring Academy utilise uniquement des cookies nécessaires au fonctionnement du site et, le cas échéant, des cookies analytiques anonymisés. Vous pouvez gérer vos préférences via les paramètres de votre navigateur.
            </p>
          </section>

          {/* Section 11 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modifications de la politique</h2>
            <p className="leading-relaxed">
              Nous pouvons modifier la présente politique pour refléter les évolutions légales ou techniques. Les utilisateurs seront informés en cas de changement majeur.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PolitiqueConfidentialite;