import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle, Eye, EyeOff, Building, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isLoading } = useAuth();
  
  // Récupérer le code organisation depuis l'URL si présent
  const searchParams = new URLSearchParams(location.search);
  const orgCodeFromUrl = searchParams.get('orgCode') || '';
  
  // État pour le type de compte
  const [accountType, setAccountType] = useState<'individual' | 'organization'>(
    orgCodeFromUrl ? 'organization' : 'individual'
  );
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationCode: orgCodeFromUrl
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const validatePassword = (password: string) => {
    const requirements = [
      { test: password.length >= 8, text: 'Au moins 8 caractères' },
      { test: /[A-Z]/.test(password), text: 'Une majuscule' },
      { test: /[a-z]/.test(password), text: 'Une minuscule' },
      { test: /[0-9]/.test(password), text: 'Un chiffre' },
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'Un caractère spécial' }
    ];
    
    return requirements;
  };

  const passwordRequirements = validatePassword(formData.password);
  const isPasswordValid = passwordRequirements.every(req => req.test);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation côté client
    if (!acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsSubmitting(false);
      return;
    }

    if (!isPasswordValid) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité');
      setIsSubmitting(false);
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Adresse email invalide');
      setIsSubmitting(false);
      return;
    }

    // Validation code organisation si nécessaire
    if (accountType === 'organization' && !formData.organizationCode.trim()) {
      setError('Code organisation requis');
      setIsSubmitting(false);
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        organizationCode: accountType === 'organization' ? formData.organizationCode : undefined
      });
      
      // Afficher le message de vérification d'e-mail
      setUserEmail(formData.email);
      setShowEmailVerification(true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Si le message de vérification d'e-mail est affiché
  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="bg-green-600 p-3 rounded-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Vérifiez votre adresse e-mail
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Votre compte a été créé avec succès !
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">
                  📧 E-mail de vérification envoyé
                </h3>
                <p className="text-blue-800 mb-4">
                  Nous avons envoyé un e-mail de vérification à :
                </p>
                <p className="font-bold text-blue-900 text-lg bg-blue-100 rounded-lg p-3">
                  {userEmail}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Cliquez sur le lien dans l'e-mail</strong> pour vérifier votre adresse et accéder à votre compte.
                </p>
                <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  💡 <strong>Astuce :</strong> Vérifiez vos dossiers <strong>spam</strong> ou <strong>promotions</strong> 
                  si vous ne recevez pas l'e-mail dans votre boîte de réception principale.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Vous n'avez pas reçu l'e-mail ?
                </p>
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => {
                      setShowEmailVerification(false);
                      setFormData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        password: '',
                        confirmPassword: '',
                        organizationCode: orgCodeFromUrl
                      });
                      setUserEmail('');
                    }}
                    className="text-slate-600 hover:text-slate-700 font-medium underline transition-colors"
                  >
                    Modifier mon adresse e-mail
                  </button>
                  <Link
                    to="/contact"
                    className="text-slate-600 hover:text-slate-700 font-medium underline transition-colors"
                  >
                    Contacter le support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-slate-600 p-3 rounded-lg">
              <Phone className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Créer votre compte
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Rejoignez Ring Academy pour améliorer vos compétences commerciales
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-slate-600 hover:text-slate-500 transition-colors"
            >
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Sélecteur de type de compte */}
          {!orgCodeFromUrl && (
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 rounded-lg p-1 flex">
                  <button
                    type="button"
                    onClick={() => setAccountType('individual')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                      accountType === 'individual'
                        ? 'bg-slate-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Compte individuel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('organization')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                      accountType === 'organization'
                        ? 'bg-slate-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Rejoindre une organisation</span>
                  </button>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">
                {accountType === 'individual' 
                  ? 'Créez votre compte personnel avec 1 crédit gratuit'
                  : 'Rejoignez une organisation existante avec un code'
                }
              </p>
            </div>
          )}

          {orgCodeFromUrl && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Vous rejoignez une organisation avec le code: <strong>{orgCodeFromUrl}</strong>
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  <User className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="Nom"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  <User className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  placeholder="06 12 34 56 78"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {accountType === 'organization' && (
              <div>
                <label htmlFor="organizationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Code organisation
                </label>
                <div className="relative">
                  <input
                    id="organizationCode"
                    name="organizationCode"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="Code fourni par votre organisation"
                    value={formData.organizationCode}
                    onChange={handleChange}
                  />
                  <Building className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                />
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Critères de sécurité :</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {req.test ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                      )}
                      <span className={`text-sm ${req.test ? 'text-green-600' : 'text-gray-500'}`}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  placeholder="Confirmer le mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-3 block text-sm text-gray-900">
                J'accepte les{' '}
                <Link to="/conditions-generales" className="text-slate-600 hover:text-slate-500 font-medium underline transition-colors">
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link to="/politique-confidentialite" className="text-slate-600 hover:text-slate-500 font-medium underline transition-colors">
                  politique de confidentialité
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !isPasswordValid || !acceptTerms}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link
              to="/login"
              className="font-medium text-slate-600 hover:text-slate-500 transition-colors"
            >
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;