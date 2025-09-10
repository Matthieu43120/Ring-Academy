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
    setFreeTrialUsed(localStorage.getItem('ring_academy_free_trial_used') === 'true');

    // Gestionnaire pour rafraîchir la session quand l'onglet redevient visible
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        try {
          console.log('🔄 Onglet redevenu visible, vérification de la session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Erreur lors de la vérification de session:', error);
            // Déconnexion propre en cas d'erreur de session
            await supabase.auth.signOut();
            return;
          }
          
          if (session?.user && user.id === session.user.id) {
            // Session valide, recharger les données utilisateur pour s'assurer qu'elles sont à jour
            console.log('✅ Session valide, rechargement des données...');
            await loadUserData(session.user.id);
          } else if (!session) {
            // Pas de session valide, déconnecter proprement
            console.log('⚠️ Pas de session valide, déconnexion...');
            await supabase.auth.signOut();
          }
        } catch (error) {
          console.error('❌ Erreur lors de la vérification de visibilité:', error);
          // En cas d'erreur, déconnecter proprement
          await supabase.auth.signOut();
        }
      }
    };

    // Ajouter l'écouteur d'événement
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Récupérer la session actuelle
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erreur récupération session:', error);
          // Si le token de rafraîchissement est invalide, déconnecter l'utilisateur
          await supabase.auth.signOut();
        } else if (session?.user) {
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error('Erreur initialisation session:', error);
        // En cas d'erreur, s'assurer que l'utilisateur est déconnecté
        await supabase.auth.signOut();
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoading(true);
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setOrganization(null);
        setSessions([]);
        setOrgMembers([]);
        setOrgSessions([]);
      }
      
      setIsLoading(false);
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    console.log('📊 Chargement des données utilisateur pour:', userId);
    try {
      // Charger le profil utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        // Gérer spécifiquement l'erreur de récursion infinie RLS
        if (userError.code === '42P17' || userError.message?.includes('infinite recursion')) {
          console.error('❌ Erreur RLS récursion infinie, déconnexion...');
          await supabase.auth.signOut();
          setUser(null);
          return;
        }
        // Si erreur de récursion RLS ou autre erreur critique, déconnecter l'utilisateur
        if (userError.code === '42P17' || userError.message?.includes('infinite recursion')) {
          await logout();
        }
        console.error('❌ Erreur chargement profil utilisateur:', userError);
        // En cas d'erreur de chargement, déconnecter proprement
        await supabase.auth.signOut();
        return;
      }

      if (userData) {
        console.log('✅ Données utilisateur chargées avec succès');
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
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userData.organization_id)
            .single();

          if (!orgError && orgData) {
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
            await loadOrgMembers(orgData.id);
            await loadOrgSessions(orgData.id);
          }
        }

        // Charger les sessions de l'utilisateur
        await loadUserSessions(userId);
      }
    } catch (error) {
      console.error('❌ Erreur critique lors du chargement des données:', error);
      // En cas d'erreur critique, déconnecter proprement
      await supabase.auth.signOut();
    }
  };

  const loadUserSessions = async (userId: string) => {
    try {
      const { data: sessionsData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && sessionsData) {
        const userSessions: SessionData[] = sessionsData.map(session => ({
          id: session.id,
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
      }
    } catch (error) {
    }
  };

  const loadOrgMembers = async (orgId: string) => {
    try {
      const { data: membersData, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', orgId);

      if (!error && membersData) {
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
      }
    } catch (error) {
    }
  };

  const loadOrgSessions = async (orgId: string) => {
    try {
      // Étape 1: Récupérer les IDs de tous les utilisateurs appartenant à cette organisation
      const { data: memberIdsData, error: memberIdsError } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', orgId); // Récupérer uniquement les membres de cette organisation spécifique

      if (memberIdsError || !memberIdsData) {
        console.error('Erreur chargement IDs des membres de l\'organisation:', memberIdsError);
        setOrgSessions([]); // S'assurer que l'état est vidé en cas d'erreur
        return;
      }

      const memberUserIds = memberIdsData.map(m => m.id);
        
      if (memberUserIds.length === 0) {
        setOrgSessions([]);
        return;
      }
        
      // Étape 2: Récupérer les sessions pour ces IDs d'utilisateurs spécifiques
      // La politique RLS sur 'sessions' s'appliquera toujours ici, mais la requête est plus ciblée.
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
        setOrgSessions([]); // S'assurer que l'état est vidé en cas d'erreur
      }
    } catch (error) {
      setOrgSessions([]); // S'assurer que l'état est vidé en cas d'erreur
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        await loadUserData(data.user.id);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Créer le compte d'authentification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: 'https://ringacademy.fr/login'
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // Préparer les données du profil utilisateur
      let organizationId = null;
      let organizationRole = null;

      // Si un code organisation est fourni, récupérer l'organisation
      if (userData.organizationCode) {
        // Appeler la fonction RPC pour obtenir l'organisation par code, en contournant RLS
        const { data: orgDataArray, error: orgError } = await supabase
          .rpc('get_organization_by_code', { p_code: userData.organizationCode });

        if (orgError) {
          throw new Error('Erreur lors de la récupération de l\'organisation.');
        }

        if (!orgDataArray || orgDataArray.length === 0) {
          throw new Error('Code organisation invalide');
        }

        const orgData = orgDataArray[0]; // La fonction RPC retourne un tableau, prendre le premier élément
        organizationId = orgData.id;
        organizationRole = 'member';
      }

      // Attendre un peu pour que l'authentification soit complètement établie

      // Insérer le profil utilisateur
      try {
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
          // Relancer l'erreur Supabase originale pour un diagnostic complet
          throw profileError;
        }
      } catch (profileError: any) {
        // Si l'insertion du profil échoue, supprimer l'utilisateur d'authentification
        await supabase.auth.signOut();
        throw new Error(profileError?.message || 'Erreur lors de la création du profil utilisateur via RPC');
      }

      // Charger les données utilisateur
      await loadUserData(authData.user.id);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
      }
      
      // Les états seront réinitialisés par onAuthStateChange
    } catch (error) {
      console.error('❌ Erreur critique lors de la déconnexion:', error);
    } finally {
      // S'assurer que l'état de chargement est réinitialisé même en cas d'erreur
      setIsLoading(false);
    }
  };

  const createOrg = async (name: string): Promise<Organization> => {
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
        throw new Error('Erreur lors de la création de l\'organisation');
      }

      // Mettre à jour l'utilisateur pour l'associer à l'organisation
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
        throw new Error('Erreur lors de la mise à jour du profil utilisateur');
      }

      // Recharger les données utilisateur
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

      return newOrg;
    } catch (error) {
      throw error;
    }
  };

  const joinOrg = async (code: string): Promise<void> => {
    if (!user) throw new Error('Utilisateur non connecté');
    
    try {
      // Appeler la nouvelle fonction RPC pour obtenir l'organisation par code, en contournant RLS
      const { data: orgDataArray, error: orgError } = await supabase
        .rpc('get_organization_by_code', { p_code: code });

      if (orgError) {
        throw new Error('Erreur lors de la récupération de l\'organisation.');
      }

      if (!orgDataArray || orgDataArray.length === 0) {
        throw new Error('Code organisation invalide');
      }

      const orgData = orgDataArray[0]; // La fonction RPC retourne un tableau, prendre le premier élément

      // Mettre à jour l'utilisateur pour l'associer à l'organisation
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          organization_id: orgData.id,
          organization_role: 'member'
        })
        .eq('id', user.id);

      if (userUpdateError) {
        throw new Error('Erreur lors de l\'association à l\'organisation');
      }

      // Recharger les données utilisateur
      await loadUserData(user.id);
    } catch (error) {
      throw error;
    }
  };

  const getOrgMembers = (): User[] => {
    return orgMembers;
  };

  const saveSession = async (sessionResult: any, config: any): Promise<void> => {
    if (!user) return;

    try {
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
      }
    } catch (error) {
    }
  };

  const useCreditForSimulation = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // 1. Toujours incrémenter le compteur de simulations de l'utilisateur individuel (celui-ci ne sera jamais remis à zéro)
      const newIndividualUserSimulationsUsed = user.simulationsUsed + 1;
      const { error: userIndividualUpdateError } = await supabase
        .from('users')
        .update({
          simulations_used: newIndividualUserSimulationsUsed
        })
        .eq('id', user.id);

      if (userIndividualUpdateError) {
        return false; // Échec critique si nous ne pouvons même pas mettre à jour le compteur de l'utilisateur
      }

      // 2. Gérer la logique de consommation des crédits en fonction du statut de l'organisation
      if (user.organizationId && organization) {
        // L'utilisateur fait partie d'une organisation : appeler la fonction RPC pour consommer une simulation
        const { error: rpcError } = await supabase.rpc('consume_organization_simulation', {
          p_organization_id: organization.id
        });

        if (rpcError) {
          // Annuler le compteur de simulations individuel de l'utilisateur si l'appel RPC échoue
          await supabase.from('users').update({ simulations_used: user.simulationsUsed }).eq('id', user.id);
          return false;
        }
      } else {
        // L'utilisateur est un individu (ne fait pas partie d'une organisation) : mettre à jour ses propres crédits et réinitialiser son compteur de simulations pour la déduction des crédits
        let newIndividualCredits = user.credits;
        let newIndividualSimulationsUsedForCreditDeduction = newIndividualUserSimulationsUsed; // Utiliser la valeur déjà incrémentée

        if (newIndividualSimulationsUsedForCreditDeduction >= 3) {
          // Consommer un crédit et réinitialiser le compteur de l'utilisateur pour la déduction des crédits
          if (newIndividualCredits <= 0) {
            // Annuler le compteur de simulations individuel de l'utilisateur si pas de crédits
            await supabase.from('users').update({ simulations_used: user.simulationsUsed }).eq('id', user.id);
            return false;
          }
          newIndividualCredits -= 1;
          newIndividualSimulationsUsedForCreditDeduction = 0; // Réinitialiser le compteur de l'utilisateur pour la déduction des crédits
        }

        const { error: individualCreditUpdateError } = await supabase
          .from('users')
          .update({
            credits: newIndividualCredits,
            simulations_used: newIndividualSimulationsUsedForCreditDeduction // C'est le compteur de l'utilisateur pour la déduction des crédits
          })
          .eq('id', user.id);

        if (individualCreditUpdateError) {
          // Annuler le compteur de simulations individuel de l'utilisateur si la mise à jour échoue
          await supabase.from('users').update({ simulations_used: user.simulationsUsed }).eq('id', user.id);
          return false;
        }
      }

      // Recharger les données de l'utilisateur pour refléter toutes les modifications
      await loadUserData(user.id);
      return true;
    } catch (error) {
      return false;
    }
  };

  const addCredits = async (credits: number): Promise<void> => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          credits: (user.credits || 0) + credits
        })
        .eq('id', user.id);

      if (error) {
        throw new Error('Erreur lors de l\'ajout de crédits');
      }

      // Recharger les données
      await loadUserData(user.id);
    } catch (error) {
      throw error;
    }
  };

  const addCreditsToOrg = async (credits: number): Promise<void> => {
    if (!organization) return;
    
    try {
      const { error } = await supabase.rpc('add_organization_credits', {
        org_id: organization.id,
        amount: credits
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de l\'ajout de crédits à l\'organisation');
      }

      // Recharger les données
      if (user) {
        await loadUserData(user.id);
      }
    } catch (error) {
      throw error;
    }
  };

  const getCreditsInfo = (): { credits: number; simulationsLeft: number } => {
    if (!user) return { credits: 0, simulationsLeft: 0 };

    // Si l'utilisateur fait partie d'une organisation, retourner les crédits de l'organisation
    if (user.organizationId && organization) {
      const simulationsLeft = organization.credits * 3 - organization.simulationsUsed;
      return { credits: organization.credits, simulationsLeft };
    }

    const simulationsLeft = user.credits * 3 - user.simulationsUsed;
    return { credits: user.credits, simulationsLeft };
  };

  const canUseFreeTrial = (): boolean => {
    return !user && !freeTrialUsed;
  };

  const useFreeTrial = (): void => {
    localStorage.setItem('ring_academy_free_trial_used', 'true');
    setFreeTrialUsed(true);
  };

  const removeMember = async (userId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          organization_id: null,
          organization_role: null
        })
        .eq('id', userId);

      if (error) {
        throw new Error('Erreur lors de la suppression du membre');
      }

      // Recharger les membres de l'organisation
      if (organization) {
        await loadOrgMembers(organization.id);
      }
    } catch (error) {
      throw error;
    }
  };

  const getOrgSessions = (): SessionData[] => {
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