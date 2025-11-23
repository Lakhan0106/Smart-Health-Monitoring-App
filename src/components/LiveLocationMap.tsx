import { useEffect, useState } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle, Users, Heart, Clock, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LocationData {
  latitude: number;
  longitude: number;
  created_at: string;
  accuracy?: number;
}

interface AssignedPatient {
  id: string;
  name: string;
  age: number;
  latestBpm?: number;
  latestLocation?: LocationData;
}

interface LiveLocationMapProps {
  assignedPatients: AssignedPatient[];
}

// Google Maps Embed URL - Always visible map
const GOOGLE_MAPS_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d484284.21978160436!2d77.56136557319336!3d18.507630121952896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1733879888130!5m2!1sen!2sin";

export function LiveLocationMap({ assignedPatients }: LiveLocationMapProps) {
  const [patientLocations, setPatientLocations] = useState<Map<string, LocationData>>(new Map());

  useEffect(() => {
    // Set initial locations from props
    const initialLocations = new Map<string, LocationData>();
    assignedPatients.forEach(patient => {
      if (patient.latestLocation) {
        initialLocations.set(patient.id, patient.latestLocation);
      }
    });
    setPatientLocations(initialLocations);

    // Subscribe to location updates for all assigned patients
    if (assignedPatients.length > 0) {
      const patientIds = assignedPatients.map(p => p.id);

      const locationChannel = supabase
        .channel('patient_locations')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'locations',
            filter: `user_id=in.(${patientIds.join(',')})`,
          },
          (payload) => {
            const newLocation = payload.new as {
              user_id: string;
              latitude: number;
              longitude: number;
              created_at: string;
              accuracy?: number;
            };

            setPatientLocations(prev => new Map(prev.set(newLocation.user_id, {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              created_at: newLocation.created_at,
              accuracy: newLocation.accuracy,
            })));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(locationChannel);
      };
    }
  }, [assignedPatients]);

  const patientsWithLocations = assignedPatients.filter(patient =>
    patientLocations.has(patient.id)
  );

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            Live Patient Locations
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">{patientsWithLocations.length} Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-500" />
              <span className="text-blue-600 font-medium">Real-time</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-96 relative">
        {/* Google Maps Embed - Always visible */}
        <iframe
          src={GOOGLE_MAPS_EMBED_URL}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Patient Location Map"
        />

        {/* Overlay for patient markers and info */}
        {patientsWithLocations.length > 0 && (
          <>
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">BPM Status</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">Normal (60-100 BPM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">Low (&lt;60 BPM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600">High (&gt;100 BPM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-xs text-gray-600">No Data</span>
                </div>
              </div>
            </div>

            {/* Patient Count */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {patientsWithLocations.length} Patient{patientsWithLocations.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
