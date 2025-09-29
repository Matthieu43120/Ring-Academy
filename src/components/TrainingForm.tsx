import React, { useState } from 'react';
import { User, Target, Settings, Play, Star, TrendingUp, MessageCircle, Mic, Volume2, ArrowRight, X } from 'lucide-react';
import { TrainingConfig } from '../pages/Training';

interface TrainingFormProps {
  onStartTraining: (config: TrainingConfig) => void;
  hasMicrophonePermission: boolean;
}

function TrainingForm({ onStartTraining, hasMicrophonePermission }: TrainingFormProps) {
  const [target, setTarget] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const targets = [
    { 
      value: 'secretary', 
      label: 'Secrétaire', 
      description: 'Premier contact, filtrage des appels',
      icon: '👩‍💼',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      value: 'hr', 
      label: 'DRH', 
      description: 'Ressources humaines, recrutement',
      icon: '👨‍💼',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      value: 'manager', 
      label: 'Chef d\'entreprise', 
      description: 'Décideur final, plus d\'expérience',
      icon: '🎯',
      color: 'from-primary-500 to-primary-600'
    },
    { 
      value: 'sales', 
      label: 'Commercial', 
      description: 'Connaît les techniques de vente',
      icon: '💼',
      color: 'from-green-500 to-green-600'
    }
  ];

  const difficulties = [
    { 
      value: 'easy', 
      label: 'Facile', 
      description: 'Prospect bienveillant, peu d\'objections',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      icon: '😊'
    },
    { 
      value: 'medium', 
      label: 'Moyen', 
      description: 'Quelques objections, plus de résistance',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      icon: '🤔'
    },
    { 
      value: 'hard', 
      label: 'Difficile', 
      description: 'Nombreuses objections, très résistant',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      icon: '😤'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (target && difficulty) {
      // Vérifier si on doit afficher les instructions
      const hasSeenInstructions = localStorage.getItem('ring_academy_seen_instructions') === 'true';
      
      if (!hasSeenInstructions) {
        setShowInstructions(true);
      } else {
        // Faire remonter la page en haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        onStartTraining({ target, difficulty });
      }
    }
  };

  const handleStartWithInstructions = () => {
    if (dontShowAgain) {
      localStorage.setItem('ring_academy_seen_instructions', 'true');
    }
    setShowInstructions(false);
    
    // Faire remonter la page en haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    onStartTraining({ target, difficulty });
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 bg-primary-600 text-white rounded-lg px-6 py-3 mb-6">
            <Play className="h-5 w-5" />
            <span className="font-semibold">Configuration d'entraînement</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Préparez votre session
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez votre cible et le niveau de difficulté pour une expérience d'entraînement personnalisée
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Target Selection */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-primary-500 p-2 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Type de prospect</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {targets.map((targetOption) => (
                <label
                  key={targetOption.value}
                  className={`group relative flex cursor-pointer rounded-xl border-2 p-6 hover:shadow-lg transition-all duration-300 ${
                    target === targetOption.value
                      ? 'border-primary-500 bg-primary-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-primary-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value={targetOption.value}
                    checked={target === targetOption.value}
                    onChange={(e) => setTarget(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex flex-1 items-center space-x-4">
                    <div className={`rounded-xl p-3 bg-gradient-to-r ${targetOption.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-2xl">{targetOption.icon}</span>
                    </div>
                    <div className="flex-1">
                      <span className={`block text-lg font-bold ${
                        target === targetOption.value ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {targetOption.label}
                      </span>
                      <span className={`block text-sm ${
                        target === targetOption.value ? 'text-primary-700' : 'text-gray-600'
                      }`}>
                        {targetOption.description}
                      </span>
                    </div>
                    {target === targetOption.value && (
                      <div className="text-primary-600">
                        <Star className="h-6 w-6 fill-current" />
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-secondary-600 p-2 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Niveau de difficulté</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {difficulties.map((difficultyOption) => (
                <label
                  key={difficultyOption.value}
                  className={`group relative flex cursor-pointer rounded-xl border-2 p-6 hover:shadow-lg transition-all duration-300 ${
                    difficulty === difficultyOption.value
                      ? 'border-primary-500 bg-primary-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-primary-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={difficultyOption.value}
                    checked={difficulty === difficultyOption.value}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1 text-center">
                    <div className="mb-4">
                      <span className="text-3xl">{difficultyOption.icon}</span>
                    </div>
                    <div className={`inline-flex px-4 py-2 rounded-full text-sm font-bold border mb-3 ${
                      difficulty === difficultyOption.value 
                        ? 'bg-primary-100 text-primary-800 border-primary-200'
                        : `${difficultyOption.bgColor} ${difficultyOption.textColor} ${difficultyOption.borderColor}`
                    }`}>
                      {difficultyOption.label}
                    </div>
                    <p className={`text-sm ${
                      difficulty === difficultyOption.value ? 'text-primary-700' : 'text-gray-600'
                    }`}>
                      {difficultyOption.description}
                    </p>
                    {difficulty === difficultyOption.value && (
                      <div className="mt-3 text-primary-600">
                        <TrendingUp className="h-5 w-5 mx-auto" />
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-6">
            <button
              type="submit"
              disabled={!target || !difficulty || !hasMicrophonePermission}
              className="bg-primary-600 text-white px-12 py-4 rounded-lg font-bold text-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-3 mx-auto"
            >
              <Play className="h-6 w-6" />
              <span>Lancer l'appel</span>
              <Target className="h-6 w-6" />
            </button>
            {(!target || !difficulty || !hasMicrophonePermission) && (
              <p className="text-sm text-gray-500 mt-3">
                {!hasMicrophonePermission 
                  ? 'Autorisation du microphone requise pour continuer'
                  : 'Veuillez sélectionner un type de prospect et un niveau de difficulté'
                }
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Modal d'instructions */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="bg-primary-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Comment fonctionne la simulation ?
              </h2>
              <p className="text-sm text-gray-600">
                Échange tour par tour avec l'IA
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Étape 1 */}
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="bg-blue-500 p-2 rounded-full flex-shrink-0">
                  <Volume2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">L'IA décroche et parle</p>
                  <p className="text-xs text-gray-600">Écoutez attentivement</p>
                </div>
              </div>

              {/* Étape 2 */}

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="bg-green-500 p-2 rounded-full flex-shrink-0">
                  <Mic className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">À votre tour de parler</p>
                  <p className="text-xs text-gray-600">Parlez naturellement</p>
                </div>
              </div>

              {/* Étape 3 */}

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="bg-purple-500 p-2 rounded-full flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Échange tour par tour</p>
                  <p className="text-xs text-gray-600">Attendez que l'IA termine</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                />
                <span>Ne plus afficher ce message</span>
              </label>

              <button
                onClick={handleStartWithInstructions}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>J'ai compris, lancer l'appel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TrainingForm;