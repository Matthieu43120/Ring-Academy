import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, HelpCircle, MessageCircle } from 'lucide-react';

function Contact() {
  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-xl">
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6 font-display">
            Contact – Ring Academy
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            Vous avez des questions ou besoin d'assistance ?
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12 mb-8">
          <div className="text-center space-y-8">
            {/* FAQ Section */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-8">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <HelpCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4 font-display">
                Consultez d'abord notre FAQ
              </h2>
              <p className="text-secondary-700 mb-6 text-lg leading-relaxed">
                Trouvez rapidement des réponses aux questions les plus fréquentes.
              </p>
              <Link
                to="/faq"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <HelpCircle className="h-5 w-5" />
                <span>Consulter la FAQ</span>
              </Link>
            </div>

            {/* Email Contact Section */}
            <div className="bg-primary-50 rounded-xl border border-primary-200 p-8">
              <div className="flex justify-center mb-4">
                <div className="bg-primary p-3 rounded-lg">
                  <Mail className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4 font-display">
                Contact direct
              </h2>
              <p className="text-secondary-700 mb-6 text-lg leading-relaxed">
                Si vous ne trouvez pas la réponse, n'hésitez pas à nous contacter directement par email à :
              </p>
              <div className="bg-white rounded-lg p-6 border border-primary-300 mb-6">
                <a
                  href="mailto:m.alexander@ringacademy.fr"
                  className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center justify-center space-x-3"
                >
                  <Mail className="h-6 w-6" />
                  <span>m.alexander@ringacademy.fr</span>
                </a>
              </div>
              <p className="text-secondary-600 text-sm">
                Nous nous efforcerons de vous répondre dans les plus brefs délais.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/guide-utilisation"
            className="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 hover:shadow-medium transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <HelpCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-900">Guide d'utilisation</h3>
                <p className="text-sm text-secondary-600">Apprenez à utiliser Ring Academy</p>
              </div>
            </div>
          </Link>

          <Link
            to="/fonctionnement"
            className="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 hover:shadow-medium transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-900">Comment ça marche</h3>
                <p className="text-sm text-secondary-600">Découvrez le fonctionnement</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Contact;