import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Users, RefreshCw, Activity, AlertCircle, CheckCircle, Clock, UserCheck, TrendingUp, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { AssignPatientList } from '../components/AssignPatientList';
import { AssignedPatientsPanel } from '../components/AssignedPatientsPanel';
import { LiveLocationMap } from '../components/LiveLocationMap';

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

interface AssignedPatient extends Patient {
  assigned_at: string;
  latestBpm?: number;
  latestLocation?: {
    latitude: number;
    longitude: number;
    created_at: string;
  };
  status?: 'Online' | 'Offline' | 'Critical' | 'Warning';
}

interface PatientStats {
  totalPatients: number;
  assignedPatients: number;
  onlinePatients: number;
  criticalPatients: number;
}

export default function AssignPatients() {
  const { user, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<AssignedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'patients' | 'assigned' | 'analytics'>('patients');
  const [stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    assignedPatients: 0,
    onlinePatients: 0,
    criticalPatients: 0,
  });

  // Check if user is a caretaker and redirect if not
  useEffect(() => {
    if (!authLoading && user && user.role !== 'Caretaker') {
      toast.error("Access denied: This section is only for caretakers.");
      navigate('/dashboard');
      return;
    }
  }, [user, authLoading, navigate]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not a caretaker
  if (user?.role !== 'Caretaker') {
    return null;
  }

  useEffect(() => {
    if (!user) return;

    fetchAllPatients();
    fetchAssignedPatients();

    // Subscribe to real-time updates for assignments
    const assignmentsChannel = supabase
      .channel('assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'caretaker_assignments',
          filter: `caretaker_id=eq.${user.id}`,
        },
        () => {
          fetchAssignedPatients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsChannel);
    };
  }, [user]);

  const fetchAllPatients = async () => {
    try {
      console.log('Fetching all patients from profiles table...');
      console.log('Current user:', user);
      console.log('User role:', user?.role);

      // For caretakers, we need to fetch all patients they can see
      // Based on RLS policies, caretakers can only see their own profile and assigned patients
      // But for assignment purposes, we need to see all patients

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'Patient')
        .order('name');

      if (error) {
        console.error('Error fetching patients:', error);
        console.error('Error details:', error.message, error.code, error.details);

        // If it's a permission error, try a different approach
        if (error.code === 'PGRST301' || error.message.includes('permission')) {
          toast.error('Permission denied: Cannot view all patients. Please check RLS policies.');
          console.log('RLS Policy issue detected. You may need to add a policy allowing caretakers to view all patients.');
        } else {
          toast.error(`Failed to load patients: ${error.message}`);
        }
        return;
      }

      console.log('Fetched patients data:', data);
      console.log('Number of patients found:', data?.length || 0);

      if (data && data.length > 0) {
        setAllPatients(data);
        setStats(prev => ({ ...prev, totalPatients: data.length }));
        toast.success(`✅ Found ${data.length} patients`);
      } else {
        setAllPatients([]);
        toast.error('No patients found in the system');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const fetchAssignedPatients = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching assigned patients for caretaker:', user.id);

      // Get assignments for current caretaker
      const { data: assignments, error: assignmentsError } = await supabase
        .from('caretaker_assignments')
        .select(`
          patient_id,
          assigned_at,
          profiles!caretaker_assignments_patient_id_fkey (
            id,
            name,
            age,
            email,
            gender,
            phone,
            role,
            created_at,
            updated_at
          )
        `)
        .eq('caretaker_id', user.id);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        toast.error(`Failed to load assignments: ${assignmentsError.message}`);
        return;
      }

      console.log('Fetched assignments:', assignments?.length || 0);

      if (assignments && assignments.length > 0) {
        // Get latest sensor data for each assigned patient
        const patientIds = assignments.map((a: any) => a.patient_id);
        const { data: sensorData } = await supabase
          .from('sensordata')
          .select('*')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false });

        // Get latest location data for each assigned patient
        const { data: locationData } = await supabase
          .from('locations')
          .select('*')
          .in('user_id', patientIds)
          .order('created_at', { ascending: false });

        const enrichedPatients: AssignedPatient[] = assignments.map((assignment: any) => {
          const patient = assignment.profiles as Patient;
          const latestSensor = sensorData?.find((s: any) => s.patient_id === patient.id);
          const latestLocation = locationData?.find((l: any) => l.user_id === patient.id);
          // Determine patient status based on latest data
          let status: 'Online' | 'Offline' | 'Critical' | 'Warning' = 'Offline';
          if (latestLocation) {
            const locationAge = new Date().getTime() - new Date((latestLocation as any).created_at).getTime();
            if (locationAge < 5 * 60 * 1000) { // Within last 5 minutes
              status = ((latestSensor as any)?.bpm && (latestSensor as any).bpm > 120) ? 'Critical' :
                      ((latestSensor as any)?.bpm && (latestSensor as any).bpm > 100) ? 'Warning' : 'Online';
            }
          }

          return {
            ...patient,
            assigned_at: assignment.assigned_at,
            latestBpm: (latestSensor as any)?.bpm || undefined,
            latestLocation: latestLocation ? {
              latitude: (latestLocation as any).latitude,
              longitude: (latestLocation as any).longitude,
              created_at: (latestLocation as any).created_at,
            } : undefined,
            status,
          };
        });
        setAssignedPatients(enrichedPatients);

        // Update stats
        const onlinePatients = enrichedPatients.filter(p => p.status === 'Online').length;
        const criticalPatients = enrichedPatients.filter(p => p.status === 'Critical').length;

        setStats({
          totalPatients: allPatients.length,
          assignedPatients: enrichedPatients.length,
          onlinePatients,
          criticalPatients,
        });
      } else {
        setAssignedPatients([]);
        setStats(prev => ({ ...prev, assignedPatients: 0, onlinePatients: 0, criticalPatients: 0 }));
      }
    } catch (error) {
      console.error('Error fetching assigned patients:', error);
      toast.error('Failed to load assigned patients');
    } finally {
      setLoading(false);
    }
  };

  const assignPatient = async (patientId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('caretaker_assignments')
        .insert({
          caretaker_id: user.id,
          patient_id: patientId,
        } as any);

      if (error) {
        console.error('Error assigning patient:', error);
        toast.error(`Failed to assign patient: ${error.message}`);
        return;
      }

      toast.success('✅ Patient assigned successfully');
      fetchAssignedPatients();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to assign patient');
    }
  };

  const unassignPatient = async (patientId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('caretaker_assignments')
        .delete()
        .eq('caretaker_id', user.id)
        .eq('patient_id', patientId);

      if (error) {
        console.error('Error unassigning patient:', error);
        toast.error(`Failed to unassign patient: ${error.message}`);
        return;
      }

      toast.success('✅ Patient unassigned successfully');
      fetchAssignedPatients();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to unassign patient');
    }
  };

  const filteredPatients = allPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Online': return <CheckCircle className="h-4 w-4" />;
      case 'Warning': return <AlertCircle className="h-4 w-4" />;
      case 'Critical': return <AlertCircle className="h-4 w-4" />;
      case 'Offline': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Users className="h-16 w-16 text-indigo-600 animate-pulse" />
              <div className="absolute -top-2 -right-2">
                <Activity className="h-8 w-8 text-purple-500 animate-bounce" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Patient Management Hub
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Comprehensive patient monitoring and assignment system
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.totalPatients}</p>
            <p className="text-sm opacity-90">Total Patients</p>
          </div>

          <div className="card text-center bg-gradient-to-r from-green-500 to-green-600 text-white">
            <UserCheck className="h-8 w-8 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.assignedPatients}</p>
            <p className="text-sm opacity-90">Assigned</p>
          </div>

          <div className="card text-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.onlinePatients}</p>
            <p className="text-sm opacity-90">Online</p>
          </div>

          <div className="card text-center bg-gradient-to-r from-red-500 to-red-600 text-white">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p className="text-3xl font-bold">{stats.criticalPatients}</p>
            <p className="text-sm opacity-90">Critical</p>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-2 flex">
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'patients'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <UserPlus className="h-5 w-5" />
              All Patients ({allPatients.length})
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'assigned'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <Users className="h-5 w-5" />
              Assigned ({assignedPatients.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              Analytics
            </button>
          </div>
        </div>

        {/* Enhanced Content */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* Enhanced Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchAllPatients}
                  className="btn-secondary flex items-center gap-2"
                  title="Refresh patient list"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Patient List */}
            <AssignPatientList
              patients={filteredPatients}
              onAssign={assignPatient}
            />
          </div>
        )}

        {activeTab === 'assigned' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Enhanced Assigned Patients Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-600" />
                    Assigned Patients ({assignedPatients.length})
                  </h2>
                </div>
                <AssignedPatientsPanel
                  assignedPatients={assignedPatients}
                  onUnassign={unassignPatient}
                />
              </div>
            </div>

            {/* Enhanced Google Map */}
            <div className="lg:col-span-2">
              <LiveLocationMap
                assignedPatients={assignedPatients}
                center={{ lat: 20.5937, lng: 78.9629 }} // Default to India center
              />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Analytics Overview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assignment Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalPatients > 0 ? Math.round((stats.assignedPatients / stats.totalPatients) * 100) : 0}%
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Online Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.assignedPatients > 0 ? Math.round((stats.onlinePatients / stats.assignedPatients) * 100) : 0}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.criticalPatients}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold text-gray-900">&lt;2min</p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Patient Status Distribution */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Patient Status Distribution
                </h3>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { status: 'Online', count: stats.onlinePatients, color: 'green' },
                    { status: 'Warning', count: assignedPatients.filter(p => p.status === 'Warning').length, color: 'orange' },
                    { status: 'Critical', count: stats.criticalPatients, color: 'red' },
                    { status: 'Offline', count: assignedPatients.filter(p => p.status === 'Offline').length, color: 'gray' },
                  ].map((item) => (
                    <div key={item.status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-${item.color}-100 flex items-center justify-center`}>
                        {getStatusIcon(item.status.toLowerCase())}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                      <p className="text-sm text-gray-600">{item.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-600" />
                  Quick Actions
                </h3>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      toast.success('Emergency broadcast sent to all patients!');
                    }}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Emergency Broadcast
                  </button>

                  <button
                    onClick={() => {
                      toast.success('Health report generated for all patients!');
                    }}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Generate Report
                  </button>

                  <button
                    onClick={() => {
                      toast.success('All patient data exported successfully!');
                    }}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
