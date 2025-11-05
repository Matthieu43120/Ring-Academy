import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Zap, Star, Check, Crown, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Credits() {
  const { user, addCredits, addCreditsToOrg, organization } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'packs' | 'subscriptions'>('packs');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const directPacks = [
    {
      credits: 5,
      price: 60,
      popular: false,
      priceId: 'price_1Rng0qLq2s594jkdgvoGFl2Y'
    },
    {
      credits: 10,
      price: 110,
      popular: false,
      priceId: 'price_1S0lUZLq2s594jkdPOvAAN7T'
    },
    {
      credits: 25,
      price: 250,
      popular: true,
      priceId: 'price_1Rng2OLq2s594jkdG5iZHOiY'
    },
    {
      credits: 50,
      price: 450,
      popular: false,
      priceId: 'price_1Rng2xLq2s594jkdBAs1bYA2'
    },
    {
      credits: 75,
      price: 600,
      popular: false,
      priceId: 'price_1Rng3bLq2s594jkduGq0sPPd'
    },
    {
      credits: 100,
      price: 700,
      popular: false,
      priceId: 'price_1Rng46Lq2s594jkda2BDgbG9'
    }
  ];

  const subscriptions = [
    {
      credits: 25,
      price: 200,
      popular: false,
      priceId: 'price_1Rng7ALq2s594jkd9ZaCu3hd'
    },
    {
      credits: 50,
      price: 350,
      popular: true,
      priceId: 'price_1Rng7yLq2s594jkdmTdv6IBk'
    },
    {
      credits: 100,
      price: 600,
      popular: false,
      priceId: 'price_1Rng8qLq2s594jkdj12P5KT4'
    }
  ];

  const handlePurchase = async (type: 'pack' | 'subscription', item: any) => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      // Rediriger vers la création de compte
      navigate('/register');
      return;
    }

    // Vérifier si l'utilisateur est membre d'une organisation (ne peut pas acheter)
    if (user.organizationRole === 'member') {
      alert('Seul le propriétaire de votre organisation peut acheter des crédits.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Préparer les URLs de retour
      const successUrl = `${window.location.origin}/dashboard?payment=success&credits=${item.credits}`;
      const cancelUrl = `${window.location.origin}/credits?payment=cancelled`;

      // Appeler la fonction Edge Supabase pour créer la session Stripe Checkout
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: item.priceId,
          mode: type === 'pack' ? 'payment' : 'subscription',
          credits: item.credits,
          successUrl,
          cancelUrl,
          userId: user.id,
          organizationId: organization?.id || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la session de paiement');
      }

      const { url } = await response.json();
      
      // Ouvrir Stripe Checkout dans un nouvel onglet
      window.open(url, '_blank');
      
    } catch (error) {
      alert('Erreur lors de la création du paiement. Veuillez réessayer.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-slate-600 p-4 rounded-xl">
              <CreditCard className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Packs de Crédits
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            <span className="font-semibold text-slate-700">1 crédit = 3 simulations d'appel IA</span><br />
            Crédits cumulables et sans date limite de validité
          </p>
          {!user && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-blue-800 text-sm">
                <strong>Créez votre compte</strong> pour acheter des crédits et accéder aux simulations
              </p>
            </div>
          )}
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
            <div className="flex">
              <button
                onClick={() => setSelectedTab('packs')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  selectedTab === 'packs'
                    ? 'bg-slate-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="h-5 w-5" />
                <span>Packs Directs</span>
              </button>
              <button
                onClick={() => setSelectedTab('subscriptions')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  selectedTab === 'subscriptions'
                    ? 'bg-slate-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Abonnements</span>
              </button>
            </div>
          </div>
        </div>

        {/* Packs Directs */}
        {selectedTab === 'packs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {directPacks.map((pack, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl border-2 overflow-hidden transition-all duration-300 hover:scale-105 ${
                  pack.popular 
                    ? 'border-slate-500 shadow-2xl' 
                    : 'border-gray-200 hover:border-slate-300'
                }`}
              >
                {pack.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-center py-2 text-sm font-bold">
                    <Star className="h-4 w-4 inline mr-1" />
                    POPULAIRE
                  </div>
                )}

                <div className={`p-8 ${pack.popular ? 'pt-16' : ''}`}>
                  <div className="text-center mb-8">
                    <div className="bg-slate-100 p-4 rounded-xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <CreditCard className="h-10 w-10 text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {pack.credits} Crédits
                    </h3>
                    <p className="text-slate-600 mb-4">
                      {pack.credits * 3} simulations d'appel
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{pack.price}€</span>
                      <span className="text-gray-500 ml-2">TTC</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">{pack.credits * 3} simulations incluses</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Crédits cumulables</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Sans date limite</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Analyses détaillées</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase('pack', pack)}
                    disabled={isProcessingPayment}
                    className={`w-full py-4 px-6 rounded-lg font-semibold transition-colors ${
                      pack.popular
                        ? 'bg-slate-600 text-white hover:bg-slate-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessingPayment ? 'Redirection...' : (user ? 'Acheter maintenant' : 'Créer un compte')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Abonnements */}
        {selectedTab === 'subscriptions' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {subscriptions.map((sub, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl border-2 overflow-hidden transition-all duration-300 hover:scale-105 ${
                  sub.popular 
                    ? 'border-slate-500 shadow-2xl' 
                    : 'border-gray-200 hover:border-slate-300'
                }`}
              >
                {sub.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-center py-2 text-sm font-bold">
                    <Crown className="h-4 w-4 inline mr-1" />
                    RECOMMANDÉ
                  </div>
                )}

                <div className={`p-8 ${sub.popular ? 'pt-16' : ''}`}>
                  <div className="text-center mb-8">
                    <div className="bg-slate-100 p-4 rounded-xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="h-10 w-10 text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {sub.credits} Crédits/mois
                    </h3>
                    <p className="text-slate-600 mb-4">
                      {sub.credits * 3} simulations par mois
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{sub.price}€</span>
                      <span className="text-gray-500 ml-2">/ mois TTC</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">{sub.credits * 3} simulations/mois</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Renouvellement automatique</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Crédits cumulables</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Analyses détaillées</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Résiliation à tout moment</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase('subscription', sub)}
                    disabled={isProcessingPayment}
                    className={`w-full py-4 px-6 rounded-lg font-semibold transition-colors ${
                      sub.popular
                        ? 'bg-slate-600 text-white hover:bg-slate-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessingPayment ? 'Redirection...' : (user ? 'S\'abonner' : 'Créer un compte')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="mt-16 bg-slate-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Comment ça marche ?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-slate-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Achetez vos crédits</h4>
              <p className="text-gray-600">Choisissez le pack qui correspond à vos besoins</p>
            </div>
            <div className="text-center">
              <div className="bg-slate-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Entraînez-vous</h4>
              <p className="text-gray-600">1 crédit = 3 simulations d'appel IA</p>
            </div>
            <div className="text-center">
              <div className="bg-slate-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Progressez</h4>
              <p className="text-gray-600">Analyses détaillées et recommandations personnalisées</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Credits;