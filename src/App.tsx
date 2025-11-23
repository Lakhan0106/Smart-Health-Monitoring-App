import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/useAuthStore';

// Pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import SignInPage from './pages/SignInPage';
import MainDashboard from './pages/MainDashboard';
import DoctorBot from './pages/DoctorBot';
import SymptomChecker from './pages/SymptomChecker';
import LiveHeartDashboard from './pages/LiveHeartDashboard';
import AssignPatients from './pages/AssignPatients';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { setSupabaseUser, setLoading, fetchUserProfile } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSupabaseUser, setLoading, fetchUserProfile]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/signin" element={<SignInPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor-bot"
          element={
            <ProtectedRoute>
              <DoctorBot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/symptom-checker"
          element={
            <ProtectedRoute>
              <SymptomChecker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-heart-dashboard"
          element={
            <ProtectedRoute>
              <LiveHeartDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assign-patients"
          element={
            <ProtectedRoute>
              <AssignPatients />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
