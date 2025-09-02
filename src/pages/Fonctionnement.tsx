import React from 'react';
import { Link } from 'react-router-dom';
import { User, GraduationCap, Building2, CreditCard, CheckCircle, TrendingUp, Users, Clock, ArrowRight, Play, Zap, Target } from 'lucide-react';

function Fonctionnement() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6 font-display">
            Comment fonctionne Ring Academy ?
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            Une plateforme simple et flexible pour développer vos compétences en prospection téléphonique
          </p>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4 font-display">Comment ça marche ?</h2>
            <p className="text-xl text-secondary-600">8 étapes simples pour une simulation réaliste</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Étape 1 */}
            <div className="text-center group">
              <div className="bg-secondary-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Choisissez votre cible</h3>
              <p className="text-secondary-600 text-sm">Assistante de direction, dirigeant, DRH...</p>
            </div>

            {/* Étape 2 */}
            <div className="text-center group">
              <div className="bg-secondary-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Sélectionnez la difficulté</h3>
              <p className="text-secondary-600 text-sm">Facile, moyen ou difficile selon votre niveau</p>
            </div>

            {/* Étape 3 */}
            <div className="text-center group">
              <div className="bg-secondary-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Lancez l'appel</h3>
              <p className="text-secondary-600 text-sm">Démarrez votre simulation d'appel</p>
            </div>

            {/* Étape 4 */}
            <div className="text-center group">
              <div className="bg-secondary-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                <span className="text-2xl font-bold text-primary-600">4</span>
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">L'IA vous répond</h3>
              <p className="text-secondary-600 text-sm">Réponse instantanée et naturelle</p>
            </div>

            {/* Étape 5 */}
            <div className="text-center group">
              <div className="bg-secondary-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                <span className="text-2xl font-bold text-primary-600">5</span>
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Parlez naturellement</h3>
              <p className="text-secondary-600 text-sm">Exprimez-vous comme dans un vrai appel</p>
            </div>

            {/* Étape 6 */}
            <div className="text-center group">
              <div className="bg-secondary-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                <span className="text-2xl font-bold text-primary-600">6</span>
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Échangez en temps réel</h3>
              <p className="text-secondary-600 text-sm">Conversation fluide comme un vrai appel</p>
            </div>

            {/* Étape 7 */}
            <div className="text-center group">
              <div className="bg-secondary-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                <span className="text-2xl font-bold text-primary-600">7</span>
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Obtenez un RDV</h3>
              <p className="text-secondary-600 text-sm">Tentez de décrocher un rendez-vous</p>
            </div>

            {/* Étape 8 */}
            <div className="text-center group">
              <div className="bg-secondary-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                <span className="text-2xl font-bold text-primary-600">8</span>
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Consultez votre rapport</h3>
              <p className="text-secondary-600 text-sm">Analysez vos performances et progressez</p>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="bg-primary-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-secondary-900 mb-6 font-display">Introduction</h2>
            </div>
            
            <div className="prose prose-lg max-w-none text-secondary-700 leading-relaxed">
              <p className="text-center text-xl mb-8">
                À l'image de certains forfaits téléphoniques, les appels sont possibles grâce à votre crédit.
              </p>
              <p className="text-center text-lg">
                Sur Ring Academy, c'est pareil : chaque simulation d'appel IA utilise du crédit. 
                Vous achetez des packs, vous les utilisez à votre rythme, sans date limite de validité, 
                avec des utilisateurs illimités. <strong>Simple, souple et sans engagement.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnement des crédits */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4 font-display">Le fonctionnement des crédits</h2>
          </div>

          <div className="bg-neutral-50 rounded-2xl shadow-soft border border-neutral-200 p-8 md:p-12">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary p-2 rounded-full mt-1 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg text-secondary-700">
                  <strong>1 crédit = 3 simulations d'appel IA.</strong>
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary p-2 rounded-full mt-1 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg text-secondary-700">
                  <strong>1 crédit gratuit offert lors de la création de votre compte.</strong>
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary p-2 rounded-full mt-1 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg text-secondary-700">
                  Les crédits n'ont pas de date d'expiration.
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary p-2 rounded-full mt-1 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg text-secondary-700">
                  Vos utilisateurs sont illimités, que vous soyez seul ou que vous utilisiez Ring Academy 
                  pour vos élèves, apprenants ou équipes commerciales.
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary p-2 rounded-full mt-1 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg text-secondary-700">
                  Achetez un pack ponctuel ou abonnez-vous mensuellement selon votre besoin.
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary p-2 rounded-full mt-1 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="text-lg text-secondary-700">
                  <p className="mb-3">Un tableau de bord clair vous permet de suivre les progrès réalisés :</p>
                  <ul className="ml-6 space-y-2 text-secondary-600">
                    <li className="flex items-start space-x-2">
                      <span className="text-primary mt-2">•</span>
                      <span><strong>Indépendants :</strong> suivez votre propre évolution et vos performances dans le temps.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-primary mt-2">•</span>
                      <span><strong>Coachs, formateurs, entreprises ou organisme de formation :</strong> visualisez l'activité, l'implication et les progrès de vos utilisateurs ou apprenants.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profils utilisateurs */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4 font-display">Pour qui ?</h2>
            <p className="text-xl text-secondary-600">Ring Academy s'adapte à votre situation professionnelle</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Indépendants */}
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="bg-secondary-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                  <User className="h-10 w-10 text-secondary-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-secondary-900 font-display">Indépendants / Freelances</h3>
                <p className="text-secondary-600 font-semibold">Parfait pour s'entraîner à son rythme.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-secondary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Pratiquez votre pitch et gagnez en aisance commerciale.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-secondary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Préparez une prise de contact importante.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-secondary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Aucune installation, vous vous connectez, vous appelez.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-secondary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Suivi de vos progrès via un tableau de bord personnel.</p>
                </div>
              </div>
            </div>

            {/* Coachs & Formateurs */}
            <div className="group bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 hover:shadow-medium hover:scale-105 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="bg-accent-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                  <GraduationCap className="h-10 w-10 text-accent-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-secondary-900 font-display">Coachs & Formateurs</h3>
                <p className="text-accent-600 font-semibold">Un outil pédagogique différenciant et moderne.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-accent-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Donnez à vos élèves un outil concret pour s'entraîner.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-accent-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Proposez des simulations réalistes et personnalisées.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-accent-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Tableau de bord dédié pour suivre la progression de chaque utilisateur.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-accent-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Utilisez vos crédits avec qui vous voulez, quand vous voulez.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-accent-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Apportez une vraie valeur ajoutée à vos formations.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-accent-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Après création de votre compte, créez votre organisation pour inviter des utilisateurs à utiliser vos crédits.</p>
                </div>
              </div>
            </div>

            {/* Entreprises */}
            <div className="group bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 hover:shadow-medium hover:scale-105 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="bg-primary-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <Building2 className="h-10 w-10 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-secondary-900 font-display">Entreprises / Organismes de formation</h3>
                <p className="text-primary-600 font-semibold">Un vrai plus dans la montée en compétence.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Accélérez la formation de vos commerciaux ou téléconseillers.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Donnez à vos élèves / apprenants un outil concret pour s'entraîner.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Offrez un entraînement immersif dès leur arrivée.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Optimisez vos formations internes avec un outil clé en main.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Visualisez l'engagement et les progrès de vos équipes via un tableau de bord clair.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Utilisation ponctuelle ou régulière, vous êtes libre.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 p-1 rounded-full mt-1 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-secondary-700">Après création de votre compte, créez votre organisation pour inviter des utilisateurs à utiliser vos crédits.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lien vers le guide d'utilisation */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-xl shadow-soft border border-neutral-200 p-8">
            <p className="text-lg text-secondary-700">
              Pour découvrir l'utilisation complète de Ring Academy,{' '}
              <Link 
                to="/guide-utilisation" 
                className="text-primary-600 hover:text-primary-700 font-semibold underline transition-colors"
              >
                lisez le guide d'utilisation
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 font-display">
            Prêt à commencer ?
          </h2>
          <p className="text-xl mb-8 text-neutral-300 max-w-2xl mx-auto">
            Découvrez nos packs de crédits et commencez votre entraînement dès maintenant.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/training"
              className="bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all duration-300 inline-flex items-center justify-center space-x-3 shadow-strong hover:shadow-medium hover:scale-105"
            >
              <Play className="h-6 w-6" />
              <span>Zone d'entraînement</span>
            </Link>
            
            <Link
              to="/credits"
              className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center space-x-3 hover:scale-105"
            >
              <CreditCard className="h-6 w-6" />
              <span>Voir les packs de crédits</span>
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Fonctionnement;