import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, Building2, Users, CreditCard, Play, BarChart3, UserPlus, CheckCircle, ArrowRight } from 'lucide-react';

function GuideUtilisation() {
  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-xl">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6 font-display">
            Guide d'utilisation – Ring Academy
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            Bienvenue sur Ring Academy ! Ce guide vous explique pas à pas comment utiliser la plateforme, 
            que vous soyez un utilisateur individuel ou un organisme souhaitant entraîner vos équipes / apprenants.
          </p>
        </div>

        {/* Navigation rapide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <a href="#partie1" className="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 hover:shadow-medium transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-900">Utilisateurs individuels</h3>
                <p className="text-sm text-secondary-600">S'entraîner en autonomie</p>
              </div>
            </div>
          </a>

          <a href="#partie2" className="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 hover:shadow-medium transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-900">Organismes & Entreprises</h3>
                <p className="text-sm text-secondary-600">Gérer vos équipes</p>
              </div>
            </div>
          </a>

          <a href="#partie3" className="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 hover:shadow-medium transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-900">Rejoindre une organisation</h3>
                <p className="text-sm text-secondary-600">Avec un code</p>
              </div>
            </div>
          </a>
        </div>

        {/* Partie 1 : Utilisateurs individuels */}
        <section id="partie1" className="mb-16">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white font-display">
                    Partie 1 : Pour les utilisateurs individuels
                  </h2>
                  <p className="text-blue-100 mt-1">
                    S'entraîner en autonomie à la prospection téléphonique grâce à notre IA qui simule vos prospects.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Étape 1 */}
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <UserPlus className="h-5 w-5 text-blue-500" />
                    <span>Création de compte</span>
                  </h3>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Rendez-vous sur la page d'inscription : <Link to="/register" className="text-blue-600 hover:text-blue-800 underline">'Créer mon compte'</Link> (Section « Compte individuel »)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Remplissez vos informations : nom, prénom, email et mot de passe.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Validez votre compte via le mail de confirmation reçu.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <span>Accès à vos crédits</span>
                  </h3>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Dès votre inscription, vous recevez un crédit de bienvenue (3 simulations).</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Vous pouvez acheter des <Link to="/credits" className="text-blue-600 hover:text-blue-800 underline">packs de crédits</Link> en direct ou via un abonnement pour continuer vos sessions d'entraînements.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Chaque session consomme un certain nombre de crédits. (1 crédit = 3 simulations)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <Play className="h-5 w-5 text-blue-500" />
                    <span>Démarrage d'une session</span>
                  </h3>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Connectez-vous à votre compte.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Rendez-vous dans la <Link to="/training" className="text-blue-600 hover:text-blue-800 underline">Zone d'entraînement</Link>.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Choisissez votre niveau de difficulté et votre type d'interlocuteur.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Lancez la simulation : l'IA répondra dynamiquement à vos phrases et objections. Entraînez-vous à la prospection téléphonique à votre rythme et sans pression.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Étape 4 */}
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <span>Débriefing</span>
                  </h3>
                  <p className="text-secondary-700 mb-3">À la fin de chaque session, un récapitulatif vous est présenté :</p>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Points forts et points à améliorer</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Score de performance</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Suggestions pour progresser</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Étape 5 */}
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <span>Historique et suivi</span>
                  </h3>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Vous pouvez retrouver toutes vos sessions passées dans votre tableau de bord personnel.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Consultez vos scores et suivez votre progression dans le temps.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partie 2 : Organismes */}
        <section id="partie2" className="mb-16">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white font-display">
                    Partie 2 : Pour les organismes de formation, coachs et formateurs ou les entreprises
                  </h2>
                  <p className="text-purple-100 mt-1">
                    Proposer Ring Academy à vos apprenants, commerciaux ou membres d'équipe et gérer leurs progressions.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Étape 1 */}
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <UserPlus className="h-5 w-5 text-purple-500" />
                    <span>Création de compte</span>
                  </h3>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Rendez-vous sur la page d'inscription : <Link to="/register" className="text-purple-600 hover:text-purple-800 underline">'Créer mon compte'</Link></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Remplissez vos informations : nom, prénom, email et mot de passe.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Validez votre compte via le mail de confirmation reçu.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-purple-500" />
                    <span>Création d'une organisation</span>
                  </h3>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Connectez-vous, rendez-vous dans votre tableau de bord et cliquez sur "Créer une organisation".</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Renseignez le nom de votre organisation.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Validez pour créer l'organisation.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-purple-500" />
                    <span>Gestion des crédits</span>
                  </h3>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Achetez des <Link to="/credits" className="text-purple-600 hover:text-purple-800 underline">packs de crédits</Link> ou choisissez un abonnement pour votre organisation. Si vous en avez déjà acheté via votre compte avant la création de votre organisation, ces derniers sont transférés automatiquement à votre organisation.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Les crédits sont partagés entre tous les membres que vous invitez.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Vous pouvez suivre l'utilisation des crédits dans le tableau de bord de l'organisation.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Étape 4 */}
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span>Invitation des membres</span>
                  </h3>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Dans votre tableau de bord, vous allez voir un code, généré lors de votre création d'organisation.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Partagez ce code aux membres que vous souhaitez inviter dans votre organisation.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Les utilisateurs créent leur compte grâce à ce code et accèdent automatiquement aux crédits de l'organisation. (De ce fait, ne communiquez votre code d'organisation qu'aux membres que vous souhaitez inviter !)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Étape 5 */}
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <span>Suivi des performances</span>
                  </h3>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Chaque membre voit son historique et ses scores individuels.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>En tant que propriétaire de l'organisation, vous pouvez consulter la progression globale de vos membres dans l'espace "Tableau de bord organisation". Vous aurez donc accès à un tableau récapitulatif de vos membres, avec la possibilité de voir le détail de l'activité de chaque membre.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partie 3 : Rejoindre une organisation */}
        <section id="partie3" className="mb-16">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white font-display">
                    Partie 3 : Pour rejoindre une organisation
                  </h2>
                  <p className="text-green-100 mt-1">
                    Si vous faites partie d'une équipe, entreprise, organisme de formation ou suivez un coach/formateur
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-secondary-700">Rendez-vous sur la page d'inscription : <Link to="/register" className="text-green-600 hover:text-green-800 underline">'Créer mon compte'</Link></span>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-secondary-700">Cochez la case "Rejoindre une organisation".</span>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-secondary-700">Renseignez vos informations et le code fourni par votre organisation.</span>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-secondary-700">Votre compte sera lié automatiquement à l'organisation et vous pourrez utiliser ses crédits partagés.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="bg-primary-50 rounded-xl border border-primary-200 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-lg">
              <Play className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-4 font-display">
            Prêt à commencer ?
          </h3>
          <p className="text-secondary-700 mb-6 leading-relaxed">
            Maintenant que vous savez comment utiliser Ring Academy, lancez-vous dans votre première simulation !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              <span>Créer mon compte</span>
            </Link>
            <Link
              to="/training"
              className="inline-flex items-center space-x-2 border-2 border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              <Play className="h-5 w-5" />
              <span>Zone d'entraînement</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuideUtilisation;