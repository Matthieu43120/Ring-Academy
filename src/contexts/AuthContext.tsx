import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { SessionResult } from '../pages/Training';
import { TrainingConfig } from '../pages/Training';

// Helper function to get Supabase project reference from URL
const getSupabaseProjectRef = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    console.error('VITE_SUPABASE_URL is not defined');
    return 'default'; // Fallback
  }
  const match = url.match(/https:\/\/(.*?)\.supabase\.co/);
  return match ? match[1] : 'default';
};

// Function to manually clear Supabase tokens from localStorage
// This function is now primarily for explicit logout or critical error scenarios,
// as sessionStorage handles most automatic clearing.
const clearSupabaseTokensFromLocalStorage = () => {
  console.log('🧹 CLEANUP: Début nettoyage manuel du localStorage...');
  const supabaseProjectRef = getSupabaseProjectRef();
  const keysToRemove = [
    `sb-${supabaseProjectRef}-auth-token`,
    `sb-${supabaseProjectRef}-auth-refresh-token`,
    `sb-${supabaseProjectRef}-auth-pkce-code-verifier`,
    `sb-${supabaseProjectRef}-auth-code-verifier`,
    `sb-${supabaseProjectRef}-auth-token-expires-at`,
    `sb-${supabaseProjectRef}-auth-token-type`,
    `sb-${supabaseProjectRef}-auth-user`,
    `sb-${supabaseProjectRef}-auth-session`,
  ];

  console.log('🧹 CLEANUP: Clés Supabase présentes AVANT nettoyage:', Object.keys(localStorage).filter(key => key.startsWith(`sb-${supabaseProjectRef}-`)));
  console.log('🧹 CLEANUP: Clés ciblées pour suppression:', keysToRemove);

  let cleanedSuccessfully = true;
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      if (localStorage.getItem(key) === null) {
        console.log(`🧹 CLEANUP: ✅ Clé supprimée: ${key}`);
      } else {
        console.error(`🧹 CLEANUP: ❌ Échec de suppression de la clé: ${key}`);
        cleanedSuccessfully = false;
      }
    } else {
      console.log(`🧹 CLEANUP: ℹ️ Clé non trouvée (déjà absente): ${key}`);
    }
  });

  const remainingKeys = Object.keys(localStorage).filter(key => key.startsWith(`sb-${supabaseProjectRef}-`));
  if (remainingKeys.length === 0) {
    console.log('🧹 CLEANUP: ✅ Nettoyage du localStorage terminé. Aucune clé Supabase restante.');
  } else {
    console.error('🧹 CLEANUP: ❌ Nettoyage du localStorage incomplet. Clés restantes:', remainingKeys);
    cleanedSuccessfully = false;
  }
  return cleanedSuccessfully;
};

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

interface Organization {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  credits: number;
  simulationsUsed: number;
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

interface AuthContextType {
  user: UserProfile | null;
  organization: Organization | null;
  sessions: SessionRecord[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  getCreditsInfo: () => { credits: number; simulationsLeft: number };
  saveSession: (result: SessionResult, config: TrainingConfig) => Promise<void>;
  useCreditForSimulation: () => Promise<boolean>;
  canUseFreeTrial: () => boolean;
  useFreeTrial: () => void;
  createOrg: (name: string) => Promise<void>;
  getOrgMembers: () => UserProfile[];
  removeMember: (memberId: string) => Promise<void>;
  getOrgSessions: () => SessionRecord[];
  addCredits: (amount: number) => Promise<void>;
  addCreditsToOrg: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [freeTrialUsed, setFreeTrialUsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ring_academy_free_trial_used') === 'true';
    }
    return false;
  });

  const isFetchingData = useRef(false); // Protection contre les appels concurrents

