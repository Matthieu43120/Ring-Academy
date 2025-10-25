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

// Utility function for fetch with timeout
async function fetchWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeout} ms`)), timeout)
    )
  ]);
}

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
  getOrgSessions: () => Promise<SessionRecord[]>;
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

  const isFetchingData = useRef(false);

  // Function to load user data from Supabase
  const loadUserData = useCallback(async (supabaseUser: any | null) => {
    if (isFetchingData.current) {
      console.log('⚠️ loadUserData: Une récupération de données est déjà en cours. Annulation de l\'appel concurrent.');
      return;
    }

    isFetchingData.current = true;
    console.log('⏳ loadUserData: Début du chargement des données utilisateur pour', supabaseUser?.id || 'aucun utilisateur');
    setIsLoading(true);
    
    try {
      if (!supabaseUser) {
        console.log('ℹ️ loadUserData: Aucun utilisateur fourni, réinitialisation de l\'état.');
        setUser(null);
        setOrganization(null);
        setSessions([]);
        return;
      }

      // Fetch user profile
      console.log('⏳ loadUserData: Tentative de récupération du profil utilisateur...');
      const { data: profile, error: profileError } = await fetchWithTimeout(
        supabase.from('users').select('*').eq('id', supabaseUser.id).single(),
        10000 // 10 seconds timeout
      );

      if (profileError) {
        console.error('❌ loadUserData: Erreur lors de la récupération du profil:', profileError);
        throw profileError;
      }
      console.log('✅ loadUserData: Profil utilisateur récupéré:', profile);

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
        console.log('⏳ loadUserData: Tentative de récupération de l\'organisation:', profile.organization_id);
        const { data: orgData, error: orgError } = await fetchWithTimeout(
          supabase.from('organizations').select('*').eq('id', profile.organization_id).single(),
          10000 // 10 seconds timeout
        );

        if (orgError) {
          console.error('❌ loadUserData: Erreur lors de la récupération de l\'organisation:', orgError);
          throw orgError;
        }
        console.log('✅ loadUserData: Organisation récupérée:', orgData);
        
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
        console.log('ℹ️ loadUserData: Aucune organisation pour cet utilisateur');
        setOrganization(null);
      }

      // Fetch user sessions
      console.log('⏳ loadUserData: Tentative de récupération des sessions utilisateur...');
      const { data: userSessions, error: sessionsError } = await fetchWithTimeout(
        supabase.from('training_sessions').select('*').eq('user_id', supabaseUser.id).order('created_at', { ascending: false }),
        10000 // 10 seconds timeout
      );

      if (sessionsError) {
        console.error('❌ loadUserData: Erreur lors de la récupération des sessions:', sessionsError);
        throw sessionsError;
      }
      console.log('✅ loadUserData: Sessions utilisateur récupérées:', userSessions?.length || 0, 'sessions');

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
      console.error('❌ loadUserData: Erreur globale lors du chargement des données utilisateur:', error);
      setUser(null);
      setOrganization(null);
      setSessions([]);
    } finally {
      isFetchingData.current = false;
      setIsLoading(false);
      console.log('✅ loadUserData: Fin du processus loadUserData. isLoading est maintenant false.');
    }
  }, []);

  // Initial session check
  useEffect(() => {
    console.log('🔧 INIT: Initialisation AuthContext');
    const getInitialSession = async () => {
      console.log('🚀 INIT: Récupération de la session initiale...');
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
          await loadUserData(null); // Call loadUserData to clear state and set isLoading(false)
        }
      } catch (error) {
        console.error('❌ INIT: Erreur critique lors de la récupération de la session initiale:', error);
        await loadUserData(null); // Call loadUserData to clear state and set isLoading(false)
        setOrganization(null);
        setSessions([]);
      } finally {
        console.log('✅ INIT: Fin de la récupération de la session initiale. isLoading est maintenant false.');
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔄 AUTH_CHANGE: Auth state change: ${event} userId: ${session?.user?.id || 'N/A'}`);
      
      // Éviter de traiter les événements redondants
      if (event === 'INITIAL_SESSION') {
        console.log('ℹ️ AUTH_CHANGE: INITIAL_SESSION ignoré (déjà traité par getInitialSession)');
        return;
      }
      
      try {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            console.log(`✅ AUTH_CHANGE: ${event} détecté, chargement des données...`);
            await loadUserData(session.user);
          } else {
            console.log(`ℹ️ AUTH_CHANGE: ${event} détecté mais pas de session.user, nettoyage...`);
            await loadUserData(null); // Clear state
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('✅ AUTH_CHANGE: SIGNED_OUT détecté, nettoyage des données...');
          await loadUserData(null); // Clear state
          clearSupabaseTokensFromLocalStorage(); // Explicit cleanup on sign out
        } else {
          console.log(`ℹ️ AUTH_CHANGE: Événement ${event} non géré ou pas de session.user, nettoyage...`);
          await loadUserData(null); // Default to clearing state
        }
      } catch (error) {
        console.error('❌ AUTH_CHANGE: Erreur lors du traitement de l\'état d\'authentification:', error);
        await loadUserData(null); // Clear state on error
      } finally {
        console.log(`✅ AUTH_CHANGE: Fin du traitement de l'état d'authentification.`);
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
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('❌ VISIBILITY: Erreur lors de la vérification de la session:', error);
            throw error;
          }
          
          if (session?.user) {
            console.log('✅ VISIBILITY: Session valide trouvée, rafraîchissement des données...');
            await loadUserData(session.user);
          } else {
            console.log('ℹ️ VISIBILITY: Aucune session valide, nettoyage des données utilisateur...');
            await loadUserData(null); // Clear state
          }
        } catch (error) {
          console.error('❌ VISIBILITY: Erreur lors de la gestion du changement de visibilité:', error);
          await loadUserData(null); // Clear state on error
        } finally {
          console.log('✅ VISIBILITY: Fin de la vérification de la session.');
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
      } else {
        console.log('ℹ️ LOGIN: Connexion réussie mais pas de user, nettoyage...');
        await loadUserData(null);
      }
    } catch (error) {
      console.error('❌ LOGIN: Erreur lors de la connexion:', error);
      throw error;
    } finally {
      console.log('✅ LOGIN: Fin du processus de connexion.');
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
    // Force Git detection: Using Edge Function for secure profile creation
    console.log('📝 REGISTER: Tentative d\'inscription pour:', formData.email);
    try {
      // Vérifier le code organisation si fourni
      let organizationId = null;
      if (formData.organizationCode) {
        console.log('🏢 REGISTER: Vérification du code organisation:', formData.organizationCode);
        // Appeler la nouvelle fonction RPC pour vérifier le code d'organisation de manière sécurisée
        const { data: orgIdFromRpc, error: rpcError } = await supabase.rpc('verify_organization_code', {
          p_organization_code: formData.organizationCode
        });

        if (rpcError || !orgIdFromRpc) {
          throw new Error('Code d\'organisation invalide.');
        }
        organizationId = orgIdFromRpc;
        console.log('✅ REGISTER: Organisation trouvée:', organizationId);
      }

      // Créer le compte Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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

      if (signUpError) {
        console.error('❌ REGISTER: Erreur lors de la création du compte Auth:', signUpError);
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Erreur lors de la création du compte utilisateur.');
      }

      console.log('✅ REGISTER: Compte Auth créé, insertion du profil... (ID utilisateur: ' + signUpData.user.id + ')');

      // NOUVEAU: Appeler la fonction Edge pour insérer le profil utilisateur
      const profileInsertResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: signUpData.user.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          organizationId: organizationId,
          organizationRole: organizationId ? 'member' : null,
          credits: organizationId ? 0 : 1, // 1 crédit gratuit pour les comptes individuels
          simulationsUsed: 0,
        }),
      });

      if (!profileInsertResponse.ok) {
        const errorData = await profileInsertResponse.json();
        console.error('❌ REGISTER: Erreur lors de l\'insertion du profil utilisateur via Edge Function:', errorData);
        throw new Error(errorData.error || 'Erreur lors de l\'insertion du profil utilisateur.');
      }

      console.log('✅ REGISTER: Profil utilisateur inséré avec succès via Edge Function');
      
    } catch (error) {
      console.error('❌ REGISTER: Erreur lors de l\'inscription:', error);
      throw error;
    } finally {
      console.log('✅ REGISTER: Fin du processus d\'inscription.');
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('🚪 LOGOUT: Début de la déconnexion');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ LOGOUT: Erreur lors de la déconnexion:', error);
        throw error;
      }
      
      await loadUserData(null);
      clearSupabaseTokensFromLocalStorage(); // Explicit cleanup on sign out
      console.log('✅ LOGOUT: Déconnexion réussie');
      
    } catch (error) {
      console.error('❌ LOGOUT: Erreur de déconnexion:', error);
      throw error;
    } finally {
      console.log('✅ LOGOUT: Fin du processus de déconnexion.');
    }
  }, [loadUserData]);

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
      const { error } = await supabase.from('training_sessions').insert({
        user_id: user.id,
        target: config.target,
        difficulty: config.difficulty,
        score: result.score,
        duration: result.duration,
        feedback: result.feedback,
        recommendations: result.recommendations,
        improvements: result.improvements || [],
        detailed_analysis: result.detailedAnalysis,
        criteria_scores: result.criteriaScores || null,
        recurrent_errors: result.recurrentErrors || null,
        main_objective: result.mainObjective || null,
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
          console.error('❌ USE_CREDIT: Erreur de mise à jour des crédits utilisateur:', updateError);
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
    
    try {
      const orgCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: name,
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
      console.log('✅ CREATE_ORG: Fin du processus de création d\'organisation.');
    }
  }, [user, organization, loadUserData]);

  // IMPLÉMENTATION DE getOrgMembers
  const getOrgMembers = useCallback(async (): Promise<UserProfile[]> => {
    if (!user || user.organizationRole !== 'owner' || !organization) {
      console.warn('⚠️ getOrgMembers: Accès non autorisé ou pas d\'organisation.');
      return [];
    }

    console.log('👥 FETCH_ORG_MEMBERS: Récupération des membres de l\'organisation:', organization.id);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organization.id);

      if (error) {
        console.error('❌ FETCH_ORG_MEMBERS: Erreur lors de la récupération des membres:', error);
        throw error;
      }

      const members: UserProfile[] = (data || []).map(member => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        phone: member.phone,
        credits: member.credits,
        simulationsLeft: member.credits * 3 - member.simulations_used,
        organizationId: member.organization_id,
        organizationRole: member.organization_role,
      }));
      console.log('✅ FETCH_ORG_MEMBERS: Membres récupérés:', members.length);
      return members;
    } catch (error) {
      console.error('❌ FETCH_ORG_MEMBERS: Erreur lors de la récupération des membres:', error);
      return [];
    }
  }, [user, organization]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!user || user.organizationRole !== 'owner' || !organization) {
      throw new Error('Accès non autorisé.');
    }

    console.log('👥 REMOVE_MEMBER: Suppression du membre:', memberId);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          organization_id: null,
          organization_role: null,
          updated_at: new Date().toISOString(),
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
      console.log('✅ REMOVE_MEMBER: Fin du processus de suppression.');
    }
  }, [user, organization, loadUserData]);

  // IMPLÉMENTATION DE getOrgSessions
  const getOrgSessions = useCallback(async (): Promise<SessionRecord[]> => {
    if (!user || user.organizationRole !== 'owner' || !organization) {
      console.warn('⚠️ getOrgSessions: Accès non autorisé ou pas d\'organisation.');
      return [];
    }

    console.log('📊 FETCH_ORG_SESSIONS: Récupération des sessions de l\'organisation:', organization.id);
    try {
      // First, get all member IDs for the organization
      const { data: membersData, error: membersError } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', organization.id);

      if (membersError) {
        console.error('❌ FETCH_ORG_SESSIONS: Erreur lors de la récupération des IDs des membres:', membersError);
        throw membersError;
      }

      const memberIds = (membersData || []).map(member => member.id);

      if (memberIds.length === 0) {
        console.log('ℹ️ FETCH_ORG_SESSIONS: Aucune session à récupérer car aucun membre dans l\'organisation.');
        return [];
      }

      // Then, fetch all sessions for these member IDs
      const { data: orgSessionsData, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('*')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('❌ FETCH_ORG_SESSIONS: Erreur lors de la récupération des sessions:', sessionsError);
        throw sessionsError;
      }

      const formattedSessions: SessionRecord[] = (orgSessionsData || []).map(session => ({
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
      console.log('✅ FETCH_ORG_SESSIONS: Sessions d\'organisation récupérées:', formattedSessions.length);
      return formattedSessions;
    } catch (error) {
      console.error('❌ FETCH_ORG_SESSIONS: Erreur lors de la récupération des sessions d\'organisation:', error);
      return [];
    }
  }, [user, organization]);

  const addCredits = useCallback(async (amount: number) => {
    if (!user) throw new Error('Utilisateur non connecté.');
    if (user.organizationId) throw new Error('Les crédits sont gérés par votre organisation.');

    console.log('💰 ADD_CREDITS: Ajout de crédits individuels:', amount);
    
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
      console.log('✅ ADD_CREDITS: Fin du processus d\'ajout de crédits.');
    }
  }, [user, loadUserData]);

  const addCreditsToOrg = useCallback(async (amount: number) => {
    if (!user || user.organizationRole !== 'owner' || !organization) {
      throw new Error('Accès non autorisé.');
    }

    console.log('🏢 ADD_ORG_CREDITS: Ajout de crédits à l\'organisation:', amount);
    
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
      console.log('✅ ADD_ORG_CREDITS: Fin du processus d\'ajout de crédits d\'organisation.');
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