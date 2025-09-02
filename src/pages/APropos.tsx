import React from 'react';
import { User, Target, Lightbulb, Users, GraduationCap, Building2 } from 'lucide-react';

function APropos() {
  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-xl">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6 font-display">
            À propos – Ring Academy
          </h1>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12 mb-12">
          <div className="prose prose-lg max-w-none text-secondary-700 leading-relaxed">
            <p className="text-xl mb-6 text-center font-medium text-secondary-800">
              Ring Academy est née d'un constat simple : on ne devient pas un bon commercial en lisant un manuel.
            </p>
            <p className="text-lg mb-4">
              Il faut pratiquer. Tester. Se tromper. Recommencer… jusqu'à être prêt, puis sans cesse progresser.
            </p>
            <p className="text-lg">
              Ici, vous vous entraînez comme dans un ring — mais sans coups, sans stress, et avec un seul objectif : votre progression.
            </p>
          </div>
        </div>

        {/* Qui suis-je */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold text-white font-display">
                Qui suis-je ?
              </h2>
            </div>
          </div>
          <div className="p-8">
            <div className="prose prose-lg max-w-none text-secondary-700 leading-relaxed">
              <p className="mb-4">
                Je suis <strong>Matthieu ALEXANDER</strong>, j'ai 5 ans d'expérience en tant que commercial dans différents secteurs d'activités et auprès de publics variés, aussi bien professionnels que particuliers.
              </p>
              <p>
                Aujourd'hui, j'accompagne les entreprises dans leur développement commercial, avec un objectif clair : leur fournir des rendez-vous qualifiés grâce à la prospection téléphonique.
              </p>
            </div>
          </div>
        </div>

        {/* Pourquoi Ring Academy */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
            <div className="flex items-center space-x-3">
              <Lightbulb className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold text-white font-display">
                Pourquoi Ring Academy ?
              </h2>
            </div>
          </div>
          <div className="p-8">
            <div className="prose prose-lg max-w-none text-secondary-700 leading-relaxed space-y-4">
              <p>
                De formation commerciale, j'ai rapidement constaté une réalité : pendant mes études, la prospection, y compris téléphonique, n'était abordée que sous un angle théorique. Aucune mise en pratique réelle.
              </p>
              <p>
                Alors, lorsque l'on arrive dans une entreprise et qu'on doit décrocher son téléphone pour prospecter, c'est souvent un choc. On se retrouve confronté à une situation nouvelle, parfois effrayante.
              </p>
              <p>
                Au fil de mes expériences, j'ai observé que cette appréhension était largement partagée :
              </p>
              <ul className="space-y-2 ml-6">
                <li>Chez les commerciaux débutants, pour qui la prospection téléphonique peut être un véritable frein.</li>
                <li>Chez les indépendants, pour qui la prospection est essentielle, mais qui n'avaient jamais osé passer un appel commercial par peur de déranger ou de ne pas trouver leurs mots.</li>
                <li>Même dans certaines grandes écoles de commerce, aucun exercice concret ne permet de se confronter réellement à ce volet de la prospection.</li>
              </ul>
              <p>
                Résultat : une fois sur le terrain, beaucoup se retrouvent sans entraînement, ce qui rend la tâche plus difficile et stressante.
              </p>
              <div className="bg-primary-50 rounded-xl p-6 border border-primary-200 mt-6">
                <p className="font-semibold text-primary-800">
                  Ring Academy est née pour combler ce manque : offrir un véritable terrain d'entraînement, réaliste et sans conséquence, pour se préparer avant d'affronter le "vrai" marché.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ce que fait Ring Academy */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold text-white font-display">
                Ce que fait Ring Academy
              </h2>
            </div>
          </div>
          <div className="p-8">
            <div className="prose prose-lg max-w-none text-secondary-700 leading-relaxed space-y-4">
              <p>
                Ring Academy permet de s'exercer à la prospection téléphonique sans risque, sans pression et avec le droit à l'erreur.
              </p>
              <p>
                Grâce à l'intelligence artificielle, la plateforme simule des prospects réalistes : ils répondent, posent des objections, réagissent à vos arguments… comme lors d'un véritable appel.
              </p>
            </div>
          </div>
        </div>

        {/* Ring Academy s'adresse aux */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold text-white font-display">
                Ring Academy s'adresse aux
              </h2>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {/* Indépendants */}
              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="bg-blue-500 p-2 rounded-lg mt-1">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-secondary-900 mb-2">Indépendants</h3>
                  <p className="text-secondary-700">
                    Pour travailler leur script et leurs réponses aux objections, perfectionner leur discours et gagner en assurance.
                  </p>
                </div>
              </div>

              {/* Organismes de formation */}
              <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="bg-purple-500 p-2 rounded-lg mt-1">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-secondary-900 mb-2">Organismes de formation, écoles, coachs et formateurs</h3>
                  <p className="text-secondary-700">
                    Pour enfin proposer un exercice pratique et réaliste de prospection téléphonique, assurer un suivi des progrès et offrir à leurs apprenants une expérience unique qui les différencie des autres formations.
                  </p>
                </div>
              </div>

              {/* Entreprises */}
              <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="bg-green-500 p-2 rounded-lg mt-1">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-secondary-900 mb-2">Entreprises</h3>
                  <p className="text-secondary-700">
                    Pour former / coacher une équipe commerciale déjà en place, perfectionner les techniques avant une vraie session de phoning, former les nouveaux arrivants, s'entraîner à un nouveau script, ou encore former ou coacher à grande échelle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* L'origine du nom */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold text-white font-display">
                L'origine du nom
              </h2>
            </div>
          </div>
          <div className="p-8">
            <div className="prose prose-lg max-w-none text-secondary-700 leading-relaxed space-y-4">
              <p>
                Le nom <strong>Ring Academy</strong> vient de l'image du ring, un espace d'entraînement où l'on affine ses techniques, où l'on se prépare mentalement et techniquement avant de se lancer en conditions réelles.
              </p>
              <p>
                Ici, le ring n'est pas un lieu d'affrontement, mais un espace sécurisé pour pratiquer, progresser et gagner en confiance.
              </p>
              <p>
                Le prospect n'est pas un ennemi, mais un interlocuteur à comprendre et à aider. L'objectif est d'apporter des solutions concrètes à ses besoins, et Ring Academy est l'endroit où l'on se prépare à le faire de la meilleure façon possible.
              </p>
              <p>
                <strong>Academy</strong> reflète la dimension formation et progression : chaque simulation est une opportunité de progresser, étape par étape.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default APropos;