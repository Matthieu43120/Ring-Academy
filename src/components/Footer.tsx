import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-secondary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold font-display">Ring Academy</span>
            </div>
            <p className="text-neutral-300 mb-4 max-w-md">
              La première plateforme d'entraînement à la prospection téléphonique. 
              Développez vos compétences commerciales avec notre IA conversationnelle.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-sm text-neutral-300">
                <Mail className="h-4 w-4" />
                <span>malexander@ringacademy.fr</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-display">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-neutral-300 hover:text-white transition-colors">
                  Accueil
                </a>
              </li>
              <li>
                <a href="/fonctionnement" className="text-neutral-300 hover:text-white transition-colors">
                  Fonctionnement
                </a>
              </li>
              <li>
                <a href="/training" className="text-neutral-300 hover:text-white transition-colors">
                  Zone d'entraînement
                </a>
              </li>
              <li>
                <a href="/credits" className="text-neutral-300 hover:text-white transition-colors">
                  Crédits
                </a>
              </li>
              <li>
                <Link to="/login" className="text-neutral-300 hover:text-white transition-colors">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-neutral-300 hover:text-white transition-colors">
                  Créer mon compte
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-display">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-neutral-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/guide-utilisation" className="text-neutral-300 hover:text-white transition-colors">
                  Guide d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-neutral-300 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-neutral-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-400 text-sm">
              © 2024 Ring Academy. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/politique-confidentialite" className="text-neutral-400 hover:text-white transition-colors text-sm">
                Politique de confidentialité
              </Link>
              <Link to="/conditions-generales" className="text-neutral-400 hover:text-white transition-colors text-sm">
                Conditions d'utilisation
              </Link>
              <Link to="/politique-cookies" className="text-neutral-400 hover:text-white transition-colors text-sm">
                Cookies
              </Link>
              <Link to="/mentions-legales" className="text-neutral-400 hover:text-white transition-colors text-sm">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;