import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const { user, loading, supabaseUser } = useAuthStore();

  return {
    user,
    loading,
    supabaseUser,
  };
}
