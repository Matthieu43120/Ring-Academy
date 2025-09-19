import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key is missing in environment variables.');
  console.error('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage, // Utiliser sessionStorage au lieu de localStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types pour TypeScript basés sur le schéma de la base de données
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          credits: number;
          simulations_used: number;
          organization_id: string | null;
          organization_role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          credits?: number;
          simulations_used?: number;
          organization_id?: string | null;
          organization_role?: string | null;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          credits?: number;
          simulations_used?: number;
          organization_id?: string | null;
          organization_role?: string | null;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          code: string;
          owner_id: string;
          credits: number;
          simulations_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          code: string;
          owner_id: string;
          credits?: number;
          simulations_used?: number;
        };
        Update: {
          name?: string;
          code?: string;
          credits?: number;
          simulations_used?: number;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          target: string;
          difficulty: string;
          score: number;
          duration: number;
          feedback: string[];
          recommendations: string[];
          improvements: string[];
          detailed_analysis: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          target: string;
          difficulty: string;
          score: number;
          duration: number;
          feedback: string[];
          recommendations: string[];
          improvements: string[];
          detailed_analysis?: string | null;
        };
      };
    };
  };
}