import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    gender: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 150) {
      toast.error('Please enter a valid age');
      return false;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email');
      return false;
    }
    if (!formData.gender) {
      toast.error('Please select gender');
      return false;
    }
    if (!formData.phone.match(/^[0-9]{10}$/)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!formData.role) {
      toast.error('Please select a role');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create auth user with auto-confirm
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender,
            phone: formData.phone,
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Wait a moment for auth to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: formData.name,
            age: parseInt(formData.age),
            email: formData.email,
            gender: formData.gender,
            phone: formData.phone,
            role: formData.role as 'Patient' | 'Caretaker',
          } as any);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        toast.success('Registration successful! Please sign in.');
        navigate('/signin');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8 group transition-all hover:scale-105"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </Link>

        <div className="card-gradient animate-fadeIn shadow-2xl border-0">
          <div className="text-center mb-10">
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-20"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                <Activity className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-gray-600 text-lg">Join Smart Health Monitoring System</p>
            <div className="flex justify-center mt-4 space-x-1">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="group">
                <label htmlFor="name" className="label">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="group">
                <label htmlFor="age" className="label">
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="input-field focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="25"
                  min="1"
                  max="150"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="email" className="label">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group">
                <label htmlFor="gender" className="label">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="group">
                <label htmlFor="phone" className="label">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group">
                <label htmlFor="password" className="label">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <div className="group">
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="role" className="label">
                Register As *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              >
                <option value="">Select Role</option>
                <option value="Patient">Patient</option>
                <option value="Caretaker">Caretaker</option>
              </select>
              <div className="mt-3 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                <p className="text-sm text-gray-700">
                  {formData.role === 'Patient' && (
                    <>
                      <span className="font-semibold text-blue-600">📊 Patient:</span> Access health monitoring and AI assistance
                    </>
                  )}
                  {formData.role === 'Caretaker' && (
                    <>
                      <span className="font-semibold text-green-600">👨‍⚕️ Caretaker:</span> Monitor and manage multiple patients
                    </>
                  )}
                  {!formData.role && (
                    <>Select a role to see role-specific features</>
                  )}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full flex items-center justify-center space-x-3 text-lg py-4 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/signin"
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted by healthcare professionals worldwide</p>
          <div className="flex justify-center items-center space-x-8 text-xs text-gray-400">
            <span>🔒 HIPAA Compliant</span>
            <span>🛡️ Secure & Private</span>
            <span>⚡ Real-time Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
}
