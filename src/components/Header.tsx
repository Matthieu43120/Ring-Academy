import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, BarChart3, Users, Building, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Safely use auth context with error handling
  let user = null;
  let logout = () => {};
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    logout = authContext.logout;
  } catch (error) {
    console.warn('Header: AuthContext not available yet, using defaults');
  }

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleAccessSpace = () => {
    setShowAuthModal(true);
  };

  const handleCreateSpace = () => {
    navigate('/pricing');
  };

  const handleAuthChoice = (type: 'login' | 'user') => {
    setShowAuthModal(false);
    if (type === 'user') {
      navigate('/register?type=user');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <header className="bg-white shadow-soft border-b border-neutral-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-primary p-2 rounded-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary-900 font-display">
                Ring Academy
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/fonctionnement"
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  isActive('/fonctionnement') ? 'text-primary-600' : 'text-secondary-700'
                }`}
              >
                Fonctionnement
              </Link>
              <Link
                to="/training"
                className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-all duration-300 ${
                  isActive('/training') 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'border-primary-600 text-primary-600 hover:bg-primary-50 hover:border-primary-700 hover:text-primary-700'
                }`}
              >
                Zone d'entraînement
              </Link>
              <Link
                to="/credits"
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  isActive('/credits') ? 'text-primary-600' : 'text-secondary-700'
                }`}
              >
                Crédits
              </Link>
              {user && (
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                    isActive('/dashboard') ? 'text-primary-600' : 'text-secondary-700'
                  }`}
                >
                  Tableau de bord
                </Link>
              )}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-50"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>{user.firstName}</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors px-4 py-2 rounded-lg hover:bg-neutral-50"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-all duration-200 shadow-soft hover:shadow-medium"
                  >
                    Créer mon compte
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-secondary-700 hover:bg-neutral-100 transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-neutral-200 bg-white">
              <nav className="flex flex-col space-y-4">
                <Link
                  to="/fonctionnement"
                  className={`text-sm font-medium transition-colors hover:text-primary-600 px-4 py-2 rounded-lg ${
                    isActive('/fonctionnement') ? 'text-primary-600 bg-primary-50' : 'text-secondary-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Fonctionnement
                </Link>
                <Link
                  to="/training"
                  className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-all duration-300 ${
                    isActive('/training') 
                      ? 'bg-primary-600 text-white border-primary-600' 
                      : 'border-primary-600 text-primary-600 hover:bg-primary-50 hover:border-primary-700 hover:text-primary-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Zone d'entraînement
                </Link>
                <Link
                  to="/credits"
                  className={`text-sm font-medium transition-colors hover:text-primary-600 px-4 py-2 rounded-lg ${
                    isActive('/credits') ? 'text-primary-600 bg-primary-50' : 'text-secondary-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Crédits
                </Link>
                {user && (
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium transition-colors hover:text-primary-600 px-4 py-2 rounded-lg ${
                      isActive('/dashboard') ? 'text-primary-600 bg-primary-50' : 'text-secondary-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tableau de bord
                  </Link>
                )}
                
                <div className="pt-4 border-t border-neutral-200 flex flex-col space-y-4">
                  {user ? (
                    <>
                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors px-4 py-2 rounded-lg hover:bg-neutral-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>{user.firstName}</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors px-4 py-2 rounded-lg hover:bg-neutral-50 text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Déconnexion</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => {
                          setIsMenuOpen(false);
                        }}
                        className="text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors px-4 py-2 rounded-lg hover:bg-neutral-50 text-left"
                      >
                        Se connecter
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => {
                          setIsMenuOpen(false);
                        }}
                        className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors w-fit shadow-soft"
                      >
                        Créer mon compte
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

export default Header;