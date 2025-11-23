import { useEffect, useState, useMemo } from 'react';
import { Users, Plus, X, Activity, AlertTriangle, Eye, Heart, Droplet, Thermometer, MapPin, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import type { User, SensorData, Alert } from '../types';

export default function CaretakerMetricsView() {
  const { user } = useAuthStore();
  const [assignedPatients, setAssignedPatients] = useState<User[]>([]);
  const [allPatients, setAllPatients] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [patientData, setPatientData] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [patientAlerts, setPatientAlerts] = useState<Alert[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [loadingPatients, setLoadingPatients] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoadingPatients(true);
    fetchAssignedPatients();
    fetchAllPatients();
    fetchUnreadAlerts();

    // Subscribe to real-time alerts
    const alertChannel = supabase
      .channel('caretaker_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          // Check if this alert is for one of our patients
          checkIfPatientAssigned(newAlert.patient_id).then((isAssigned) => {
            if (isAssigned) {
              setUnreadAlerts((prev) => prev + 1);
              toast.error(`Alert from patient: ${newAlert.message}`);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertChannel);
    };
  }, [user]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData(selectedPatient.id);
      fetchPatientAlerts(selectedPatient.id);

      // Subscribe to patient's sensor data
      const sensorChannel = supabase
        .channel(`patient_sensor_${selectedPatient.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sensor_data',
            filter: `patient_id=eq.${selectedPatient.id}`,
          },
          (payload) => {
            const newData = payload.new as SensorData;
            setPatientData((prev) => [...prev, newData].slice(-20));
            setLatestData(newData);
          }
        )
        .subscribe();

      const interval = setInterval(() => fetchPatientData(selectedPatient.id), 5000);

      return () => {
        supabase.removeChannel(sensorChannel);
        clearInterval(interval);
      };
    }
  }, [selectedPatient]);

  const checkIfPatientAssigned = async (patientId: string): Promise<boolean> => {
    if (!user) return false;

    const { data } = await supabase
      .from('caretaker_assignments')
      .select('id')
      .eq('caretaker_id', user.id)
      .eq('patient_id', patientId)
      .single();

    return !!data;
  };

  const fetchAssignedPatients = async () => {
    if (!user) return;

    const { data: assignments, error: assignError } = await supabase
      .from('caretaker_assignments')
      .select('patient_id')
      .eq('caretaker_id', user.id);

    if (assignError) {
      console.error('Error fetching assignments:', assignError);
      return;
    }

    if (assignments && assignments.length > 0) {
      const patientIds = assignments.map((a) => a.patient_id);

      const { data: patients, error: patientsError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds);

      if (patientsError) {
        console.error('Error fetching patients:', patientsError);
        return;
      }

      if (patients) {
        setAssignedPatients(patients as User[]);
        if (!selectedPatient && patients.length > 0) {
          setSelectedPatient(patients[0] as User);
        }
      }
    } else {
      setAssignedPatients([]);
    }
  };

  const fetchAllPatients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'Patient');

    if (error) {
      console.error('Error fetching all patients:', error);
      return;
    }

    if (data) {
      setAllPatients(data as User[]);
    }
    setLoadingPatients(false);
  };

  const fetchPatientData = async (patientId: string) => {
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching patient data:', error);
      return;
    }

    if (data && data.length > 0) {
      setPatientData(data.reverse());
      setLatestData(data[0]);
    }
  };

  const fetchPatientAlerts = async (patientId: string) => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching alerts:', error);
      return;
    }

    if (data) {
      setPatientAlerts(data);
    }
  };

  const fetchUnreadAlerts = async () => {
    if (!user) return;

    const { data: assignments } = await supabase
      .from('caretaker_assignments')
      .select('patient_id')
      .eq('caretaker_id', user.id);

    if (assignments && assignments.length > 0) {
      const patientIds = assignments.map((a) => a.patient_id);

      const { data: alerts } = await supabase
        .from('alerts')
        .select('id')
        .in('patient_id', patientIds)
        .eq('is_read', false);

      if (alerts) {
        setUnreadAlerts(alerts.length);
      }
    }
  };

  const handleAssignPatient = async (patientId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('caretaker_assignments')
        .insert([{ caretaker_id: user.id, patient_id: patientId }]);

      if (error) throw error;

      toast.success('Patient assigned successfully!');
      setShowAddModal(false);
      fetchAssignedPatients();
    } catch (error: any) {
      console.error('Error assigning patient:', error);
      if (error.code === '23505') {
        toast.error('Patient already assigned');
      } else {
        toast.error('Failed to assign patient');
      }
    }
  };

  const handleRemovePatient = async (patientId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('caretaker_assignments')
        .delete()
        .eq('caretaker_id', user.id)
        .eq('patient_id', patientId);

      if (error) throw error;

      toast.success('Patient removed successfully!');
      fetchAssignedPatients();
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error('Error removing patient:', error);
      toast.error('Failed to remove patient');
    }
  };

  const markAlertsAsRead = async (patientId: string) => {
    await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('patient_id', patientId)
      .eq('is_read', false);

    fetchUnreadAlerts();
  };

  const availablePatients = useMemo(() => {
    if (loadingPatients) return [];

    // Filter out patients who are already assigned to this caretaker
    return allPatients.filter(
      (patient) => !assignedPatients.some((assigned) => assigned.id === patient.id)
    );
  }, [allPatients, assignedPatients, loadingPatients]);

  const chartData = patientData.map((data) => ({
    time: new Date(data.created_at).toLocaleTimeString(),
    BPM: data.bpm,
    SpO2: data.spo2 || 0,
    Temp: data.temperature || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Caretaker Dashboard</h1>
              <p className="text-sm text-gray-600">Monitor and manage your patients</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-600" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Patient</span>
            </button>
          </div>
        </div>
      </div>

      {/* Patient List and Details */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Assigned Patients ({assignedPatients.length})</h2>
            <div className="space-y-2">
              {assignedPatients.length > 0 ? (
                assignedPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      markAlertsAsRead(patient.id);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedPatient?.id === patient.id
                        ? 'bg-primary-100 border-2 border-primary-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{patient.name}</p>
                        <p className="text-xs text-gray-600">
                          {patient.age} yrs • {patient.gender}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePatient(patient.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded-full text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  No patients assigned yet. Click "Add Patient" to start monitoring.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-3">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.name}</h2>
                    <p className="text-gray-600">
                      {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.phone}
                    </p>
                  </div>
                  <Activity className="h-12 w-12 text-primary-600 animate-pulse" />
                </div>
              </div>

              {/* Vital Signs */}
              {latestData ? (
                <div className="grid md:grid-cols-4 gap-4">
                  <VitalCard
                    icon={<Heart className="h-6 w-6" />}
                    label="Heart Rate"
                    value={`${latestData.bpm}`}
                    unit="BPM"
                    color="red"
                    isAbnormal={latestData.bpm < 50 || latestData.bpm > 120}
                  />
                  <VitalCard
                    icon={<Droplet className="h-6 w-6" />}
                    label="SpO2"
                    value={`${latestData.spo2 || '--'}`}
                    unit="%"
                    color="blue"
                    isAbnormal={latestData.spo2 ? latestData.spo2 < 90 : false}
                  />
                  <VitalCard
                    icon={<Thermometer className="h-6 w-6" />}
                    label="Temperature"
                    value={`${latestData.temperature || '--'}`}
                    unit="°C"
                    color="orange"
                    isAbnormal={latestData.temperature ? latestData.temperature > 38 : false}
                  />
                  <VitalCard
                    icon={<Activity className="h-6 w-6" />}
                    label="RR Interval"
                    value={`${latestData.rr_interval || '--'}`}
                    unit="ms"
                    color="teal"
                    isAbnormal={false}
                  />
                </div>
              ) : (
                <div className="card text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3 animate-pulse" />
                  <p className="text-gray-600">No sensor data available yet</p>
                </div>
              )}

              {/* Charts */}
              {chartData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold mb-4">Vital Signs Trends</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="BPM" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="SpO2" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Location Map */}
              {latestData?.latitude && latestData?.longitude && (
                <div className="card">
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="h-6 w-6 text-primary-600" />
                    <h3 className="text-lg font-bold">Patient Location</h3>
                  </div>
                  <div className="h-[250px] rounded-lg overflow-hidden">
                    <MapContainer
                      center={[latestData.latitude, latestData.longitude]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                      />
                      <Marker position={[latestData.latitude, latestData.longitude]}>
                        <Popup>{selectedPatient.name}'s Location</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Alerts */}
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Recent Alerts</h3>
                {patientAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {patientAlerts.map((alert) => (
                      <AlertItem key={alert.id} alert={alert} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">No alerts</p>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-16">
              <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Patient</h3>
              <p className="text-gray-600">
                Choose a patient from the list to view their health metrics
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Add Patient</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loadingPatients ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading patients...</p>
                </div>
              ) : availablePatients.length > 0 ? (
                availablePatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{patient.name}</p>
                        <p className="text-sm text-gray-600">
                          {patient.age} yrs • {patient.gender} • {patient.email}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAssignPatient(patient.id)}
                        className="btn-primary px-3 py-1 text-sm"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {allPatients.length === 0
                    ? "No patients found in the system"
                    : "All patients are already assigned"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface VitalCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
  isAbnormal: boolean;
}

function VitalCard({ icon, label, value, unit, color, isAbnormal }: VitalCardProps) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    teal: 'bg-teal-100 text-teal-600',
  };

  return (
    <div className={`card ${isAbnormal ? 'border-2 border-red-500 animate-pulse-slow' : ''}`}>
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <div className="flex items-baseline space-x-1">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        <span className="text-xs text-gray-600">{unit}</span>
      </div>
      {isAbnormal && (
        <div className="mt-1 flex items-center text-red-600 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          <span>Alert</span>
        </div>
      )}
    </div>
  );
}

interface AlertItemProps {
  alert: Alert;
}

function AlertItem({ alert }: AlertItemProps) {
  const severityColors: Record<string, string> = {
    Low: 'bg-blue-100 text-blue-800 border-blue-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Critical: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${severityColors[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-bold text-sm">{alert.alert_type}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-white">{alert.severity}</span>
          </div>
          <p className="text-sm">{alert.message}</p>
          <p className="text-xs opacity-70 mt-1">
            {new Date(alert.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
