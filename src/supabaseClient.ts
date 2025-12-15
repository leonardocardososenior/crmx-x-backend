import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Create Supabase client for general operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client with service role for admin operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types for TypeScript support
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          role: string;
          manager_id: string | null;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          role?: string;
          manager_id?: string | null;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          manager_id?: string | null;
          email?: string;
          created_at?: string;
        };
      };
      account: {
        Row: {
          id: string;
          name: string;
          segment: string;
          responsible_id: string;
          status: string;
          type: string;
          pipeline: string;
          last_interaction: string;
          email: string | null;
          phone: string | null;
          cnpj: string | null;
          instagram: string | null;
          linkedin: string | null;
          whatsapp: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          segment: string;
          responsible_id: string;
          status?: string;
          type?: string;
          pipeline?: string;
          last_interaction?: string;
          email?: string | null;
          phone?: string | null;
          cnpj?: string | null;
          instagram?: string | null;
          linkedin?: string | null;
          whatsapp?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          segment?: string;
          responsible_id?: string;
          status?: string;
          type?: string;
          pipeline?: string;
          last_interaction?: string;
          email?: string | null;
          phone?: string | null;
          cnpj?: string | null;
          instagram?: string | null;
          linkedin?: string | null;
          whatsapp?: string | null;
          created_at?: string;
        };
      };
      business: {
        Row: {
          id: string;
          title: string;
          account_id: string;
          value: number;
          currency: string;
          stage: string;
          probability: number | null;
          owner_id: string | null;
          closing_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          account_id: string;
          value: number;
          currency?: string;
          stage: string;
          probability?: number | null;
          owner_id?: string | null;
          closing_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          account_id?: string;
          value?: number;
          currency?: string;
          stage?: string;
          probability?: number | null;
          owner_id?: string | null;
          closing_date?: string | null;
          created_at?: string;
        };
      };
    };
  };
}