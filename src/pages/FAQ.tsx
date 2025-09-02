import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Users, CreditCard, Building, Shield, Phone, MessageCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string | string[];
  category: string;
}

function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqData: FAQItem[] = [
    // Généralités
    {
      category: "Généralités",
      question: "Qu'est-ce que Ring Academy ?",
      answer: "Ring Academy est une plateforme d'entraînement à la prospection téléphonique simulée par intelligence artificielle. Notre IA simule vos prospects, permettant aux commerciaux, indépendants, étudiants ou tout autres personnes, de s'entraîner à la prise de rendez-vous et à la gestion des objections dans un environnement sûr et sans pression."
    },
    {
      category: "Généralités",
      question: "À qui s'adresse Ring Academy ?",
      answer: [
        "Ring Academy est destinée à toute personne souhaitant améliorer ses compétences en prospection téléphonique :",
        "• Commerciaux et indépendants souhaitant se former en autonomie",
        "• Entreprises souhaitant entraîner leurs équipes commerciales",
        "• Organismes de formations, formateurs ou coachs indépendants souhaitant proposer un environnement d'entraînement pratique à leurs élèves"
      ]
    },
    {
      category: "Généralités",
      question: "Ring Academy est-elle gratuite ?",
      answer: "La plateforme propose un essai gratuit ainsi qu'un crédit offert lors de la création de compte pour tester les simulations. Ensuite, vous pouvez acheter des packs de crédits ou souscrire à un abonnement pour continuer à vous entraîner."
    },
    // Fonctionnement
    {
      category: "Fonctionnement de la plateforme",
      question: "Comment fonctionne l'IA de Ring Academy ?",
      answer: "L'intelligence artificielle simule un prospect réel. Vous parlez à l'IA à l'oral et elle répond dynamiquement selon vos phrases. Chaque session vise à vous aider à prendre rendez-vous et à gérer les objections."
    },
    {
      category: "Fonctionnement de la plateforme",
      question: "Mes sessions sont-elles enregistrées ?",
      answer: "Non, aucune voix ou conversation n'est stockée. Seules les informations nécessaires au suivi de vos crédits et à l'historique de vos sessions sont conservées dans votre compte."
    },
    {
      category: "Fonctionnement de la plateforme",
      question: "Qu'est-ce qu'une \"session\" ?",
      answer: "Une session correspond à un appel complet avec l'IA, depuis l'introduction jusqu'au débriefing final."
    },
    // Crédits et abonnements
    {
      category: "Crédits et abonnements",
      question: "Comment fonctionnent les crédits ?",
      answer: "Chaque crédit permet de réaliser un certain nombre de sessions (1 crédit = 3 simulations). Les crédits peuvent être achetés via Stripe et sont utilisables dès l'achat."
    },
    {
      category: "Crédits et abonnements",
      question: "Puis-je partager mes crédits avec d'autres utilisateurs ?",
      answer: "Oui, pour cela, vous devez créer une organisation qui vous donnera un code. Ce dernier devra être utilisé pour la création de compte de vos collaborateurs. Les crédits disponibles seront donc partagés entre tous les membres de votre organisation."
    },
    {
      category: "Crédits et abonnements",
      question: "Que se passe-t-il si je n'ai plus de crédits ?",
      answer: "Vous n'aurez plus accès à la simulation. Vous pourrez acheter un nouveau pack de crédits ou attendre votre prochain renouvellement d'abonnement si vous êtes abonné."
    },
    // Organisations
    {
      category: "Organisations",
      question: "Qu'est-ce qu'une organisation sur Ring Academy ?",
      answer: "Une organisation peut être créée par un coach, un formateur ou une entreprise pour gérer plusieurs utilisateurs (apprenants, commerciaux, membres). Les crédits achetés par l'organisation peuvent être utilisés par tous les membres."
    },
    {
      category: "Organisations",
      question: "Comment inviter des membres dans mon organisation ?",
      answer: "En tant que propriétaire de l'organisation, un code vous a été attribué lors de la création de votre organisation. Communiquez ce code aux membres que vous souhaitez inviter dans votre organisation. Ils devront alors se créer un compte à partir de ce code. Les nouveaux membres auront accès aux crédits de l'organisation."
    },
    // Comptes et autonomie
    {
      category: "Comptes et autonomie",
      question: "Puis-je utiliser Ring Academy sans rejoindre une organisation ?",
      answer: "Oui, vous pouvez créer un compte individuel pour vous entraîner en autonomie. Dans ce cas, vous gérez vos propres crédits et sessions."
    },
    {
      category: "Comptes et autonomie",
      question: "Mes données sont-elles sécurisées ?",
      answer: "Oui. Les données de votre compte sont stockées sur Supabase sous notre supervision. Stripe gère en toute sécurité les informations de paiement. Aucune donnée personnelle n'est partagée avec l'IA ou des tiers."
    },
    // Assistance
    {
      category: "Assistance",
      question: "Que faire si j'ai un problème technique ou une question ?",
      answer: "Vous pouvez nous contacter via le formulaire de contact sur le site ou par mail à m.alexander@ringacademy.fr"
    }
  ];

  const categories = [
    { name: "Généralités", icon: HelpCircle, color: "from-blue-500 to-blue-600" },
    { name: "Fonctionnement de la plateforme", icon: Phone, color: "from-green-500 to-green-600" },
    { name: "Crédits et abonnements", icon: CreditCard, color: "from-purple-500 to-purple-600" },
    { name: "Organisations", icon: Building, color: "from-orange-500 to-orange-600" },
    { name: "Comptes et autonomie", icon: Users, color: "from-indigo-500 to-indigo-600" },
    { name: "Assistance", icon: MessageCircle, color: "from-red-500 to-red-600" }
  ];

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? { icon: category.icon, color: category.color } : { icon: HelpCircle, color: "from-gray-500 to-gray-600" };
  };

  const renderAnswer = (answer: string | string[]) => {
    if (Array.isArray(answer)) {
      return (
        <div className="space-y-2">
          {answer.map((line, index) => (
            <p key={index} className="text-gray-700 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      );
    }
    return <p className="text-gray-700 leading-relaxed">{answer}</p>;
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-xl">
              <HelpCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6 font-display">
            FAQ – Ring Academy
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            Bienvenue sur la FAQ de Ring Academy ! Vous trouverez ici toutes les réponses aux questions les plus fréquentes sur l'utilisation de notre plateforme, l'objectif des simulations, les crédits et les organisations.
          </p>
        </div>

        {/* Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const itemCount = faqData.filter(item => item.category === category.name).length;
            
            return (
              <div key={index} className="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 hover:shadow-medium transition-all duration-300">
                <div className="flex items-center space-x-4 mb-3">
                  <div className={`bg-gradient-to-r ${category.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900">{category.name}</h3>
                    <p className="text-sm text-secondary-600">{itemCount} question{itemCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = faqData.filter(item => item.category === category.name);
            const { icon: CategoryIcon, color } = getCategoryIcon(category.name);
            
            return (
              <div key={category.name} className="bg-white rounded-xl shadow-soft border border-neutral-200 overflow-hidden">
                {/* Category Header */}
                <div className={`bg-gradient-to-r ${color} p-6`}>
                  <div className="flex items-center space-x-3">
                    <CategoryIcon className="h-8 w-8 text-white" />
                    <h2 className="text-2xl font-bold text-white font-display">
                      {category.name}
                    </h2>
                  </div>
                </div>

                {/* Category Items */}
                <div className="divide-y divide-neutral-200">
                  {categoryItems.map((item, itemIndex) => {
                    const globalIndex = faqData.indexOf(item);
                    const isOpen = openItems.includes(globalIndex);
                    
                    return (
                      <div key={itemIndex} className="transition-all duration-200">
                        <button
                          onClick={() => toggleItem(globalIndex)}
                          className="w-full px-6 py-6 text-left hover:bg-neutral-50 transition-colors focus:outline-none focus:bg-neutral-50"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-secondary-900 pr-4">
                              {item.question}
                            </h3>
                            <div className="flex-shrink-0">
                              {isOpen ? (
                                <ChevronUp className="h-5 w-5 text-secondary-600" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-secondary-600" />
                              )}
                            </div>
                          </div>
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-6 animate-slide-up">
                            <div className="bg-neutral-50 rounded-lg p-4 border-l-4 border-primary">
                              {renderAnswer(item.answer)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-primary-50 rounded-xl border border-primary-200 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-lg">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-4 font-display">
            Vous ne trouvez pas votre réponse ?
          </h3>
          <p className="text-secondary-700 mb-6 leading-relaxed">
            Notre équipe est là pour vous aider ! N'hésitez pas à nous contacter pour toute question supplémentaire.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Nous contacter</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FAQ;