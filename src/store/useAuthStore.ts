import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSupabaseUser: (user: SupabaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  supabaseUser: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  
  setSupabaseUser: (supabaseUser) => set({ supabaseUser }),
  
  setLoading: (loading) => set({ loading }),
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, supabaseUser: null });
  },
  
  fetchUserProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        set({ user: data as User });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  },
}));
