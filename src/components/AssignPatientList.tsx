import { UserPlus, Mail, Phone, Calendar } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  email: string;
  gender: string;
  phone: string;
  role: 'Patient';
  created_at: string;
  updated_at: string;
}

interface AssignPatientListProps {
  patients: Patient[];
  onAssign: (patientId: string) => void;
}

export function AssignPatientList({ patients, onAssign }: AssignPatientListProps) {
  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No patients found</p>
        <p className="text-gray-400">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {patients.map((patient) => (
        <div
          key={patient.id}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
        >
          <div className="p-6">
            {/* Patient Avatar and Basic Info */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">{patient.name}</h3>
                <p className="text-gray-600 text-sm">{patient.age} years old • {patient.gender}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-gray-600 text-sm">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="truncate">{patient.email}</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>Joined {new Date(patient.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Assign Button */}
            <button
              onClick={() => onAssign(patient.id)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md"
            >
              <UserPlus className="h-4 w-4" />
              Assign Patient
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
