import React from 'react';
import { Scale } from 'lucide-react';

function MentionsLegales() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-secondary-600 p-4 rounded-xl">
              <Scale className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mentions Légales – Ring Academy
          </h1>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none text-gray-800">
          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Éditeur du site</h2>
            <div className="space-y-2">
              <p><strong>Nom :</strong> Matthieu ALEXANDER</p>
              <p><strong>Adresse :</strong> 721 rue de la mairie, 01120 Thil</p>
              <p><strong>SIRET :</strong> 94089804200012</p>
              <p><strong>Email :</strong> m.alexander@ringacademy.fr</p>
              <p><strong>Téléphone :</strong> 07 57 80 20 21</p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Hébergement</h2>
            <p className="mb-4">Le site Ring Academy est hébergé par :</p>
            <div className="space-y-2">
              <p><strong>OVHcloud</strong></p>
              <p>2 rue Kellermann</p>
              <p>59100 Roubaix, France</p>
              <p><strong>Téléphone :</strong> +33 9 72 10 10 07</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Propriété intellectuelle</h2>
            <p className="leading-relaxed">
              L'ensemble des contenus présents sur le site Ring Academy (textes, images, logos, vidéos, codes sources) 
              sont la propriété exclusive de Ring Academy ou de ses partenaires. Toute reproduction, représentation, 
              modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou 
              le procédé utilisé, est interdite sans l'autorisation écrite préalable de Ring Academy.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Données personnelles</h2>
            <p className="mb-6 leading-relaxed">
              Les données personnelles collectées sur Ring Academy sont utilisées uniquement dans le cadre de la 
              gestion des comptes utilisateurs, des crédits et du bon fonctionnement de la plateforme.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Stockage et sécurité des données</h3>
            <p className="mb-6 leading-relaxed">
              Les données personnelles collectées sont hébergées de manière sécurisée par notre prestataire technique 
              Supabase. Supabase agit uniquement en tant que sous-traitant et n'a aucun droit d'utilisation sur ces 
              données. La gestion et le contrôle des données restent exclusivement sous la responsabilité de Ring Academy. 
              Ces informations ne sont ni vendues, ni partagées avec des tiers non autorisés.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Droits des utilisateurs</h3>
            <p className="leading-relaxed">
              Conformément à la loi "Informatique et Libertés" et au RGPD, vous disposez d'un droit d'accès, de 
              rectification, d'effacement, de limitation du traitement, d'opposition et de portabilité de vos données 
              personnelles. Vous pouvez exercer ces droits en contactant Ring Academy à l'adresse email suivante : 
              m.alexander@ringacademy.fr
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Paiements sécurisés</h2>
            <p className="leading-relaxed">
              Les transactions effectuées sur Ring Academy sont traitées via la plateforme de paiement Stripe, 
              reconnue pour ses standards élevés de sécurité. Stripe agit uniquement en tant qu'intermédiaire 
              technique pour le traitement des paiements et n'utilise pas vos données à d'autres fins. Les 
              informations de paiement (telles que les numéros de carte) sont cryptées, transmises directement 
              à Stripe et ne sont jamais stockées sur nos serveurs.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Responsabilité</h2>
            <p className="leading-relaxed">
              Ring Academy met tout en œuvre pour assurer l'exactitude et la mise à jour des informations diffusées 
              sur ce site. Toutefois, Ring Academy ne saurait être tenue responsable des erreurs, d'une absence de 
              disponibilité des informations ou pour tout dommage résultant de l'utilisation du site.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Droit applicable</h2>
            <p className="leading-relaxed">
              Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux 
              français seront seuls compétents.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default MentionsLegales;