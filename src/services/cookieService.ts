// Service pour la gestion du consentement des cookies
export class CookieConsentService {
  private static readonly CONSENT_KEY = 'ring_academy_cookie_consent';
  private static readonly ANALYTICS_KEY = 'ring_academy_analytics_enabled';

  // Vérifier si le consentement a été donné
  static hasConsent(): boolean {
    const consent = localStorage.getItem(this.CONSENT_KEY);
    return consent === 'accepted';
  }

  // Vérifier si le consentement a été refusé
  static hasRejected(): boolean {
    const consent = localStorage.getItem(this.CONSENT_KEY);
    return consent === 'rejected';
  }

  // Vérifier si le consentement n'a pas encore été donné
  static needsConsent(): boolean {
    const consent = localStorage.getItem(this.CONSENT_KEY);
    return !consent;
  }

  // Donner le consentement
  static giveConsent(): void {
    localStorage.setItem(this.CONSENT_KEY, 'accepted');
    localStorage.setItem(this.ANALYTICS_KEY, 'true');
    this.loadAnalyticsScripts();
  }

  // Refuser le consentement
  static rejectConsent(): void {
    localStorage.setItem(this.CONSENT_KEY, 'rejected');
    localStorage.setItem(this.ANALYTICS_KEY, 'false');
    this.removeAnalyticsScripts();
  }

  // Révoquer le consentement (pour permettre à l'utilisateur de changer d'avis)
  static revokeConsent(): void {
    localStorage.removeItem(this.CONSENT_KEY);
    localStorage.removeItem(this.ANALYTICS_KEY);
    this.removeAnalyticsScripts();
  }

  // Charger les scripts d'analyse si le consentement est donné
  private static loadAnalyticsScripts(): void {
    // Exemple pour Google Analytics (à adapter selon vos besoins)
    // if (window.gtag) {
    //   window.gtag('consent', 'update', {
    //     'analytics_storage': 'granted'
    //   });
    // }
    
    console.log('📊 Scripts d\'analyse autorisés et chargés');
  }

  // Supprimer les scripts d'analyse si le consentement est refusé
  private static removeAnalyticsScripts(): void {
    // Exemple pour Google Analytics (à adapter selon vos besoins)
    // if (window.gtag) {
    //   window.gtag('consent', 'update', {
    //     'analytics_storage': 'denied'
    //   });
    // }
    
    console.log('🚫 Scripts d\'analyse désactivés');
  }

  // Initialiser le service au chargement de l'application
  static initialize(): void {
    if (this.hasConsent()) {
      this.loadAnalyticsScripts();
    }
  }
}

// Initialiser le service
if (typeof window !== 'undefined') {
  CookieConsentService.initialize();
}

export default CookieConsentService;