  // Function to load user data from Supabase
  const loadUserData = useCallback(async (supabaseUser: any) => {
    if (isFetchingData.current) {
      console.log('⚠️ LOAD_USER: Une récupération de données est déjà en cours. Annulation de l\'appel concurrent.');
      return;
    }

    isFetchingData.current = true;
    console.log('⏳ LOAD_USER: Début du chargement des données utilisateur pour', supabaseUser?.id);
    setIsLoading(true);
    
    try {
      // Fetch user profile
      console.log('⏳ LOAD_USER: Récupération du profil utilisateur...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError) {
        console.error('❌ LOAD_USER: Erreur lors de la récupération du profil:', profileError);
        throw profileError;
      }
      console.log('✅ LOAD_USER: Profil utilisateur récupéré:', profile);

      let userProfile: UserProfile = {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        credits: profile.credits,
        simulationsLeft: profile.credits * 3 - profile.simulations_used,
        organizationId: profile.organization_id,
        organizationRole: profile.organization_role,
      };

      // Fetch organization data if user belongs to one
      if (profile.organization_id) {
        console.log('⏳ LOAD_USER: Récupération de l\'organisation:', profile.organization_id);
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (orgError) {
          console.error('❌ LOAD_USER: Erreur lors de la récupération de l\'organisation:', orgError);
          throw orgError;
        }
        console.log('✅ LOAD_USER: Organisation récupérée:', orgData);
        
        setOrganization({
          id: orgData.id,
          name: orgData.name,
          code: orgData.code,
          ownerId: orgData.owner_id,
          credits: orgData.credits,
          simulationsUsed: orgData.simulations_used,
        });
        
        // Update userProfile with organization's credits
        userProfile.credits = orgData.credits;
        userProfile.simulationsLeft = orgData.credits * 3 - orgData.simulations_used;
      } else {
        console.log('ℹ️ LOAD_USER: Aucune organisation pour cet utilisateur');
        setOrganization(null);
      }

      // Fetch user sessions
      console.log('⏳ LOAD_USER: Récupération des sessions utilisateur...');
      const { data: userSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('❌ LOAD_USER: Erreur lors de la récupération des sessions:', sessionsError);
        throw sessionsError;
      }
      console.log('✅ LOAD_USER: Sessions utilisateur récupérées:', userSessions?.length || 0, 'sessions');

      const formattedSessions = (userSessions || []).map(session => ({
        id: session.id,
        userId: session.user_id,
        target: session.target,
        difficulty: session.difficulty,
        score: session.score,
        duration: session.duration,
        feedback: session.feedback || [],
        recommendations: session.recommendations || [],
        improvements: session.improvements || [],
        detailedAnalysis: session.detailed_analysis,
        date: session.created_at,
      }));

      setSessions(formattedSessions);
      setUser(userProfile);
      console.log('👤 LOAD_USER: État final de l\'utilisateur (après traitement):', userProfile);
      
    } catch (error) {
      console.error('❌ LOAD_USER: Erreur globale lors du chargement des données utilisateur:', error);
      setUser(null);
      setOrganization(null);
      setSessions([]);
    } finally {
      isFetchingData.current = false;
      setIsLoading(false);
      console.log('✅ LOAD_USER: Fin du processus loadUserData. isLoading est maintenant false.');
    }
  }, []);

