import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, GraduationCap, Building2, CheckCircle, Play, Bot, Zap, Target, TrendingUp } from 'lucide-react';

function Home() {
  return (
    <div className="animate-fade-in bg-neutral-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-900/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white font-display">
              Ring Academy
            </h1>
            <p className="text-xl md:text-2xl mb-4 font-medium text-neutral-200">
              Plateforme d'entraînement à la prospection téléphonique
            </p>
            <p className="text-lg mb-8 text-neutral-300 max-w-4xl mx-auto leading-relaxed">
              <span className="font-semibold text-accent-400">Notre IA simule vos prospects</span> - Échangez avec elle comme lors d'un vrai appel téléphonique.
              Perfectionnez vos techniques commerciales et développez votre confiance sans conséquences.
              <br />
              <Link to="/fonctionnement" className="text-accent-400 hover:text-accent-300 underline transition-colors font-medium">
                Découvrez le fonctionnement en cliquant ici
              </Link>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link
                to="/training"
                className="bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-strong hover:shadow-medium hover:scale-105"
              >
                <Play className="h-6 w-6" />
                <span>Zone d'entraînement</span>
              </Link>
              <Link
                to="/credits"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105"
              >
                <span>Recharger mes crédits</span>
                <ArrowRight className="h-6 w-6" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Bot className="h-8 w-8 text-accent-400" />
                  <span className="text-3xl font-bold text-white">IA</span>
                </div>
                <div className="text-neutral-300">Conversationnelle</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-neutral-300">Disponible</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Profiles Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 mb-6 font-display">
              Choisissez votre profil
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Ring Academy s'adapte à votre situation professionnelle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Indépendants */}
            <Link
              to="/fonctionnement"
              className="group bg-white rounded-2xl p-8 shadow-soft border border-neutral-200 hover:border-primary-300 hover:shadow-medium transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="bg-secondary-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                  <Users className="h-10 w-10 text-secondary-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-secondary-900 font-display">Indépendant</h3>
                <p className="text-sm font-medium text-secondary-600 mb-4">Formule individuelle</p>
                <p className="text-secondary-600 mb-6 leading-relaxed">
                  Perfectionnez vos techniques commerciales en autonomie. 
                  Accès illimité aux simulations et feedback IA personnalisé.
                </p>
                <div className="text-secondary-600 font-semibold group-hover:text-primary-600 transition-colors">
                  Découvrir →
                </div>
              </div>
            </Link>

            {/* Coachs / Formateurs */}
            <Link
              to="/fonctionnement"
              className="group bg-white rounded-2xl p-8 shadow-soft border border-neutral-200 hover:border-accent-300 hover:shadow-medium transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="bg-accent-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                  <GraduationCap className="h-10 w-10 text-accent-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-secondary-900 font-display">Coach, formateur</h3>
                <p className="text-sm font-medium text-accent-600 mb-4">Suivi d'élèves</p>
                <p className="text-secondary-600 mb-6 leading-relaxed">
                  Proposez à vos élèves / apprenants un exercice pratique d'entraînement à la prospection téléphonique.
                  Suivez vos élèves individuellement. Détection automatique 
                  des points faibles et recommandations personnalisées.
                </p>
                <div className="text-accent-600 font-semibold group-hover:text-primary-600 transition-colors">
                  Découvrir →
                </div>
              </div>
            </Link>

            {/* Entreprises */}
            <Link
              to="/fonctionnement"
              className="group bg-white rounded-2xl p-8 shadow-soft border border-neutral-200 hover:border-primary-300 hover:shadow-medium transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="bg-secondary-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                  <Building2 className="h-10 w-10 text-secondary-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-secondary-900 font-display">Entreprises, organisme de formation</h3>
                <p className="text-sm font-medium text-secondary-600 mb-4">Formez vos équipes à grande échelle</p>
                <p className="text-secondary-600 mb-6 leading-relaxed">
                  Coachez vos équipes. Formez vos nouvelles recrues. Entraînez vos commerciaux à un nouveau script.
                  Tableaux de bord managériaux et suivi collectif.
                </p>
                <div className="text-secondary-600 font-semibold group-hover:text-primary-600 transition-colors">
                  Découvrir →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 mb-6 font-display">
              Pourquoi choisir Ring Academy ?
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
             Une approche innovante pour développer vos compétences commerciales.{' '}
             <Link to="/a-propos" className="text-primary-600 hover:text-primary-700 font-semibold underline transition-colors">
               Découvrez l'histoire et la vision derrière Ring Academy.
             </Link>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105">
              <div className="bg-primary-100 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-secondary-900 font-display">IA Conversationnelle</h3>
              <p className="text-secondary-600 leading-relaxed">
                Simulations réalistes avec différents profils de prospects 
                pour un entraînement progressif et adapté.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105">
              <div className="bg-accent-100 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Target className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-secondary-900 font-display">Feedback Personnalisé</h3>
              <p className="text-secondary-600 leading-relaxed">
                Analyses détaillées de vos performances avec conseils 
                personnalisés pour progresser rapidement.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105">
              <div className="bg-secondary-100 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-secondary-900 font-display">Suivi d'Équipe</h3>
              <p className="text-secondary-600 leading-relaxed">
                Tableaux de bord managériaux pour suivre les progrès 
                de vos équipes et identifier les priorités.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6 font-display">
            Prêt à développer vos compétences ?
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/training"
              className="bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all duration-300 inline-flex items-center justify-center space-x-3 shadow-strong hover:shadow-medium hover:scale-105"
            >
              <Play className="h-6 w-6" />
              <span>Accéder à la zone d'entraînement</span>
            </Link>
            
            <Link
              to="/credits"
              className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center space-x-3 hover:scale-105"
            >
              <span>Recharger mes crédits</span>
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;