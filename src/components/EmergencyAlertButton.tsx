import { useState } from 'react';
import { AlertTriangle, Phone } from 'lucide-react';
import { EmergencyAlertModal } from './EmergencyAlertModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface EmergencyAlertButtonProps {
  className?: string;
}

export function EmergencyAlertButton({ className = '' }: EmergencyAlertButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleEmergencyAlert = async () => {
    if (!user) {
      toast.error('Please log in to use emergency alerts');
      return;
    }

    setIsLoading(true);
    try {
      // Check if user has guardians registered
      const { data: guardians, error } = await supabase
        .from('guardians')
        .select('*')
        .eq('patient_id', user.id);

      if (error) {
        throw error;
      }

      if (!guardians || guardians.length === 0) {
        toast.error('Please add at least one emergency contact before sending alerts');
        setIsModalOpen(true);
        return;
      }

      setIsModalOpen(true);
    } catch (error) {
      console.error('Error checking guardians:', error);
      toast.error('Failed to check emergency contacts');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleEmergencyAlert}
        disabled={isLoading}
        className={`
          relative overflow-hidden
          bg-gradient-to-r from-red-500 via-red-600 to-red-700
          hover:from-red-600 hover:via-red-700 hover:to-red-800
          text-white font-bold py-4 px-6 rounded-xl
          shadow-lg hover:shadow-xl
          transform hover:scale-105 transition-all duration-300
          focus:outline-none focus:ring-4 focus:ring-red-500/50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {/* Pulsing animation overlay */}
        <div className="absolute inset-0 bg-red-400 animate-pulse opacity-20"></div>

        {/* Emergency icon */}
        <div className="relative flex items-center justify-center space-x-3">
          <div className="relative">
            <AlertTriangle className="h-6 w-6 animate-bounce" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-ping"></div>
          </div>

          <span className="text-lg font-bold tracking-wide">
            🚨 Emergency Alert
          </span>

          <Phone className="h-5 w-5" />
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-1000"></div>
      </button>

      <EmergencyAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
