import { useState, useEffect } from 'react';
import { X, Send, Plus, MapPin, User, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { GuardianList } from './GuardianList';
import { AddGuardianForm } from './AddGuardianForm';

interface Guardian {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface EmergencyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyAlertModal({ isOpen, onClose }: EmergencyAlertModalProps) {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [selectedGuardians, setSelectedGuardians] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadGuardians();
      getCurrentLocation();
    }
  }, [isOpen, user]);

  const loadGuardians = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('guardians')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGuardians(data || []);
    } catch (error) {
      console.error('Error loading guardians:', error);
      toast.error('Failed to load emergency contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);

        // Provide specific error messages based on error code
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            toast.error('Location access denied. Please allow location access to send accurate emergency alerts.');
            break;
          case 2: // POSITION_UNAVAILABLE
            toast.error('Location information is unavailable. Please check your GPS settings.');
            break;
          case 3: // TIMEOUT
            toast.error('Location request timed out. Please try again.');
            break;
          default:
            toast.error('Unable to get current location. Emergency alert will be sent without location data.');
        }

        // Still allow sending alert without location if user confirms
        setUserLocation({ lat: 0, lng: 0 }); // Set fallback coordinates
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const handleGuardianSelect = (guardianId: string, selected: boolean) => {
    const newSelected = new Set(selectedGuardians);
    if (selected) {
      newSelected.add(guardianId);
    } else {
      newSelected.delete(guardianId);
    }
    setSelectedGuardians(newSelected);
  };

  const handleSendAlert = async () => {
    if (!user || selectedGuardians.size === 0) {
      toast.error('Please select at least one emergency contact');
      return;
    }

    setIsSending(true);
    try {
      // Get patient name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('Patient profile not found');
      }

      // Create Google Maps link (use fallback if location not available)
      const mapsUrl = userLocation && userLocation.lat !== 0
        ? `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`
        : 'Location unavailable';

      // Construct message
      const message = `⚠️ Emergency Alert: ${profile.name} is in distress!
${userLocation && userLocation.lat !== 0 ? `Current Location: ${mapsUrl}` : 'Location: Unavailable'}
Please check immediately.`;

      // Get selected guardians' details
      const selectedGuardiansData = guardians.filter(g => selectedGuardians.has(g.id));

      // Send alerts and log them
      const alertPromises = selectedGuardiansData.map(async (guardian) => {
        // Call the email API (this would be a Supabase Edge Function)
        const payload = {
          name: profile.name,
          emailAddresses: [guardian.email],
          location: {
            lat: userLocation?.lat || 0,
            lng: userLocation?.lng || 0,
            url: mapsUrl,
          },
        };

        const { data, error: emailError } = await supabase.functions.invoke('send-alert-sms', {
          body: JSON.stringify(payload),
        });

        if (emailError) {
          console.error('Email send error:', emailError);
          throw emailError;
        }

        console.log('Email send success:', data);

        // Log the alert
        const { error: logError } = await supabase
          .from('alerts_log')
          .insert({
            patient_id: user.id,
            guardian_id: guardian.id,
            message: message,
          });

        if (logError) {
          console.error('Alert log error:', logError);
          throw logError;
        }
      });

      await Promise.all(alertPromises);

      toast.success(`Emergency alert sent to ${selectedGuardians.size} contact(s)!`);
      onClose();

      // Reset selection
      setSelectedGuardians(new Set());
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      toast.error('Failed to send emergency alert');
    } finally {
      setIsSending(false);
    }
  };

  const handleGuardianAdded = () => {
    setShowAddForm(false);
    loadGuardians();
  };

  const handleGuardianDeleted = () => {
    loadGuardians();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Emergency Alert</h2>
                <p className="text-red-100">Send alert to emergency contacts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Location Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 text-blue-800">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">Location Status:</span>
              {userLocation ? (
                <span className="text-green-600">✓ Location acquired</span>
              ) : (
                <span className="text-orange-600">⚠ Getting location...</span>
              )}
            </div>
          </div>

          {/* Guardians Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Emergency Contacts
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Contact</span>
              </button>
            </div>

            {showAddForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <AddGuardianForm onSuccess={handleGuardianAdded} />
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : guardians.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No emergency contacts added yet.</p>
                <p className="text-sm">Add contacts to send emergency alerts.</p>
              </div>
            ) : (
              <GuardianList
                guardians={guardians}
                selectedGuardians={selectedGuardians}
                onGuardianSelect={handleGuardianSelect}
                onGuardianDelete={handleGuardianDeleted}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedGuardians.size > 0 && (
                <span>Selected: {selectedGuardians.size} contact(s)</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendAlert}
                disabled={selectedGuardians.size === 0 || isSending}
                className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Alert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
