import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  TrendingUp,
  Clock,
  Award,
  BarChart3,
  Play,
  CreditCard,
  Plus,
  Building,
  Copy,
  UserPlus,
  Settings,
  Trash2,
  ArrowLeft,
  Target,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Download
} from 'lucide-react';
import DashboardInsights from '../components/DashboardInsights';
import { analyzeUserSessions } from '../services/sessionAnalytics';
import { cleanAnalyseGenerale } from '../utils/analysisParser';
import { generatePersonalDashboardPDF, generateOrganizationOverviewPDF, generateMemberPDF } from '../services/pdfExportService';

// Définir les interfaces pour les données de l'organisation
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  credits: number;
  simulationsLeft: number;
  organizationId: string | null;
  organizationRole: 'owner' | 'member' | null;
}

interface SessionRecord {
  id: string;
  userId: string;
  target: string;
  difficulty: string;
  score: number;
  duration: number;
  feedback: string[];
  recommendations: string[];
  improvements: string[];
  detailedAnalysis: string | null;
  date: string;
}

function Dashboard() {
  const { user, organization, sessions, getCreditsInfo, createOrg, getOrgMembers, removeMember, getOrgSessions, isLoading } = useAuth();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgCreated, setOrgCreated] = useState(false);
  const [currentView, setCurrentView] = useState<'personal' | 'organization'>('personal');
  const [organizationView, setOrganizationView] = useState<'members' | 'overview'>('members');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<any | null>(null);
  const [showPersonalSessions, setShowPersonalSessions] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [memberSelectedDifficulty, setMemberSelectedDifficulty] = useState<string>('all');
  const [orgOverviewDifficulty, setOrgOverviewDifficulty] = useState<string>('all');

  // NOUVEAUX ÉTATS pour les données de l'organisation
  const [orgMembersState, setOrgMembersState] = useState<UserProfile[]>([]);
  const [orgSessionsState, setOrgSessionsState] = useState<SessionRecord[]>([]);
  const [isOrgDataLoading, setIsOrgDataLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const creditsInfo = getCreditsInfo();

  const personalAnalytics = React.useMemo(() => {
    return analyzeUserSessions(sessions, selectedDifficulty);
  }, [sessions, selectedDifficulty]);

  // Analytics agrégés pour toute l'organisation
  const organizationAnalytics = React.useMemo(() => {
    if (organizationView === 'overview' && orgSessionsState.length > 0) {
      return analyzeUserSessions(orgSessionsState, orgOverviewDifficulty);
    }
    return {
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      progressionTrend: { current: 0, previous: 0, trend: 'stable' as const, percentage: 0 },
      recurringImprovements: [],
      recurringStrengths: [],
      topRecommendation: "Pas encore de données disponibles.",
      hasEnoughData: false
    };
  }, [organizationView, orgSessionsState, orgOverviewDifficulty]);

  // NOUVEAU useEffect pour charger les données de l'organisation
  React.useEffect(() => {
    const fetchOrgData = async () => {
      if (user && organization && user.organizationRole === 'owner' && currentView === 'organization') {
        setIsOrgDataLoading(true);
        try {
          const members = await getOrgMembers();
          const sessions = await getOrgSessions();
          setOrgMembersState(members);
          setOrgSessionsState(sessions);
        } catch (error) {
          console.error('Erreur lors du chargement des données de l\'organisation:', error);
          setOrgMembersState([]);
          setOrgSessionsState([]);
        } finally {
          setIsOrgDataLoading(false);
        }
      } else {
        setOrgMembersState([]);
        setOrgSessionsState([]);
      }
    };

    fetchOrgData();
  }, [user, organization, currentView, getOrgMembers, getOrgSessions]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsCreatingOrg(true);
    try {
      await createOrg(orgName.trim());
      setOrgCreated(true);
      setShowCreateOrg(false);
      setOrgName('');
    } catch (error) {
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre de l\'organisation ?')) {
      try {
        await removeMember(userId);
        // Recharger les données de l'organisation après suppression
        if (user && organization && user.organizationRole === 'owner') {
          const members = await getOrgMembers();
          const sessions = await getOrgSessions();
          setOrgMembersState(members);
          setOrgSessionsState(sessions);
        }
      } catch (error) {
      }
    }
  };

  const copyOrgCode = () => {
    if (organization) {
      navigator.clipboard.writeText(organization.code);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Utiliser orgSessionsState
  const getMemberSessions = (memberId: string) => {
    return orgSessionsState.filter(session => session.userId === memberId);
  };

  // Utiliser orgMembersState et orgSessionsState
  const getOrganizationStats = () => {
    const totalSessions = orgSessionsState.length;
    const averageScore = totalSessions > 0 
      ? Math.round(orgSessionsState.reduce((sum, session) => sum + session.score, 0) / totalSessions)
      : 0;
    
    return {
      totalSessions,
      averageScore,
      totalMembers: orgMembersState.length
    };
  };

  const handleSessionClick = (session: any) => {
    setSelectedSessionDetail(session);
  };

  const handleBackToSessions = () => {
    setSelectedSessionDetail(null);
  };

  const handleDownloadPersonalPDF = async () => {
    if (!user) return;

    setIsGeneratingPDF(true);
    try {
      generatePersonalDashboardPDF(user, sessions, personalAnalytics, selectedDifficulty);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadOrganizationPDF = async () => {
    if (!organization) return;

    setIsGeneratingPDF(true);
    try {
      generateOrganizationOverviewPDF(
        organization.name,
        orgMembersState,
        orgSessionsState,
        organizationAnalytics,
        orgOverviewDifficulty
      );
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadMemberPDF = async (memberId: string) => {
    if (!organization) return;

    const member = orgMembersState.find(m => m.id === memberId);
    if (!member) return;

    const memberSessions = getMemberSessions(memberId);
    const memberAnalytics = analyzeUserSessions(memberSessions, memberSelectedDifficulty);

    setIsGeneratingPDF(true);
    try {
      generateMemberPDF(
        member,
        organization.name,
        memberSessions,
        memberAnalytics,
        memberSelectedDifficulty
      );
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Helper function to extract and format the general analysis
  const getGeneralAnalysis = (detailedAnalysis: any): string => {
    if (!detailedAnalysis) {
      return 'Analyse non disponible pour cette session.';
    }

    // If it's already a string, try to parse it
    if (typeof detailedAnalysis === 'string') {
      try {
        const parsed = JSON.parse(detailedAnalysis);
        if (parsed.analyse_generale) {
          return cleanAnalyseGenerale(parsed.analyse_generale);
        }
        // If it's a string without JSON structure, return it directly
        return cleanAnalyseGenerale(detailedAnalysis);
      } catch (e) {
        // Not JSON, return as is (cleaned)
        return cleanAnalyseGenerale(detailedAnalysis);
      }
    }

    // If it's an object with analyse_generale
    if (typeof detailedAnalysis === 'object' && detailedAnalysis.analyse_generale) {
      return cleanAnalyseGenerale(detailedAnalysis.analyse_generale);
    }

    // Fallback: try to extract something meaningful
    return 'Analyse détaillée disponible.';
  };

  // Gestion de l'état de chargement
  if (isLoading || isOrgDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-slate-600 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chargement de votre tableau de bord...</h1>
          <p className="text-gray-600">Récupération de vos données en cours</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <Link to="/login" className="text-slate-600 hover:text-slate-500">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const orgStats = organization ? getOrganizationStats() : null;

  // Si une session est sélectionnée pour voir les détails
  if (selectedSessionDetail) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header avec bouton retour */}
          <div className="mb-8">
            <button
              onClick={handleBackToSessions}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour aux sessions</span>
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Détails de la session
            </h1>
            <p className="text-gray-600">
              Session du {formatDate(selectedSessionDetail.date)}
            </p>
          </div>

          {/* Informations de la session */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Prospect</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {selectedSessionDetail.target === 'secretary' ? 'Secrétaire' :
                   selectedSessionDetail.target === 'hr' ? 'DRH' :
                   selectedSessionDetail.target === 'manager' ? 'Manager' : 'Commercial'}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-yellow-100 p-3 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Settings className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Difficulté</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedSessionDetail.difficulty === 'easy' ? 'Facile' :
                   selectedSessionDetail.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Score</p>
                <p className="text-lg font-bold text-gray-900">{selectedSessionDetail.score}/100</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Durée</p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.floor(selectedSessionDetail.duration / 60)}min {selectedSessionDetail.duration % 60}s
                </p>
              </div>
            </div>
          </div>

          {/* Analyse détaillée */}
          {selectedSessionDetail.detailedAnalysis && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <span>Analyse détaillée</span>
              </h2>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
                <div className="text-gray-800 leading-relaxed text-base space-y-3">
                  {getGeneralAnalysis(selectedSessionDetail.detailedAnalysis).split('\n\n').map((paragraph, index) => {
                    const lines = paragraph.split('\n');
                    const hasListItems = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'));

                    if (hasListItems) {
                      return (
                        <div key={index} className="mb-3">
                          {lines.map((line, lineIndex) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                              return (
                                <div key={lineIndex} className="flex items-start space-x-2 mb-2 ml-4">
                                  <span className="text-blue-600 font-bold mt-1">•</span>
                                  <span className="flex-1">{trimmed.substring(1).trim()}</span>
                                </div>
                              );
                            } else if (trimmed) {
                              return (
                                <div key={lineIndex} className="font-semibold text-gray-900 mb-2">
                                  {trimmed}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      );
                    } else {
                      return (
                        <p key={index} className="mb-3">
                          {paragraph}
                        </p>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Points positifs */}
          {selectedSessionDetail.feedback && selectedSessionDetail.feedback.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <span>Points positifs</span>
              </h2>
              <div className="space-y-4">
                {selectedSessionDetail.feedback.map((item: string, index: number) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="bg-green-500 p-2 rounded-full mt-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-gray-800 font-medium flex-1">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Axes d'amélioration */}
          {selectedSessionDetail.improvements && selectedSessionDetail.improvements.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <span>Axes d'amélioration</span>
              </h2>
              <div className="space-y-4">
                {selectedSessionDetail.improvements.map((item: string, index: number) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="bg-orange-500 p-2 rounded-full mt-1">
                      <XCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-gray-800 font-medium flex-1">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {selectedSessionDetail.recommendations && selectedSessionDetail.recommendations.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="bg-primary-500 p-2 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <span>Recommandations</span>
              </h2>
              <div className="space-y-4">
                {selectedSessionDetail.recommendations.map((item: string, index: number) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="bg-blue-500 p-2 rounded-full mt-1">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-gray-800 font-medium flex-1">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="text-center">
            <button
              onClick={handleBackToSessions}
              className="bg-slate-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors inline-flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour aux sessions</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentView === 'personal' ? 'Mon tableau de bord' : 'Tableau de bord organisation'}
              </h1>
              <p className="text-gray-600 mt-2">
                {currentView === 'personal' 
                  ? `Bienvenue ${user.firstName} ${user.lastName}`
                  : `Organisation: ${organization?.name}`
                }
              </p>
              {organization && user.organizationRole === 'owner' && (
                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={() => setCurrentView('personal')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === 'personal'
                        ? 'bg-slate-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Vue personnelle
                  </button>
                  <button
                    onClick={() => setCurrentView('organization')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === 'organization'
                        ? 'bg-slate-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Vue organisation
                  </button>
                </div>
              )}
            </div>
            <Link
              to="/training"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Nouvelle simulation</span>
            </Link>
          </div>
        </div>

        {/* Message de succès création organisation */}
        {orgCreated && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  Organisation créée avec succès !
                </h3>
                <p className="text-green-800">
                  Votre organisation a été créée. Partagez le code avec vos collaborateurs pour qu'ils puissent rejoindre.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'personal' ? (
          <>
            {/* Crédits personnels ou organisation */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {organization ? 'Crédits de l\'organisation' : 'Crédits disponibles'}
                    </h3>
                    <p className="text-gray-600">
                      {creditsInfo.credits} crédits • {creditsInfo.simulationsLeft} simulations restantes
                    </p>
                    {organization && (
                      <p className="text-sm text-gray-500">
                        {user.organizationRole === 'member' 
                          ? 'Crédits partagés avec votre organisation' 
                          : 'Crédits de votre organisation'
                        }
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {(user.organizationRole !== 'member') && (
                    <Link
                      to="/credits"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Recharger</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Organisation */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Building className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Organisation</h3>
                </div>
              </div>

              {organization ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{organization.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.organizationRole === 'owner' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.organizationRole === 'owner' ? 'Propriétaire' : 'Membre'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Code: </span>
                      <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">
                        {organization.code}
                      </code>
                      <button
                        onClick={copyOrgCode}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copier le code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune organisation</h4>
                  <p className="text-gray-600 mb-6">
                    Créez une organisation pour partager des crédits avec votre équipe
                  </p>
                  <button
                    onClick={() => setShowCreateOrg(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Créer une organisation</span>
                  </button>
                </div>
              )}
            </div>

            {/* Stats utilisateur */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sessions totales</p>
                    <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Score moyen</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sessions.length > 0 
                        ? Math.round(sessions.reduce((sum, session) => sum + session.score, 0) / sessions.length)
                        : 0
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Meilleur score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sessions.length > 0 ? Math.max(...sessions.map(s => s.score)) : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de téléchargement PDF */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Download className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Exporter mes données</h3>
                    <p className="text-sm text-gray-600">Téléchargez un rapport PDF complet de vos performances</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadPersonalPDF}
                  disabled={isGeneratingPDF || sessions.length === 0}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={sessions.length === 0 ? 'Aucune session à exporter' : 'Télécharger le rapport PDF'}
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      <span>Télécharger PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Insights et analyses */}
            <div className="mb-8">
              <DashboardInsights
                analytics={personalAnalytics}
                selectedDifficulty={selectedDifficulty}
                onDifficultyChange={setSelectedDifficulty}
              />
            </div>

            {/* Historique des sessions personnelles */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Mes sessions</h2>
                  {sessions.length > 0 && (
                    <button
                      onClick={() => setShowPersonalSessions(!showPersonalSessions)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        {showPersonalSessions ? 'Masquer' : 'Afficher'} ({sessions.length})
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                        showPersonalSessions ? 'rotate-180' : ''
                      }`} />
                    </button>
                  )}
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="p-12 text-center">
                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune session</h3>
                  <p className="text-gray-600 mb-4">
                    Commencez votre première simulation pour voir vos progrès ici.
                  </p>
                  <Link
                    to="/training"
                    className="bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors inline-flex items-center space-x-2"
                  >
                    <Play className="h-5 w-5" />
                    <span>Commencer</span>
                  </Link>
                </div>
              ) : !showPersonalSessions ? (
                <div className="p-8 text-center">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">
                      <span className="font-semibold">{sessions.length}</span> session{sessions.length > 1 ? 's' : ''} enregistrée{sessions.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      Cliquez sur "Afficher" pour voir le détail de vos sessions
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prospect
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Difficulté
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durée
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.slice().reverse().map((session) => (
                        <tr 
                          key={session.id} 
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleSessionClick(session)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(session.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {session.target === 'secretary' ? 'Secrétaire' :
                             session.target === 'hr' ? 'DRH' :
                             session.target === 'manager' ? 'Manager' : 'Commercial'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              session.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {session.difficulty === 'easy' ? 'Facile' :
                               session.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(session.score)}`}>
                              {session.score}/100
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Math.floor(session.duration / 60)}min {session.duration % 60}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Vue organisation */}
            {organization && orgStats && (
              <>
                {/* Navigation entre vue membres et vue d'ensemble */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-8">
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setOrganizationView('members')}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        organizationView === 'members'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      <span>Vue Membres</span>
                    </button>
                    <button
                      onClick={() => setOrganizationView('overview')}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        organizationView === 'overview'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span>Vue d'ensemble</span>
                    </button>
                  </div>
                </div>

                {organizationView === 'members' ? (
                  <>
                    {/* Stats organisation */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Membres</p>
                        <p className="text-2xl font-bold text-gray-900">{orgStats.totalMembers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Sessions totales</p>
                        <p className="text-2xl font-bold text-gray-900">{orgStats.totalSessions}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Award className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Score moyen</p>
                        <p className="text-2xl font-bold text-gray-900">{orgStats.averageScore}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <CreditCard className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Crédits restants</p>
                        <p className="text-2xl font-bold text-gray-900">{creditsInfo.credits}</p>
                        <Link
                          to="/credits"
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                        >
                          Recharger →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des membres */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Membres de l'organisation</h2>
                  </div>

                  {selectedMember ? (
                    <div className="p-6">
                      <button
                        onClick={() => setSelectedMember(null)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Retour à la liste</span>
                      </button>
                      
                      {(() => {
                        const selectedMemberData = orgMembersState.find(m => m.id === selectedMember);
                        const memberSessions = getMemberSessions(selectedMember);
                        
                        if (!selectedMemberData) {
                          return (
                            <div className="bg-red-50 rounded-lg p-6">
                              <p className="text-red-600">Membre non trouvé.</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div>
                            {/* En-tête du membre */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                              <div className="flex items-center space-x-4">
                                <div className="bg-gray-200 p-3 rounded-full">
                                  <Users className="h-6 w-6 text-gray-600" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {selectedMemberData.firstName} {selectedMemberData.lastName}
                                  </h3>
                                  <p className="text-gray-600">{selectedMemberData.email}</p>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                                    selectedMemberData.organizationRole === 'owner' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {selectedMemberData.organizationRole === 'owner' ? 'Propriétaire' : 'Membre'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Stats du membre */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <div className="flex items-center space-x-4">
                                  <div className="bg-blue-100 p-3 rounded-lg">
                                    <BarChart3 className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">Sessions totales</p>
                                    <p className="text-2xl font-bold text-gray-900">{memberSessions.length}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <div className="flex items-center space-x-4">
                                  <div className="bg-green-100 p-3 rounded-lg">
                                    <Award className="h-6 w-6 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">Score moyen</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                      {memberSessions.length > 0 
                                        ? Math.round(memberSessions.reduce((sum, session) => sum + session.score, 0) / memberSessions.length)
                                        : 0
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <div className="flex items-center space-x-4">
                                  <div className="bg-purple-100 p-3 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">Meilleur score</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                      {memberSessions.length > 0 ? Math.max(...memberSessions.map(s => s.score)) : 0}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bouton de téléchargement PDF membre */}
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-blue-100 p-3 rounded-lg">
                                    <Download className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Exporter les données du membre</h3>
                                    <p className="text-sm text-gray-600">Téléchargez un rapport PDF des performances de {selectedMemberData.firstName}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownloadMemberPDF(selectedMember)}
                                  disabled={isGeneratingPDF || memberSessions.length === 0}
                                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={memberSessions.length === 0 ? 'Aucune session à exporter' : 'Télécharger le rapport PDF'}
                                >
                                  {isGeneratingPDF ? (
                                    <>
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      <span>Génération...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-5 w-5" />
                                      <span>Télécharger PDF</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Insights du membre */}
                            <div className="mb-6">
                              <DashboardInsights
                                analytics={analyzeUserSessions(memberSessions, memberSelectedDifficulty)}
                                selectedDifficulty={memberSelectedDifficulty}
                                onDifficultyChange={setMemberSelectedDifficulty}
                              />
                            </div>

                            {/* Historique des sessions du membre */}
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                              <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">
                                  Sessions de {selectedMemberData.firstName}
                                </h2>
                              </div>

                              {memberSessions.length === 0 ? (
                                <div className="p-12 text-center">
                                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune session</h3>
                                  <p className="text-gray-600">
                                    Ce membre n'a pas encore effectué de simulation.
                                  </p>
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Prospect
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Difficulté
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Score
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Durée
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {memberSessions.slice().reverse().map((session) => (
                                        <tr 
                                          key={session.id} 
                                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                                          onClick={() => handleSessionClick(session)}
                                        >
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(session.date)}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                            {session.target === 'secretary' ? 'Secrétaire' :
                                             session.target === 'hr' ? 'DRH' :
                                             session.target === 'manager' ? 'Manager' : 'Commercial'}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                              session.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                              session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {session.difficulty === 'easy' ? 'Facile' :
                                               session.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(session.score)}`}>
                                              {session.score}/100
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {Math.floor(session.duration / 60)}min {session.duration % 60}s
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Membre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rôle
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sessions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score moyen
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orgMembersState.map((member) => {
                            const memberSessions = getMemberSessions(member.id);
                            const memberAvgScore = memberSessions.length > 0 
                              ? Math.round(memberSessions.reduce((sum, session) => sum + session.score, 0) / memberSessions.length)
                              : 0;
                            
                            return (
                              <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="bg-gray-200 p-2 rounded-full mr-3">
                                      <Users className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {member.firstName} {member.lastName}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {member.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    member.organizationRole === 'owner' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {member.organizationRole === 'owner' ? 'Propriétaire' : 'Membre'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {memberSessions.length}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {memberSessions.length > 0 ? `${memberAvgScore}/100` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setSelectedMember(member.id)}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Voir détails
                                    </button>
                                    <button
                                      onClick={() => handleDownloadMemberPDF(member.id)}
                                      disabled={isGeneratingPDF || memberSessions.length === 0}
                                      className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={memberSessions.length === 0 ? 'Aucune session à exporter' : 'Télécharger PDF'}
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    {member.organizationRole !== 'owner' && (
                                      <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                  </>
                ) : (
                  <>
                    {/* Vue d'ensemble de l'organisation */}
                    <div className="space-y-8">
                      {/* Stats globales de l'organisation */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Membres actifs</p>
                              <p className="text-2xl font-bold text-gray-900">{orgStats.totalMembers}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                              <BarChart3 className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Sessions totales</p>
                              <p className="text-2xl font-bold text-gray-900">{organizationAnalytics.totalSessions}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                              <Award className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Score moyen global</p>
                              <p className="text-2xl font-bold text-gray-900">{organizationAnalytics.averageScore}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-yellow-100 p-3 rounded-lg">
                              <TrendingUp className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Meilleur score</p>
                              <p className="text-2xl font-bold text-gray-900">{organizationAnalytics.bestScore}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bouton de téléchargement PDF organisation */}
                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <Download className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Exporter les données de l'organisation</h3>
                              <p className="text-sm text-gray-600">Téléchargez un rapport PDF complet des performances globales</p>
                            </div>
                          </div>
                          <button
                            onClick={handleDownloadOrganizationPDF}
                            disabled={isGeneratingPDF || orgSessionsState.length === 0}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={orgSessionsState.length === 0 ? 'Aucune session à exporter' : 'Télécharger le rapport PDF'}
                          >
                            {isGeneratingPDF ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Génération...</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-5 w-5" />
                                <span>Télécharger PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Insights détaillés de l'organisation */}
                      <div className="mb-8">
                        <DashboardInsights
                          analytics={organizationAnalytics}
                          selectedDifficulty={orgOverviewDifficulty}
                          onDifficultyChange={setOrgOverviewDifficulty}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Modal création organisation */}
        {showCreateOrg && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="bg-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Créer une organisation
                </h2>
                <p className="text-gray-600">
                  Créez une organisation pour partager des crédits avec votre équipe
                </p>
              </div>

              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div>
                  <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'organisation
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Mon entreprise"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateOrg(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingOrg || !orgName.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingOrg ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;