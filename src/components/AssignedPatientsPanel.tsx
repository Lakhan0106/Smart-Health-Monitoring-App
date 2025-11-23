import { Eye, Trash2, MapPin, Clock, Users } from 'lucide-react';
import { LiveBpmMini } from './LiveBpmMini';

interface AssignedPatient {
  id: string;
  name: string;
  age: number;
  email: string;
  gender: string;
  phone: string;
  role: 'Patient';
  created_at: string;
  updated_at: string;
  assigned_at: string;
  latestBpm?: number;
  latestLocation?: {
    latitude: number;
    longitude: number;
    created_at: string;
  };
}

interface AssignedPatientsPanelProps {
  assignedPatients: AssignedPatient[];
  onUnassign: (patientId: string) => void;
}

export function AssignedPatientsPanel({ assignedPatients, onUnassign }: AssignedPatientsPanelProps) {
  if (assignedPatients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No patients assigned</p>
        <p className="text-gray-400">Go to the "All Patients" tab to assign patients</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          Assigned Patients ({assignedPatients.length})
        </h2>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {assignedPatients.map((patient) => (
          <div key={patient.id} className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              {/* Patient Info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                  <p className="text-gray-600 text-sm">{patient.age} years • {patient.gender}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/patient/${patient.id}`, '_blank')}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="View full dashboard"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUnassign(patient.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Unassign patient"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Live BPM Mini */}
            <div className="mb-4">
              <LiveBpmMini bpm={patient.latestBpm} />
            </div>

            {/* Location Info */}
            {patient.latestLocation && (
              <div className="flex items-center text-gray-600 text-sm mb-2">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span>
                  Last seen: {new Date(patient.latestLocation.created_at).toLocaleString()}
                </span>
              </div>
            )}

            {/* Assignment Date */}
            <div className="flex items-center text-gray-500 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              <span>Assigned {new Date(patient.assigned_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
