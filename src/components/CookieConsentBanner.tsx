import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, CheckCircle, XCircle } from 'lucide-react';

function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const consentStatus = localStorage.getItem('ring_academy_cookie_consent');
    if (!consentStatus) {
      // Afficher le bandeau après un petit délai pour une meilleure UX
      setTimeout(() => {
        setIsVisible(true);
      }, 1000);
    }
  }, []);

  const handleAccept = () => {
    setIsLoading(true);
    localStorage.setItem('ring_academy_cookie_consent', 'accepted');
    
    // Simuler un petit délai pour l'animation
    setTimeout(() => {
      setIsVisible(false);
      setIsLoading(false);
    }, 300);
  };

  const handleReject = () => {
    setIsLoading(true);
    localStorage.setItem('ring_academy_cookie_consent', 'rejected');
    
    // Simuler un petit délai pour l'animation
    setTimeout(() => {
      setIsVisible(false);
      setIsLoading(false);
    }, 300);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-white border-t-2 border-primary-200 shadow-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Icône et contenu */}
            <div className="flex items-start space-x-4 flex-1">
              <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
                <Cookie className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-secondary-900 mb-2 font-display">
                  Gestion des cookies
                </h3>
                <p className="text-secondary-700 text-sm leading-relaxed">
                  Nous utilisons des cookies pour améliorer votre expérience sur Ring Academy. 
                  Certains cookies sont nécessaires au fonctionnement du site, d'autres nous aident 
                  à analyser l'utilisation et à améliorer nos services.{' '}
                  <Link 
                    to="/politique-cookies" 
                    className="text-primary-600 hover:text-primary-700 font-medium underline transition-colors"
                  >
                    En savoir plus sur notre politique des cookies
                  </Link>
                </p>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-neutral-300 text-secondary-700 rounded-lg font-semibold hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="h-4 w-4" />
                <span>Refuser</span>
              </button>
              
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-medium"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Accepter</span>
              </button>

              <button
                onClick={handleClose}
                className="flex items-center justify-center p-3 text-secondary-400 hover:text-secondary-600 transition-colors lg:ml-2"
                title="Fermer temporairement"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;