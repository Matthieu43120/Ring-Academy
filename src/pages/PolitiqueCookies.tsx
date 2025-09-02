import React from 'react';
import { Cookie } from 'lucide-react';

function PolitiqueCookies() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-secondary-600 p-4 rounded-xl">
              <Cookie className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Politique des cookies – Ring Academy
          </h1>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none text-gray-800">
          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="leading-relaxed mb-4">
              La présente politique explique comment Ring Academy utilise des cookies et technologies similaires sur son site.
            </p>
            <p className="leading-relaxed">
              Lors de votre première visite, un bandeau vous informe de l'utilisation des cookies et vous permet de gérer vos préférences.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Qu'est-ce qu'un cookie ?</h2>
            <p className="leading-relaxed mb-4">
              Un cookie est un petit fichier texte stocké sur votre appareil lors de la consultation d'un site web.
            </p>
            <p className="leading-relaxed">
              Il permet au site de mémoriser certaines informations pour faciliter votre navigation, mesurer la fréquentation ou personnaliser l'expérience.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cookies utilisés sur Ring Academy</h2>
            <p className="leading-relaxed mb-6">
              Nous utilisons uniquement des cookies strictement nécessaires au bon fonctionnement du site et des services, ainsi que certains cookies de mesure d'audience et de paiement.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1. Cookies techniques (obligatoires)</h3>
            <p className="leading-relaxed mb-4">Ces cookies sont indispensables pour :</p>
            <ul className="space-y-2 ml-6 mb-6">
              <li>Vous connecter à votre compte.</li>
              <li>Maintenir votre session active.</li>
              <li>Assurer la sécurité et la performance du site.</li>
            </ul>
            <p className="leading-relaxed mb-6">
              Sans ces cookies, certaines fonctionnalités ne peuvent pas fonctionner.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2. Cookies de mesure d'audience</h3>
            <p className="leading-relaxed mb-4">
              Nous utilisons un outil de suivi statistique (par exemple Google Analytics ou équivalent) pour analyser l'utilisation du site et améliorer nos services.
            </p>
            <p className="leading-relaxed mb-6">
              Les données collectées sont anonymisées et ne permettent pas de vous identifier directement.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3. Cookies liés au paiement (Stripe)</h3>
            <p className="leading-relaxed mb-4">
              Lors d'un paiement, Stripe utilise des cookies pour sécuriser la transaction et prévenir la fraude.
            </p>
            <p className="leading-relaxed">
              Ces cookies sont gérés par Stripe et soumis à leur propre politique de confidentialité.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Consentement et gestion des cookies</h2>
            <p className="leading-relaxed mb-4">Lors de votre première visite, un bandeau vous permet :</p>
            <ul className="space-y-2 ml-6 mb-4">
              <li>D'accepter tous les cookies.</li>
              <li>De refuser les cookies non essentiels.</li>
              <li>De personnaliser vos choix.</li>
            </ul>
            <p className="leading-relaxed">
              Vous pouvez également modifier vos préférences à tout moment dans les paramètres de votre navigateur.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Durée de conservation</h2>
            <p className="leading-relaxed mb-4">La durée de conservation des cookies varie selon leur finalité :</p>
            <ul className="space-y-2 ml-6">
              <li><strong>Cookies techniques :</strong> durée de votre session ou jusqu'à 12 mois.</li>
              <li><strong>Cookies de mesure d'audience :</strong> jusqu'à 13 mois.</li>
              <li><strong>Cookies Stripe :</strong> selon la politique de Stripe.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Plus d'informations</h2>
            <p className="leading-relaxed">
              Pour toute question sur notre utilisation des cookies, vous pouvez nous contacter à :<br />
              <strong>m.alexander@ringacademy.fr</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PolitiqueCookies;