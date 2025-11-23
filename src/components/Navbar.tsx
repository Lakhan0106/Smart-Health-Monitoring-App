import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Activity, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative">
              <Activity className="h-9 w-9 text-primary-600 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Smart Health
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-6">
              {/* User Info Card */}
              <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:shadow-md transition-all">
                <div className="relative">
                  <User className="h-5 w-5 text-gray-600" />
                  <div className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${
                    user.role === 'Patient' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className={`text-xs font-medium ${
                    user.role === 'Patient' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="group flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 transition-all hover:scale-105"
              >
                <LogOut className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-6 space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                <User className="h-6 w-6 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className={`text-sm font-medium ${
                    user.role === 'Patient' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 text-red-600 transition-all hover:scale-105"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
