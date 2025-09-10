import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  credits: number;
  simulationsUsed: number;
  organizationId?: string;
  organizationRole?: 'owner' | 'member';
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  credits: number;
  simulationsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionData {
  id: string;
  userId: string;
  target: string;
  difficulty: string;
  score: number;
  duration: number;
  feedback: string[];
  recommendations: string[];
  improvements: string[];
  detailedAnalysis: string;
  date: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  sessions: SessionData[];
  isLoading: boolean;
  freeTrialUsed: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  createOrg: (name: string) => Promise<Organization>;
  joinOrg: (code: string) => Promise<void>;
  getOrgMembers: () => User[];
  saveSession: (sessionResult: any, config: any) => Promise<void>;
  useCreditForSimulation: () => Promise<boolean>;
  addCredits: (credits: number) => Promise<void>;
  addCreditsToOrg: (credits: number) => Promise<void>;
  getCreditsInfo: () => { credits: number; simulationsLeft: number };
  canUseFreeTrial: () => boolean;
  useFreeTrial: () => void;
  removeMember: (userId: string) => Promise<void>;
  getOrgSessions: () => SessionData[];
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  organizationCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [orgMembers, setOrgMembers] = useState<User[]>([]);
  const [orgSessions, setOrgSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [freeTrialUsed, setFreeTrialUsed] = useState(false);

  useEffect(() => {
    // Charger l'état de l'essai gratuit depuis localStorage
    console.log('🔧 INIT: Initialisation AuthContext');
    setFreeTrialUsed(localStorage.getItem('ring_academy_free_trial_used') === 'true');

    // Gestionnaire robuste pour rafraîchir la session quand l'onglet redevient visible
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('🔄 VISIBILITY: Onglet redevenu visible, vérification de la session...');
        console.log('🔄 VISIBILITY: État actuel - user:', user?.id, 'isLoading:', isLoading);
        setIsLoading(true);
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log('🔄 VISIBILITY: Session récupérée:', session?.user?.id, 'error:', error);
          
          if (error) {
            console.error('❌ VISIBILITY: Erreur lors de la vérification de session:', error);
            // Déconnexion propre en cas d'erreur de session critique
            await supabase.auth.signOut();
            setUser(null);
            setOrganization(null);
            setSessions([]);
            setOrgMembers([]);
            setOrgSessions([]);
          }
          
          if (session?.user) {
            // Session valide trouvée
            if (!user || user.id !== session.user.id) {
              // Utilisateur pas encore chargé ou différent, charger les données
              console.log('✅ VISIBILITY: Session valide trouvée, chargement des données utilisateur...');
              
              // Rafraîchir la session pour valider le jeton
              console.log('🔄 VISIBILITY: Rafraîchissement de la session...');
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                console.error('❌ VISIBILITY: Session invalide, déconnexion forcée:', refreshError);
                try {
                  await supabase.auth.signOut();
                } catch (signOutError) {
                  console.error('❌ VISIBILITY: Erreur lors de la déconnexion forcée:', signOutError);
                }
                setUser(null);
                setOrganization(null);
                setSessions([]);
                setOrgMembers([]);
                setOrgSessions([]);
                return;
              }
              
              console.log('✅ VISIBILITY: Session rafraîchie avec succès');
              const validUserId = refreshData.session?.user?.id || session.user.id;
              
              try {
                await loadUserData(validUserId);
              } catch (loadError) {
                console.error('❌ VISIBILITY: Erreur lors du chargement des données utilisateur:', loadError);
                // Déconnecter proprement en cas d'erreur de chargement
                try {
                  await supabase.auth.signOut();
                } catch (signOutError) {
                  console.error('❌ VISIBILITY: Erreur lors de la déconnexion après échec de chargement:', signOutError);
                }
                setUser(null);
                setOrganization(null);
                setSessions([]);
                setOrgMembers([]);
                setOrgSessions([]);
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            } else {
              // Utilisateur déjà chargé et correspond, juste recharger pour s'assurer que les données sont à jour
              console.log('✅ VISIBILITY: Session valide, rechargement des données...');
              
              // Rafraîchir la session pour valider le jeton
              console.log('🔄 VISIBILITY: Rafraîchissement de la session...');
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                console.error('❌ VISIBILITY: Session invalide lors du rechargement, déconnexion forcée:', refreshError);
                try {
                  await supabase.auth.signOut();
                } catch (signOutError) {
                  console.error('❌ VISIBILITY: Erreur lors de la déconnexion forcée lors du rechargement:', signOutError);
                }
                setUser(null);
                setOrganization(null);
                setSessions([]);
                setOrgMembers([]);
                setOrgSessions([]);
                return;
              }
              
              console.log('✅ VISIBILITY: Session rafraîchie avec succès lors du rechargement');
              const validUserId = refreshData.session?.user?.id || session.user.id;
              
              try {
                await loadUserData(validUserId);
              } catch (loadError) {
                console.error('❌ VISIBILITY: Erreur lors du rechargement des données utilisateur:', loadError);
                // Déconnecter proprement en cas d'erreur de chargement
                try {
                  await supabase.auth.signOut();
                } catch (signOutError) {
                  console.error('❌ VISIBILITY: Erreur lors de la déconnexion après échec de rechargement:', signOutError);
                }
                setUser(null);
                setOrganization(null);
                setSessions([]);
                setOrgMembers([]);
                setOrgSessions([]);
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            }
          } else if (!session && user) {
            // Pas de session mais utilisateur encore dans l'état, déconnecter proprement
            console.log('⚠️ VISIBILITY: Pas de session valide mais utilisateur encore connecté, déconnexion...');
            setUser(null);
            setOrganization(null);
            setSessions([]);
            setOrgMembers([]);
            setOrgSessions([]);
          } else {
            // Pas de session et pas d'utilisateur, état normal pour un visiteur
            console.log('ℹ️ VISIBILITY: Pas de session, utilisateur non connecté');
          }
        } catch (error) {
          console.error('❌ VISIBILITY: Erreur lors de la vérification de visibilité:', error);
          // En cas d'erreur, déconnecter proprement
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('❌ VISIBILITY: Erreur lors de la déconnexion d\'urgence:', signOutError);
          }
          setUser(null);
          setOrganization(null);
          setSessions([]);
          setOrgMembers([]);
          setOrgSessions([]);
          await new Promise(resolve => setTimeout(resolve, 200));
        } finally {
          // CRITIQUE: Toujours remettre isLoading à false
          console.log('🔄 VISIBILITY: Fin de handleVisibilityChange, isLoading -> false');
          setIsLoading(false);
        }
      }
    };

    // Ajouter l'écouteur d'événement
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Récupérer la session actuelle
    const getInitialSession = async () => {
      console.log('🚀 INIT: Récupération de la session initiale...');
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🚀 INIT: Session initiale récupérée:', session?.user?.id, 'error:', error);
        if (error) {
          console.error('❌ INIT: Erreur récupération session:', error);
          // Si le token de rafraîchissement est invalide, déconnecter l'utilisateur
          await supabase.auth.signOut();
        } else if (session?.user) {
          console.log('✅ INIT: Session valide trouvée, chargement des données...');
          
          // Rafraîchir la session pour valider le jeton
          console.log('🔄 INIT: Rafraîchissement de la session...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          // Log du résultat de refreshSession pour diagnostic
          console.log('🔄 INIT: Résultat refreshSession - refreshData:', refreshData, 'refreshError:', refreshError);
          
          if (refreshError || !refreshData.session?.user) {
            console.error('❌ INIT: Session invalide, déconnexion forcée:', refreshError || 'Pas d\'utilisateur dans la session rafraîchie');
            try {
              await supabase.auth.signOut();
              console.log('✅ INIT: Déconnexion forcée terminée');
            } catch (signOutError) {
              console.error('❌ INIT: Erreur lors de la déconnexion forcée:', signOutError);
            }
            setUser(null);
            setOrganization(null);
            setSessions([]);
            setOrgMembers([]);
            setOrgSessions([]);
            await new Promise(resolve => setTimeout(resolve, 200));
            return;
          }
          
          console.log('✅ INIT: Session rafraîchie avec succès');
          const validUserId = refreshData.session?.user?.id || session.user.id;
          
          try {
            await loadUserData(validUserId);
          } catch (loadError) {
            console.error('❌ INIT: Erreur lors du chargement des données utilisateur:', loadError);
            // Déconnecter proprement en cas d'erreur de chargement
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('❌ INIT: Erreur lors de la déconnexion après échec de chargement:', signOutError);
            }
            setUser(null);
            setOrganization(null);
            setSessions([]);
            setOrgMembers([]);
            setOrgSessions([]);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else {
          console.log('ℹ️ INIT: Aucune session trouvée');
        }
      } catch (error) {
        console.error('❌ INIT: Erreur initialisation session:', error);
        // En cas d'erreur, s'assurer que l'utilisateur est déconnecté
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('❌ INIT: Erreur lors de la déconnexion d\'urgence:', signOutError);
        }
        setUser(null);
        setOrganization(null);
        setSessions([]);
        setOrgMembers([]);
        setOrgSessions([]);
        await new Promise(resolve => setTimeout(resolve, 200));
      } finally {
        console.log('🚀 INIT: Fin de getInitialSession, isLoading -> false');
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 AUTH_CHANGE: Auth state change:', event, 'userId:', session?.user?.id, 'isLoading avant:', isLoading);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ AUTH_CHANGE: SIGNED_IN détecté, chargement des données...');
        setIsLoading(true);
        try {
          // NOUVEAU: Délai réduit et logs détaillés autour de loadUserData
          console.log('⏳ AUTH_CHANGE: Attente avant loadUserData...');
          await new Promise(resolve => setTimeout(resolve, 100)); // Réduit à 100ms
          
          // Rafraîchir la session pour valider le jeton
          console.log('🔄 AUTH_CHANGE: Rafraîchissement de la session...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('❌ AUTH_CHANGE: Session invalide, déconnexion forcée:', refreshError);
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('❌ AUTH_CHANGE: Erreur lors de la déconnexion forcée:', signOutError);
            }
            setUser(null);
            setOrganization(null);
            setSessions([]);
            setOrgMembers([]);
            setOrgSessions([]);
            return;
          }
          
          console.log('✅ AUTH_CHANGE: Session rafraîchie avec succès');
          const validUserId = refreshData.session?.user?.id || session.user.id;
          
          console.log('🚀 AUTH_CHANGE: Début appel loadUserData...');
          try {
            await loadUserData(validUserId);
          } catch (loadError) {
            console.error('❌ AUTH_CHANGE: Erreur lors du chargement des données utilisateur:', loadError);
            // Déconnecter proprement en cas d'erreur de chargement
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('❌ AUTH_CHANGE: Erreur lors de la déconnexion après échec de chargement:', signOutError);
            }
            setUser(null);
            setOrganization(null);
            setSessions([]);
            setOrgMembers([]);
            setOrgSessions([]);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          console.log('✅ AUTH_CHANGE: Fin appel loadUserData avec succès');
        } catch (error) {
          console.error('❌ AUTH_CHANGE: Erreur lors du chargement des données après SIGNED_IN:', error);
        } finally {
          console.log('✅ AUTH_CHANGE: Fin de SIGNED_IN, isLoading -> false');
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 AUTH_CHANGE: SIGNED_OUT détecté, nettoyage des états...');
        setUser(null);
        setOrganization(null);
        setSessions([]);
        setOrgMembers([]);
        setOrgSessions([]);
        setIsLoading(false);
        console.log('🚪 AUTH_CHANGE: États nettoyés après SIGNED_OUT');
      } else {
        console.log('ℹ️ AUTH_CHANGE: Événement non géré:', event);
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    console.log('📊 LOAD_USER: Début chargement des données utilisateur pour:', userId);
    
    // Charger le profil utilisateur
    console.log('📊 LOAD_USER: Requête profil utilisateur...');
    
    // Ajouter un timeout à la requête pour éviter les blocages
    const userProfilePromise = supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: La requête de profil utilisateur a pris trop de temps'));
      }, 10000); // 10 secondes de timeout
    });
    
    let userData, userError;
    try {
      const result = await Promise.race([userProfilePromise, timeoutPromise]);
      userData = result.data;
      userError = result.error;
    } catch (timeoutError) {
      console.error('❌ LOAD_USER: Timeout de la requête profil utilisateur:', timeoutError);
      userError = timeoutError;
      userData = null;
    }

    // Log détaillé du résultat de la requête
    console.log('📊 LOAD_USER: Résultat requête profil - userData:', userData, 'userError:', userError);
    
    // Vérifier l'état de la session auth au moment de la requête
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    console.log('📊 LOAD_USER: Session auth au moment de la requête:', currentSession?.user?.id, 'auth.uid disponible:', !!currentSession?.user?.id);
    
    if (userError) {
      console.error('❌ LOAD_USER: Erreur chargement profil utilisateur:', userError);
      console.error('❌ LOAD_USER: Détails complets de l\'erreur:', JSON.stringify(userError, null, 2));
      // Lever l'erreur pour que la fonction appelante la gère
      throw userError;
    }

    if (!userData) {
      console.log('⚠️ LOAD_USER: Aucune donnée utilisateur trouvée');
      throw new Error('Aucune donnée utilisateur trouvée');
    }

    console.log('✅ LOAD_USER: Données utilisateur chargées avec succès:', userData);
    const userProfile: User = {
      id: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email,
      phone: userData.phone || '',
      credits: userData.credits,
      simulationsUsed: userData.simulations_used,
      organizationId: userData.organization_id,
      organizationRole: userData.organization_role as 'owner' | 'member',
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    };

    setUser(userProfile);

    // Charger l'organisation si l'utilisateur en fait partie
    if (userData.organization_id) {
      console.log('📊 LOAD_USER: Chargement organisation:', userData.organization_id);
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single();

      if (!orgError && orgData) {
        console.log('✅ LOAD_USER: Organisation chargée:', orgData);
        const orgProfile: Organization = {
          id: orgData.id,
          name: orgData.name,
          code: orgData.code,
          ownerId: orgData.owner_id,
          credits: orgData.credits,
          simulationsUsed: orgData.simulations_used,
          createdAt: orgData.created_at,
          updatedAt: orgData.updated_at
        };
        setOrganization(orgProfile);

        // Load organization members and sessions
        console.log('📊 LOAD_USER: Chargement membres et sessions organisation...');
        await loadOrgMembers(orgData.id);
        await loadOrgSessions(orgData.id);
        console.log('✅ LOAD_USER: Membres et sessions organisation chargés');
      } else {
        console.log('⚠️ LOAD_USER: Erreur chargement organisation:', orgError);
        // Réinitialiser l'organisation si erreur de chargement
        setOrganization(null);
        setOrgMembers([]);
        setOrgSessions([]);
      }
    } else {
      console.log('ℹ️ LOAD_USER: Pas d\'organisation pour cet utilisateur');
      // Pas d'organisation, réinitialiser les états liés
      setOrganization(null);
      setOrgMembers([]);
      setOrgSessions([]);
    }

    // Charger les sessions de l'utilisateur
    console.log('📊 LOAD_USER: Chargement sessions utilisateur...');
    await loadUserSessions(userId);
    console.log('✅ LOAD_USER: Sessions utilisateur chargées');
    
    console.log('📊 LOAD_USER: Fin de loadUserData');
  };

  const loadUserSessions = async (userId: string) => {
    console.log('📊 LOAD_SESSIONS: Début chargement sessions pour:', userId);
    try {
      const { data: sessionsData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && sessionsData) {
        console.log('✅ LOAD_SESSIONS: Sessions chargées:', sessionsData.length);
        const userSessions: SessionData[] = sessionsData.map(session => ({
          id: session.id,
          userId: session.user_id,
          target: session.target,
          difficulty: session.difficulty,
          score: session.score,
          duration: session.duration,
          feedback: session.feedback,
          recommendations: session.recommendations,
          improvements: session.improvements,
          detailedAnalysis: session.detailed_analysis || '',
          date: session.created_at
        }));
        setSessions(userSessions);
      } else if (error) {
        console.error('❌ LOAD_SESSIONS: Erreur chargement sessions utilisateur:', error);
        setSessions([]);
      }
    } catch (error) {
      console.error('❌ LOAD_SESSIONS: Erreur critique chargement sessions:', error);
      setSessions([]);
    }
    console.log('📊 LOAD_SESSIONS: Fin de loadUserSessions');
  };

  const loadOrgMembers = async (orgId: string) => {
    console.log('📊 LOAD_ORG_MEMBERS: Début chargement membres pour org:', orgId);
    try {
      const { data: membersData, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', orgId);

      if (!error && membersData) {
        console.log('✅ LOAD_ORG_MEMBERS: Membres chargés:', membersData.length);
        const members: User[] = membersData.map(member => ({
          id: member.id,
          firstName: member.first_name,
          lastName: member.last_name,
          email: member.email,
          phone: member.phone || '',
          credits: member.credits,
          simulationsUsed: member.simulations_used,
          organizationId: member.organization_id,
          organizationRole: member.organization_role as 'owner' | 'member',
          createdAt: member.created_at,
          updatedAt: member.updated_at
        }));
        setOrgMembers(members);
      } else if (error) {
        console.error('❌ LOAD_ORG_MEMBERS: Erreur chargement membres:', error);
      }
    } catch (error) {
      console.error('❌ LOAD_ORG_MEMBERS: Erreur critique chargement membres:', error);
    }
    console.log('📊 LOAD_ORG_MEMBERS: Fin de loadOrgMembers');
  };

  const loadOrgSessions = async (orgId: string) => {
    console.log('📊 LOAD_ORG_SESSIONS: Début chargement sessions org pour:', orgId);
    try {
      // Étape 1: Récupérer les IDs de tous les utilisateurs appartenant à cette organisation
      console.log('📊 LOAD_ORG_SESSIONS: Récupération IDs membres...');
      const { data: memberIdsData, error: memberIdsError } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', orgId); // Récupérer uniquement les membres de cette organisation spécifique

      if (memberIdsError || !memberIdsData) {
        console.error('❌ LOAD_ORG_SESSIONS: Erreur chargement IDs des membres de l\'organisation:', memberIdsError);
        setOrgSessions([]); // S'assurer que l'état est vidé en cas d'erreur
        return;
      }

      const memberUserIds = memberIdsData.map(m => m.id);
      console.log('📊 LOAD_ORG_SESSIONS: IDs membres trouvés:', memberUserIds.length);
        
      if (memberUserIds.length === 0) {
        console.log('ℹ️ LOAD_ORG_SESSIONS: Aucun membre trouvé');
        setOrgSessions([]);
        return;
      }
        
      // Étape 2: Récupérer les sessions pour ces IDs d'utilisateurs spécifiques
      // La politique RLS sur 'sessions' s'appliquera toujours ici, mais la requête est plus ciblée.
      console.log('📊 LOAD_ORG_SESSIONS: Récupération sessions pour les membres...');
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          user_id,
          target,
          difficulty,
          score,
          duration,
          feedback,
          recommendations,
          improvements,
          detailed_analysis,
          created_at
        `)
        .in('user_id', memberUserIds) // Filtrer par les IDs des membres
        .order('created_at', { ascending: false });

      if (!sessionsError && sessionsData) {
        console.log('✅ LOAD_ORG_SESSIONS: Sessions org chargées:', sessionsData.length);
        const orgSessionsList: SessionData[] = sessionsData.map(session => ({
          id: session.id,
          userId: session.user_id,
          target: session.target,
          difficulty: session.difficulty,
          score: session.score,
          duration: session.duration,
          feedback: session.feedback,
          recommendations: session.recommendations,
          improvements: session.improvements,
          detailedAnalysis: session.detailed_analysis || '',
          date: session.created_at
        }));

        setOrgSessions(orgSessionsList);
      } else {
        console.error('❌ LOAD_ORG_SESSIONS: Erreur chargement sessions org:', sessionsError);
        setOrgSessions([]); // S'assurer que l'état est vidé en cas d'erreur
      }
    } catch (error) {
      console.error('❌ LOAD_ORG_SESSIONS: Erreur critique chargement sessions org:', error);
      setOrgSessions([]); // S'assurer que l'état est vidé en cas d'erreur
    }
    console.log('📊 LOAD_ORG_SESSIONS: Fin de loadOrgSessions');
  };

  const login = async (email: string, password: string): Promise<void> => {
    console.log('🔐 LOGIN: Début tentative de connexion pour:', email);
    setIsLoading(true);
    
    try {
      console.log('🔐 LOGIN: Appel signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('🔐 LOGIN: Résultat signInWithPassword - data:', data, 'error:', error);
      if (error) {
        console.error('❌ LOGIN: Erreur signInWithPassword:', error);
        console.error('❌ LOGIN: Détails complets de l\'erreur:', JSON.stringify(error, null, 2));
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('✅ LOGIN: Utilisateur connecté, chargement des données...');
        
        // NOUVEAU: Vérifier l'état de la session immédiatement après la connexion
        console.log('🔄 LOGIN: Rafraîchissement de la session après connexion...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ LOGIN: Erreur rafraîchissement session après connexion:', refreshError);
          throw new Error('Session invalide après connexion');
        }
        
        console.log('✅ LOGIN: Session rafraîchie après connexion:', refreshData.session?.user?.id);
        const validUserId = refreshData.session?.user?.id || data.user.id;
        
        await loadUserData(validUserId);
        console.log('✅ LOGIN: Connexion terminée avec succès');
      } else {
        console.log('⚠️ LOGIN: Pas d\'utilisateur dans la réponse');
      }
    } catch (error) {
      console.error('❌ LOGIN: Erreur lors de la connexion:', error);
      console.error('❌ LOGIN: Détails complets de l\'erreur:', JSON.stringify(error, null, 2));
      throw error;
    } finally {
      // CRITIQUE: Toujours remettre isLoading à false, même en cas d'erreur
      console.log('🔐 LOGIN: Fin de login, isLoading -> false');
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    console.log('📝 REGISTER: Début création de compte pour:', userData.email);
    setIsLoading(true);
    
    try {
      // Créer le compte d'authentification
      console.log('📝 REGISTER: Appel signUp...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: 'https://ringacademy.fr/login'
        }
      });

      if (authError) {
        console.error('❌ REGISTER: Erreur signUp:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        console.log('⚠️ REGISTER: Pas d\'utilisateur dans la réponse signUp');
        throw new Error('Erreur lors de la création du compte');
      }

      console.log('✅ REGISTER: Compte auth créé:', authData.user.id);

      // Préparer les données du profil utilisateur
      let organizationId = null;
      let organizationRole = null;

      // Si un code organisation est fourni, récupérer l'organisation
      if (userData.organizationCode) {
        console.log('📝 REGISTER: Recherche organisation avec code:', userData.organizationCode);
        // Appeler la fonction RPC pour obtenir l'organisation par code, en contournant RLS
        const { data: orgDataArray, error: orgError } = await supabase
          .rpc('get_organization_by_code', { p_code: userData.organizationCode });

        if (orgError) {
          console.error('❌ REGISTER: Erreur RPC get_organization_by_code:', orgError);
          throw new Error('Erreur lors de la récupération de l\'organisation.');
        }

        if (!orgDataArray || orgDataArray.length === 0) {
          console.log('⚠️ REGISTER: Code organisation invalide');
          throw new Error('Code organisation invalide');
        }

        const orgData = orgDataArray[0]; // La fonction RPC retourne un tableau, prendre le premier élément
        console.log('✅ REGISTER: Organisation trouvée:', orgData);
        organizationId = orgData.id;
        organizationRole = 'member';
      }

      // Attendre un peu pour que l'authentification soit complètement établie
      console.log('📝 REGISTER: Création du profil utilisateur...');

      // Insérer le profil utilisateur
      try {
        console.log('📝 REGISTER: Appel RPC create_user_profile...');
        const { error: profileError } = await supabase.rpc('create_user_profile', {
          p_user_id: authData.user.id,
          p_first_name: userData.firstName,
          p_last_name: userData.lastName,
          p_email: userData.email,
          p_phone: userData.phone || null,
          p_organization_id: organizationId,
          p_organization_role: organizationRole
        });

        if (profileError) {
          console.error('❌ REGISTER: Erreur RPC create_user_profile:', profileError);
          // Relancer l'erreur Supabase originale pour un diagnostic complet
          throw profileError;
        }
        console.log('✅ REGISTER: Profil utilisateur créé avec succès');
      } catch (profileError: any) {
        console.error('❌ REGISTER: Erreur création profil:', profileError);
        // Si l'insertion du profil échoue, supprimer l'utilisateur d'authentification
        await supabase.auth.signOut();
        throw new Error(profileError?.message || 'Erreur lors de la création du profil utilisateur via RPC');
      }

      // Charger les données utilisateur
      console.log('📝 REGISTER: Chargement des données utilisateur...');
      await loadUserData(authData.user.id);
      console.log('✅ REGISTER: Inscription terminée avec succès');
    } catch (error) {
      console.error('❌ REGISTER: Erreur lors de l\'inscription:', error);
      throw error;
    } finally {
      console.log('📝 REGISTER: Fin de register, isLoading -> false');
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log('🚪 LOGOUT: Début déconnexion...');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ LOGOUT: Erreur lors de la déconnexion:', error);
      }
      console.log('✅ LOGOUT: Déconnexion Supabase terminée');
      
      // Les états seront réinitialisés par onAuthStateChange
    } catch (error) {
      console.error('❌ LOGOUT: Erreur critique lors de la déconnexion:', error);
      // En cas d'erreur, forcer la réinitialisation des états
      setUser(null);
      setOrganization(null);
      setSessions([]);
      setOrgMembers([]);
      setOrgSessions([]);
    } finally {
      // S'assurer que l'état de chargement est réinitialisé même en cas d'erreur
      console.log('🚪 LOGOUT: Fin de logout, isLoading -> false');
      setIsLoading(false);
    }
  };

  const createOrg = async (name: string): Promise<Organization> => {
    console.log('🏢 CREATE_ORG: Début création organisation:', name);
    if (!user) throw new Error('Utilisateur non connecté');
    
    try {
      // Générer un code unique pour l'organisation
      const generateOrgCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const orgCode = generateOrgCode();

      // Créer l'organisation
      console.log('🏢 CREATE_ORG: Insertion organisation...');
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          code: orgCode,
          owner_id: user.id,
          credits: user.credits, // Transfer user's full credits
          simulations_used: user.simulationsUsed // Transfer user's partial simulations used
        })
        .select()
        .single();

      if (orgError || !orgData) {
        console.error('❌ CREATE_ORG: Erreur création organisation:', orgError);
        throw new Error('Erreur lors de la création de l\'organisation');
      }

      console.log('✅ CREATE_ORG: Organisation créée:', orgData);

      // Mettre à jour l'utilisateur pour l'associer à l'organisation
      console.log('🏢 CREATE_ORG: Mise à jour utilisateur...');
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          organization_id: orgData.id,
          organization_role: 'owner',
          credits: 0, // Reset user's individual credits
          simulations_used: 0 // Reset user's individual partial simulations used
        })
        .eq('id', user.id);

      if (userUpdateError) {
        console.error('❌ CREATE_ORG: Erreur mise à jour utilisateur:', userUpdateError);
        throw new Error('Erreur lors de la mise à jour du profil utilisateur');
      }

      console.log('✅ CREATE_ORG: Utilisateur mis à jour');

      // Recharger les données utilisateur
      console.log('🏢 CREATE_ORG: Rechargement données utilisateur...');
      await loadUserData(user.id);

      const newOrg: Organization = {
        id: orgData.id,
        name: orgData.name,
        code: orgData.code,
        ownerId: orgData.owner_id,
        credits: orgData.credits,
        simulationsUsed: orgData.simulations_used,
        createdAt: orgData.created_at,
        updatedAt: orgData.updated_at
      };

      console.log('✅ CREATE_ORG: Organisation créée avec succès');
      return newOrg;
    } catch (error) {
      console.error('❌ CREATE_ORG: Erreur lors de la création d\'organisation:', error);
      throw error;
    }
  };

  const joinOrg = async (code: string): Promise<void> => {
    console.log('🤝 JOIN_ORG: Début rejoindre organisation avec code:', code);
    if (!user) throw new Error('Utilisateur non connecté');
    
    try {
      // Appeler la nouvelle fonction RPC pour obtenir l'organisation par code, en contournant RLS
      console.log('🤝 JOIN_ORG: Recherche organisation...');
      const { data: orgDataArray, error: orgError } = await supabase
        .rpc('get_organization_by_code', { p_code: code });

      if (orgError) {
        console.error('❌ JOIN_ORG: Erreur RPC get_organization_by_code:', orgError);
        throw new Error('Erreur lors de la récupération de l\'organisation.');
      }

      if (!orgDataArray || orgDataArray.length === 0) {
        console.log('⚠️ JOIN_ORG: Code organisation invalide');
        throw new Error('Code organisation invalide');
      }

      const orgData = orgDataArray[0]; // La fonction RPC retourne un tableau, prendre le premier élément
      console.log('✅ JOIN_ORG: Organisation trouvée:', orgData);

      // Mettre à jour l'utilisateur pour l'associer à l'organisation
      console.log('🤝 JOIN_ORG: Mise à jour utilisateur...');
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          organization_id: orgData.id,
          organization_role: 'member'
        })
        .eq('id', user.id);

      if (userUpdateError) {
        console.error('❌ JOIN_ORG: Erreur mise à jour utilisateur:', userUpdateError);
        throw new Error('Erreur lors de l\'association à l\'organisation');
      }

      console.log('✅ JOIN_ORG: Utilisateur associé à l\'organisation');

      // Recharger les données utilisateur
      console.log('🤝 JOIN_ORG: Rechargement données utilisateur...');
      await loadUserData(user.id);
      console.log('✅ JOIN_ORG: Rejoindre organisation terminé avec succès');
    } catch (error) {
      console.error('❌ JOIN_ORG: Erreur lors de rejoindre organisation:', error);
      throw error;
    }
  };

  const getOrgMembers = (): User[] => {
    console.log('📊 GET_ORG_MEMBERS: Retour des membres:', orgMembers.length);
    return orgMembers;
  };

  const saveSession = async (sessionResult: any, config: any): Promise<void> => {
    console.log('💾 SAVE_SESSION: Début sauvegarde session...');
    if (!user) return;

    try {
      console.log('💾 SAVE_SESSION: Insertion session en base...');
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          target: config.target,
          difficulty: config.difficulty,
          score: sessionResult.score,
          duration: sessionResult.duration,
          feedback: sessionResult.feedback || [],
          recommendations: sessionResult.recommendations || [],
          improvements: sessionResult.improvements || [],
          detailed_analysis: sessionResult.detailedAnalysis || ''
        })
        .select()
        .single();

      if (!error && sessionData) {
        console.log('✅ SAVE_SESSION: Session sauvegardée:', sessionData.id);
        const newSession: SessionData = {
          id: sessionData.id,
          target: sessionData.target,
          difficulty: sessionData.difficulty,
          score: sessionData.score,
          duration: sessionData.duration,
          feedback: sessionData.feedback,
          recommendations: sessionData.recommendations,
          improvements: sessionData.improvements,
          detailedAnalysis: sessionData.detailed_analysis || '',
          date: sessionData.created_at
        };

        setSessions(prev => [newSession, ...prev]);
      } else if (error) {
        console.error('❌ SAVE_SESSION: Erreur sauvegarde session:', error);
      }
    } catch (error) {
      console.error('❌ SAVE_SESSION: Erreur critique sauvegarde session:', error);
    }
    console.log('💾 SAVE_SESSION: Fin de saveSession');
  };

  const useCreditForSimulation = async (): Promise<boolean> => {
    console.log('💳 USE_CREDIT: Début utilisation crédit...');
    if (!user) return false;
    
    try {
      // 1. Toujours incrémenter le compteur de simulations de l'utilisateur individuel (celui-ci ne sera jamais remis à zéro)
      console.log('💳 USE_CREDIT: Incrémentation compteur utilisateur...');
      const newIndividualUserSimulationsUsed = user.simulationsUsed + 1;
      const { error: userIndividualUpdateError } = await supabase
        .from('users')
        .update({
          simulations_used: newIndividualUserSimulationsUsed
        })
        .eq('id', user.id);

      if (userIndividualUpdateError) {
        console.error('❌ USE_CREDIT: Erreur mise à jour compteur utilisateur:', userIndividualUpdateError);
        return false; // Échec critique si nous ne pouvons même pas mettre à jour le compteur de l'utilisateur
      }

      // 2. Gérer la logique de consommation des crédits en fonction du statut de l'organisation
      if (user.organizationId && organization) {
        console.log('💳 USE_CREDIT: Consommation crédit organisation...');
        // L'utilisateur fait partie d'une organisation : appeler la fonction RPC pour consommer une simulation
        const { error: rpcError } = await supabase.rpc('consume_organization_simulation', {
          p_organization_id: organization.id
        });

        if (rpcError) {
          console.error('❌ USE_CREDIT: Erreur RPC consume_organization_simulation:', rpcError);
          // Annuler le compteur de simulations individuel de l'utilisateur si l'appel RPC échoue
          await supabase.from('users').update({ simulations_used: user.simulationsUsed }).eq('id', user.id);
          return false;
        }
        console.log('✅ USE_CREDIT: Crédit organisation consommé');
      } else {
        console.log('💳 USE_CREDIT: Consommation crédit individuel...');
        // L'utilisateur est un individu (ne fait pas partie d'une organisation) : mettre à jour ses propres crédits et réinitialiser son compteur de simulations pour la déduction des crédits
        let newIndividualCredits = user.credits;
        let newIndividualSimulationsUsedForCreditDeduction = newIndividualUserSimulationsUsed; // Utiliser la valeur déjà incrémentée

        if (newIndividualSimulationsUsedForCreditDeduction >= 3) {
          // Consommer un crédit et réinitialiser le compteur de l'utilisateur pour la déduction des crédits
          if (newIndividualCredits <= 0) {
            console.log('⚠️ USE_CREDIT: Pas assez de crédits individuels');
            // Annuler le compteur de simulations individuel de l'utilisateur si pas de crédits
            await supabase.from('users').update({ simulations_used: user.simulationsUsed }).eq('id', user.id);
            return false;
          }
          newIndividualCredits -= 1;
          newIndividualSimulationsUsedForCreditDeduction = 0; // Réinitialiser le compteur de l'utilisateur pour la déduction des crédits
          console.log('💳 USE_CREDIT: Crédit individuel consommé');
        }

        const { error: individualCreditUpdateError } = await supabase
          .from('users')
          .update({
            credits: newIndividualCredits,
            simulations_used: newIndividualSimulationsUsedForCreditDeduction // C'est le compteur de l'utilisateur pour la déduction des crédits
          })
          .eq('id', user.id);

        if (individualCreditUpdateError) {
          console.error('❌ USE_CREDIT: Erreur mise à jour crédits individuels:', individualCreditUpdateError);
          // Annuler le compteur de simulations individuel de l'utilisateur si la mise à jour échoue
          await supabase.from('users').update({ simulations_used: user.simulationsUsed }).eq('id', user.id);
          return false;
        }
        console.log('✅ USE_CREDIT: Crédits individuels mis à jour');
      }

      // Recharger les données de l'utilisateur pour refléter toutes les modifications
      console.log('💳 USE_CREDIT: Rechargement données utilisateur...');
      await loadUserData(user.id);
      console.log('✅ USE_CREDIT: Utilisation crédit terminée avec succès');
      return true;
    } catch (error) {
      console.error('❌ USE_CREDIT: Erreur lors de l\'utilisation du crédit:', error);
      return false;
    }
  };

  const addCredits = async (credits: number): Promise<void> => {
    console.log('💰 ADD_CREDITS: Début ajout crédits:', credits);
    if (!user) return;
    
    try {
      console.log('💰 ADD_CREDITS: Mise à jour crédits utilisateur...');
      const { error } = await supabase
        .from('users')
        .update({
          credits: (user.credits || 0) + credits
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ ADD_CREDITS: Erreur ajout crédits:', error);
        throw new Error('Erreur lors de l\'ajout de crédits');
      }

      console.log('✅ ADD_CREDITS: Crédits ajoutés, rechargement données...');
      // Recharger les données
      await loadUserData(user.id);
    } catch (error) {
      console.error('❌ ADD_CREDITS: Erreur lors de l\'ajout de crédits:', error);
      throw error;
    }
  };

  const addCreditsToOrg = async (credits: number): Promise<void> => {
    console.log('💰 ADD_CREDITS_ORG: Début ajout crédits organisation:', credits);
    if (!organization) return;
    
    try {
      console.log('💰 ADD_CREDITS_ORG: Appel RPC add_organization_credits...');
      const { error } = await supabase.rpc('add_organization_credits', {
        org_id: organization.id,
        amount: credits
      });

      if (error) {
        console.error('❌ ADD_CREDITS_ORG: Erreur RPC:', error);
        throw new Error(error.message || 'Erreur lors de l\'ajout de crédits à l\'organisation');
      }

      console.log('✅ ADD_CREDITS_ORG: Crédits ajoutés à l\'organisation, rechargement...');
      // Recharger les données
      if (user) {
        await loadUserData(user.id);
      }
    } catch (error) {
      console.error('❌ ADD_CREDITS_ORG: Erreur lors de l\'ajout de crédits à l\'organisation:', error);
      throw error;
    }
  };

  const getCreditsInfo = (): { credits: number; simulationsLeft: number } => {
    console.log('📊 GET_CREDITS_INFO: Calcul crédits info...');
    if (!user) return { credits: 0, simulationsLeft: 0 };

    // Si l'utilisateur fait partie d'une organisation, retourner les crédits de l'organisation
    if (user.organizationId && organization) {
      const simulationsLeft = organization.credits * 3 - organization.simulationsUsed;
      console.log('📊 GET_CREDITS_INFO: Crédits organisation:', { credits: organization.credits, simulationsLeft });
      return { credits: organization.credits, simulationsLeft };
    }

    const simulationsLeft = user.credits * 3 - user.simulationsUsed;
    console.log('📊 GET_CREDITS_INFO: Crédits individuels:', { credits: user.credits, simulationsLeft });
    return { credits: user.credits, simulationsLeft };
  };

  const canUseFreeTrial = (): boolean => {
    console.log('🎁 CAN_USE_TRIAL: Vérification essai gratuit - user:', !!user, 'freeTrialUsed:', freeTrialUsed);
    return !user && !freeTrialUsed;
  };

  const useFreeTrial = (): void => {
    console.log('🎁 USE_TRIAL: Utilisation essai gratuit');
    localStorage.setItem('ring_academy_free_trial_used', 'true');
    setFreeTrialUsed(true);
  };

  const removeMember = async (userId: string): Promise<void> => {
    console.log('👥 REMOVE_MEMBER: Début suppression membre:', userId);
    try {
      console.log('👥 REMOVE_MEMBER: Mise à jour utilisateur...');
      const { error } = await supabase
        .from('users')
        .update({
          organization_id: null,
          organization_role: null
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ REMOVE_MEMBER: Erreur suppression membre:', error);
        throw new Error('Erreur lors de la suppression du membre');
      }

      console.log('✅ REMOVE_MEMBER: Membre supprimé, rechargement membres...');
      // Recharger les membres de l'organisation
      if (organization) {
        await loadOrgMembers(organization.id);
      }
    } catch (error) {
      console.error('❌ REMOVE_MEMBER: Erreur lors de la suppression du membre:', error);
      throw error;
    }
  };

  const getOrgSessions = (): SessionData[] => {
    console.log('📊 GET_ORG_SESSIONS: Retour sessions organisation:', orgSessions.length);
    return orgSessions;
  };

  const value = {
    user,
    organization,
    sessions,
    isLoading,
    freeTrialUsed,
    login,
    register,
    logout,
    createOrg,
    joinOrg,
    getOrgMembers,
    saveSession,
    useCreditForSimulation,
    addCredits,
    addCreditsToOrg,
    getCreditsInfo,
    canUseFreeTrial,
    useFreeTrial,
    removeMember,
    getOrgSessions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};