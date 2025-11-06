import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single Supabase client instance to avoid multiple GoTrueClient instances
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

export const TABLES = {
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  TRANSACTION_ITEMS: 'transaction_items',
  CATEGORIES: 'categories',
  INVENTORY: 'inventory',
} as const;

// Helper function to handle errors
export function handleError(error: any) {
  console.error('Supabase error:', error);
  throw error;
}