  // Initial session check
  useEffect(() => {
    console.log('🔧 INIT: Initialisation AuthContext');
    const getInitialSession = async () => {
      console.log('🚀 INIT: Récupération de la session initiale...');
      setIsLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ INIT: Erreur lors de la récupération de la session:', error);
          throw error;
        }
        
        if (session?.user) {
          console.log('✅ INIT: Session trouvée, chargement des données utilisateur...');
          await loadUserData(session.user);
        } else {
          console.log('ℹ️ INIT: Aucune session trouvée.');
          setUser(null);
          setOrganization(null);
        }
      } catch (error) {
        console.error('❌ INIT: Erreur critique lors de la récupération de la session initiale:', error);
        setUser(null);
        setOrganization(null);
        setSessions([]);
      } finally {
        setIsLoading(false);
        console.log('✅ INIT: Fin de la récupération de la session initiale. isLoading est maintenant false.');
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔄 AUTH_CHANGE: Auth state change: ${event} userId: ${session?.user?.id || 'N/A'} isLoading avant: ${isLoading}`);
      
      // Éviter de traiter les événements redondants
      if (event === 'INITIAL_SESSION') {
        console.log('ℹ️ AUTH_CHANGE: INITIAL_SESSION ignoré (déjà traité par getInitialSession)');
        return;
      }
      
      setIsLoading(true);
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ AUTH_CHANGE: SIGNED_IN détecté, chargement des données...');
          console.log('⏳ AUTH_CHANGE: Attente avant loadUserData...');
          
          // Petit délai pour éviter les conflits avec d'autres processus
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('🔄 AUTH_CHANGE: Rafraîchissement de la session...');
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          
          if (refreshedSession?.user) {
            await loadUserData(refreshedSession.user);
          } else {
            console.warn('⚠️ AUTH_CHANGE: Session rafraîchie non trouvée');
            setUser(null);
            setOrganization(null);
            setSessions([]);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('✅ AUTH_CHANGE: SIGNED_OUT détecté, nettoyage des données...');
          setUser(null);
          setOrganization(null);
          setSessions([]);
          clearSupabaseTokensFromLocalStorage();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 AUTH_CHANGE: TOKEN_REFRESHED détecté, rafraîchissement des données...');
          await loadUserData(session.user);
        } else if (session?.user) {
          console.log(`🔄 AUTH_CHANGE: ${event} détecté, rafraîchissement des données...`);
          await loadUserData(session.user);
        } else {
          console.log('ℹ️ AUTH_CHANGE: Aucun utilisateur ou session après l\'événement, nettoyage...');
          setUser(null);
          setOrganization(null);
        }
      } catch (error) {
        console.error('❌ AUTH_CHANGE: Erreur lors du traitement de l\'état d\'authentification:', error);
        setUser(null);
        setOrganization(null);
        setSessions([]);
      } finally {
        setIsLoading(false);
        console.log(`✅ AUTH_CHANGE: Fin du traitement de l'état d'authentification. isLoading est maintenant false.`);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [loadUserData]);

  // Handle visibility change to refresh session
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 VISIBILITY: Onglet redevenu visible, vérification de la session...');
        console.log('🔄 VISIBILITY: État actuel - user:', user ? 'connecté' : 'undefined', 'isLoading:', isLoading);
        
        setIsLoading(true);
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('❌ VISIBILITY: Erreur lors de la vérification de la session:', error);
            throw error;
          }
          
          if (session?.user) {
            console.log('✅ VISIBILITY: Session valide trouvée, rafraîchissement des données...');
            await loadUserData(session.user);
          } else if (user) {
            console.log('ℹ️ VISIBILITY: Session expirée ou invalide, nettoyage des données utilisateur...');
            setUser(null);
            setOrganization(null);
          } else {
            console.log('ℹ️ VISIBILITY: Aucune session valide et aucun utilisateur connecté.');
          }
        } catch (error) {
          console.error('❌ VISIBILITY: Erreur lors de la gestion du changement de visibilité:', error);
          setUser(null);
          setOrganization(null);
          setSessions([]);
        } finally {
          setIsLoading(false);
          console.log('✅ VISIBILITY: Fin de la vérification de la session. isLoading est maintenant false.');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadUserData, user, isLoading]);

  const login = useCallback(async (email: string, password: string) => {
    console.log('🔐 LOGIN: Tentative de connexion pour:', email);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ LOGIN: Erreur de connexion:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ LOGIN: Connexion réussie, chargement des données...');
        await loadUserData(data.user);
      }
    } catch (error) {
      console.error('❌ LOGIN: Erreur lors de la connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('✅ LOGIN: Fin du processus de connexion. isLoading est maintenant false.');
    }
  }, [loadUserData]);

  const register = useCallback(async (formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    organizationCode?: string;
  }) => {
    console.log('📝 REGISTER: Tentative d\'inscription pour:', formData.email);
    setIsLoading(true);
    
    try {
      // Vérifier le code organisation si fourni
      let organizationId = null;
      if (formData.organizationCode) {
        console.log('🏢 REGISTER: Vérification du code organisation:', formData.organizationCode);
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('code', formData.organizationCode)
          .single();

        if (orgError || !orgData) {
          console.error('❌ REGISTER: Code d\'organisation invalide:', orgError);
          throw new Error('Code d\'organisation invalide.');
        }
        organizationId = orgData.id;
        console.log('✅ REGISTER: Organisation trouvée:', organizationId);
      }

      // Créer le compte Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          },
        },
      });

      if (error) {
        console.error('❌ REGISTER: Erreur lors de la création du compte Auth:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      console.log('✅ REGISTER: Compte Auth créé, insertion du profil...');

      // Insérer le profil dans la table users
      const { error: profileInsertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          organization_id: organizationId,
          organization_role: organizationId ? 'member' : null,
          credits: organizationId ? 0 : 1, // 1 crédit gratuit pour les comptes individuels
          simulations_used: 0,
        });

      if (profileInsertError) {
        console.error('❌ REGISTER: Erreur lors de l\'insertion du profil utilisateur:', profileInsertError);
        clearSupabaseTokensFromLocalStorage();
        throw profileInsertError;
      }

      console.log('✅ REGISTER: Profil utilisateur inséré avec succès');
      
    } catch (error) {
      console.error('❌ REGISTER: Erreur lors de l\'inscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('✅ REGISTER: Fin du processus d\'inscription. isLoading est maintenant false.');
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('🚪 LOGOUT: Début de la déconnexion');
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ LOGOUT: Erreur lors de la déconnexion:', error);
        throw error;
      }
      
      setUser(null);
      setOrganization(null);
      setSessions([]);
      clearSupabaseTokensFromLocalStorage();
      console.log('✅ LOGOUT: Déconnexion réussie');
      
    } catch (error) {
      console.error('❌ LOGOUT: Erreur de déconnexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('✅ LOGOUT: Fin du processus de déconnexion. isLoading est maintenant false.');
    }
  }, []);

  const getCreditsInfo = useCallback(() => {
    const currentCredits = user?.credits ?? 0;
    const simulationsLeft = user?.simulationsLeft ?? 0;
    return { credits: currentCredits, simulationsLeft };
  }, [user]);

  const saveSession = useCallback(async (result: SessionResult, config: TrainingConfig) => {
    if (!user) {
      console.warn('⚠️ SAVE_SESSION: Utilisateur non connecté, session non sauvegardée.');
      return;
    }

    console.log('💾 SAVE_SESSION: Sauvegarde de la session...');
    
    try {
      const { error } = await supabase.from('sessions').insert({
        user_id: user.id,
        target: config.target,
        difficulty: config.difficulty,
        score: result.score,
        duration: result.duration,
        feedback: result.feedback,
        recommendations: result.recommendations,
        improvements: result.improvements || [],
        detailed_analysis: result.detailedAnalysis,
      });

      if (error) {
        console.error('❌ SAVE_SESSION: Erreur lors de la sauvegarde:', error);
        throw error;
      }

      console.log('✅ SAVE_SESSION: Session sauvegardée avec succès');
      
      // Refresh user data to update sessions list
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await loadUserData(currentUser);
      }
    } catch (error) {
      console.error('❌ SAVE_SESSION: Erreur lors de la sauvegarde de la session:', error);
    }
  }, [user, loadUserData]);

  const useCreditForSimulation = useCallback(async () => {
    if (!user) {
      console.warn('⚠️ USE_CREDIT: Utilisateur non connecté.');
      return false;
    }

    if (user.simulationsLeft <= 0) {
      console.warn('⚠️ USE_CREDIT: Plus de simulations disponibles.');
      return false;
    }

    console.log('💳 USE_CREDIT: Consommation d\'un crédit...');
    
    try {
      if (user.organizationId) {
        // Consume credit from organization
        const { error: rpcError } = await supabase.rpc('consume_organization_simulation', {
          p_organization_id: user.organizationId,
        });

        if (rpcError) {
          console.error('❌ USE_CREDIT: Erreur RPC lors de la consommation du crédit d\'organisation:', rpcError);
          throw rpcError;
        }
        console.log('✅ USE_CREDIT: Crédit d\'organisation consommé');
      } else {
        // Consume credit from individual user
        const { data: updatedUser, error: fetchError } = await supabase
          .from('users')
          .select('credits, simulations_used')
          .eq('id', user.id)
          .single();

        if (fetchError || !updatedUser) {
          console.error('❌ USE_CREDIT: Erreur lors de la récupération des crédits utilisateur:', fetchError);
          throw fetchError;
        }

        let newCredits = updatedUser.credits;
        let newSimulationsUsed = updatedUser.simulations_used + 1;

        if (newSimulationsUsed >= 3) {
          if (newCredits <= 0) {
            throw new Error('Plus de crédits disponibles.');
          }
          newCredits -= 1;
          newSimulationsUsed = 0;
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({
            credits: newCredits,
            simulations_used: newSimulationsUsed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('❌ USE_CREDIT: Erreur lors de la mise à jour des crédits utilisateur:', updateError);
          throw updateError;
        }
        console.log('✅ USE_CREDIT: Crédit individuel consommé');
      }

      // Refresh user data after credit consumption
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await loadUserData(currentUser);
      }
      return true;
    } catch (error) {
      console.error('❌ USE_CREDIT: Erreur lors de la consommation du crédit:', error);
      return false;
    }
  }, [user, loadUserData]);

  const canUseFreeTrial = useCallback(() => {
    return !freeTrialUsed;
  }, [freeTrialUsed]);

  const useFreeTrial = useCallback(() => {
    if (!freeTrialUsed) {
      localStorage.setItem('ring_academy_free_trial_used', 'true');
      setFreeTrialUsed(true);
      console.log('🎁 FREE_TRIAL: Essai gratuit utilisé');
    }
  }, [freeTrialUsed]);

  const createOrg = useCallback(async (name: string) => {
    if (!user) throw new Error('Utilisateur non connecté.');
    if (organization) throw new Error('Vous appartenez déjà à une organisation.');

    console.log('🏢 CREATE_ORG: Création d\'organisation:', name);
    setIsLoading(true);
    
    try {
      const orgCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          code: orgCode,
          owner_id: user.id,
          credits: user.credits,
          simulations_used: user.credits * 3 - user.simulationsLeft,
        })
        .select()
        .single();

      if (orgError) {
        console.error('❌ CREATE_ORG: Erreur lors de la création de l\'organisation:', orgError);
        throw orgError;
      }

      // Update user's organization_id and role
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          organization_id: newOrg.id,
          organization_role: 'owner',
          credits: 0,
          simulations_used: 0,
        })
        .eq('id', user.id);

      if (userUpdateError) {
        console.error('❌ CREATE_ORG: Erreur lors de la mise à jour de l\'utilisateur:', userUpdateError);
        throw userUpdateError;
      }

      console.log('✅ CREATE_ORG: Organisation créée avec succès');
      
      // Refresh user data
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await loadUserData(currentUser);
      }
    } catch (error) {
      console.error('❌ CREATE_ORG: Erreur lors de la création de l\'organisation:', error);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('✅ CREATE_ORG: Fin du processus de création d\'organisation. isLoading est maintenant false.');
    }
  }, [user, organization, loadUserData]);

  const getOrgMembers = useCallback(() => {
    // Cette fonction nécessiterait une requête à la base de données
    // Pour l'instant, retourner un tableau vide
    return [];
  }, []);

  const removeMember = useCallback(async (memberId: string) => {
    if (!user || user.organizationRole !== 'owner' || !organization) {
      throw new Error('Accès non autorisé.');
    }

    console.log('👥 REMOVE_MEMBER: Suppression du membre:', memberId);
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          organization_id: null, 
          organization_role: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('organization_id', organization.id);

      if (error) {
        console.error('❌ REMOVE_MEMBER: Erreur lors de la suppression:', error);
        throw error;
      }

      console.log('✅ REMOVE_MEMBER: Membre supprimé avec succès');
      
      // Refresh user data
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await loadUserData(currentUser);
      }
    } catch (error) {
      console.error('❌ REMOVE_MEMBER: Erreur lors de la suppression du membre:', error);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('✅ REMOVE_MEMBER: Fin du processus de suppression. isLoading est maintenant false.');
    }
  }, [user, organization, loadUserData]);

  const getOrgSessions = useCallback(() => {
    // Cette fonction nécessiterait une requête à la base de données
    // Pour l'instant, retourner un tableau vide
    return [];
  }, []);

  const addCredits = useCallback(async (amount: number) => {
    if (!user) throw new Error('Utilisateur non connecté.');
    if (user.organizationId) throw new Error('Les crédits sont gérés par votre organisation.');

    console.log('💰 ADD_CREDITS: Ajout de crédits individuels:', amount);
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          credits: user.credits + amount, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ ADD_CREDITS: Erreur lors de l\'ajout de crédits:', error);
        throw error;
      }
      
      console.log('✅ ADD_CREDITS: Crédits ajoutés avec succès');
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await loadUserData(currentUser);
      }
    } catch (error) {
      console.error('❌ ADD_CREDITS: Erreur lors de l\'ajout de crédits:', error);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('✅ ADD_CREDITS: Fin du processus d\'ajout de crédits. isLoading est maintenant false.');
    }
  }, [user, loadUserData]);

  const addCreditsToOrg = useCallback(async (amount: number) => {
    if (!user || user.organizationRole !== 'owner' || !organization) {
      throw new Error('Accès non autorisé.');
    }

    console.log('🏢 ADD_ORG_CREDITS: Ajout de crédits à l\'organisation:', amount);
    setIsLoading(true);
    
    try {
      const { error: rpcError } = await supabase.rpc('add_organization_credits', {
        org_id: organization.id,
        amount: amount,
      });

      if (rpcError) {
        console.error('❌ ADD_ORG_CREDITS: Erreur RPC:', rpcError);
        throw rpcError;
      }
      
      console.log('✅ ADD_ORG_CREDITS: Crédits d\'organisation ajoutés avec succès');
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await loadUserData(currentUser);
      }
    } catch (error) {
      console.error('❌ ADD_ORG_CREDITS: Erreur lors de l\'ajout de crédits à l\'organisation:', error);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('✅ ADD_ORG_CREDITS: Fin du processus d\'ajout de crédits d\'organisation. isLoading est maintenant false.');
    }
  }, [user, organization, loadUserData]);

  const value = useMemo(() => ({
    user,
    organization,
    sessions,
    isLoading,
    login,
    register,
    logout,
    getCreditsInfo,
    saveSession,
    useCreditForSimulation,
    canUseFreeTrial,
    useFreeTrial,
    createOrg,
    getOrgMembers,
    removeMember,
    getOrgSessions,
    addCredits,
    addCreditsToOrg,
  }), [
    user,
    organization,
    sessions,
    isLoading,
    login,
    register,
    logout,
    getCreditsInfo,
    saveSession,
    useCreditForSimulation,
    canUseFreeTrial,
    useFreeTrial,
    createOrg,
    getOrgMembers,
    removeMember,
    getOrgSessions,
    addCredits,
    addCreditsToOrg,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};