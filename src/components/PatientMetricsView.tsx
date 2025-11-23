import { useEffect, useState } from 'react';
import { Activity, Heart, Thermometer, Wind, Droplet, AlertTriangle, MapPin, PhoneCall } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { getCurrentLocation } from '../utils/location';
import toast from 'react-hot-toast';
import type { SensorData, Alert } from '../types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function PatientMetricsView() {
  const { user } = useAuthStore();
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch initial data
    fetchSensorData();
    fetchAlerts();
    fetchLocation();

    // Subscribe to real-time updates
    const sensorChannel = supabase
      .channel('sensor_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
          filter: `patient_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as SensorData;
          setSensorData((prev) => [...prev, newData].slice(-20)); // Keep last 20 records
          setLatestData(newData);
          
          // Check for abnormal readings
          checkAbnormalReadings(newData);
        }
      )
      .subscribe();

    const alertChannel = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `patient_id=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          setAlerts((prev) => [newAlert, ...prev]);
          toast.error(`New Alert: ${newAlert.message}`);
        }
      )
      .subscribe();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchSensorData, 5000);

    return () => {
      supabase.removeChannel(sensorChannel);
      supabase.removeChannel(alertChannel);
      clearInterval(interval);
    };
  }, [user]);

  const fetchSensorData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching sensor data:', error);
      return;
    }

    if (data && data.length > 0) {
      setSensorData(data.reverse());
      setLatestData(data[0]);
    }
  };

  const fetchAlerts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching alerts:', error);
      return;
    }

    if (data) {
      setAlerts(data);
    }
  };

  const fetchLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      setLocation({ lat: coords.latitude, lng: coords.longitude });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const checkAbnormalReadings = (data: SensorData) => {
    // Check for abnormal BPM (normal range: 60-100)
    if (data.bpm < 50 || data.bpm > 120) {
      sendAutoAlert('Abnormal Heart Rate', 'High', data);
    }

    // Check for low SpO2 (normal: >95%)
    if (data.spo2 && data.spo2 < 90) {
      sendAutoAlert('Low Blood Oxygen Level', 'Critical', data);
    }

    // Check for sensor fault
    if (data.sensor_fault) {
      sendAutoAlert('Sensor Fault Detected', 'Medium', data);
    }
  };

  const sendAutoAlert = async (message: string, severity: 'Low' | 'Medium' | 'High' | 'Critical', data: SensorData) => {
    if (!user) return;

    await supabase.from('alerts').insert({
      patient_id: user.id,
      alert_type: data.sensor_fault ? 'Sensor_Fault' : 'Auto',
      severity,
      message,
      latitude: data.latitude,
      longitude: data.longitude,
    } as any);
  };

  const handleManualAlert = async () => {
    if (!user || sendingAlert) return;

    setSendingAlert(true);

    try {
      const coords = location || (await getCurrentLocation().catch(() => null));

      const { error } = await supabase.from('alerts').insert({
        patient_id: user.id,
        alert_type: 'Manual',
        severity: 'Critical',
        message: '🚨 EMERGENCY SOS - Patient needs immediate assistance!',
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
      } as any);

      if (error) throw error;

      toast.success('Emergency alert sent to all caretakers!');
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert. Please try again.');
    } finally {
      setSendingAlert(false);
    }
  };

  const chartData = sensorData.map((data) => ({
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
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Health Metrics Dashboard</h1>
              <p className="text-sm text-gray-600">Real-time health monitoring</p>
            </div>
          </div>

          <button
            onClick={handleManualAlert}
            disabled={sendingAlert}
            className="btn-primary bg-red-600 hover:bg-red-700 flex items-center space-x-2 animate-pulse-slow"
          >
            <PhoneCall className="h-5 w-5" />
            <span>SOS Alert</span>
          </button>
        </div>
      </div>

      {/* Vital Signs Cards */}
      {latestData ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <VitalCard
            icon={<Heart className="h-8 w-8" />}
            label="Heart Rate"
            value={`${latestData.bpm}`}
            unit="BPM"
            color="red"
            isAbnormal={latestData.bpm < 50 || latestData.bpm > 120}
          />
          <VitalCard
            icon={<Droplet className="h-8 w-8" />}
            label="Blood Oxygen"
            value={`${latestData.spo2 || '--'}`}
            unit="SpO2 %"
            color="blue"
            isAbnormal={latestData.spo2 ? latestData.spo2 < 90 : false}
          />
          <VitalCard
            icon={<Thermometer className="h-8 w-8" />}
            label="Temperature"
            value={`${latestData.temperature || '--'}`}
            unit="°C"
            color="orange"
            isAbnormal={latestData.temperature ? latestData.temperature > 38 : false}
          />
          <VitalCard
            icon={<Wind className="h-8 w-8" />}
            label="RR Interval"
            value={`${latestData.rr_interval || '--'}`}
            unit="ms"
            color="teal"
            isAbnormal={false}
          />
        </div>
      ) : (
        <div className="card text-center py-12">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Waiting for sensor data...</p>
          <p className="text-sm text-gray-500 mt-2">Make sure your health monitoring device is connected</p>
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="card animate-fadeIn">
          <h2 className="text-xl font-bold mb-4">Vital Signs Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="BPM" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="SpO2" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Temp" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* GPS Location Map */}
      {location && (
        <div className="card animate-fadeIn">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold">Current Location</h2>
          </div>
          <div className="h-[300px] rounded-lg overflow-hidden">
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={[location.lat, location.lng]}>
                <Popup>Your Current Location</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      <div className="card animate-fadeIn">
        <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No alerts yet</p>
        )}
      </div>
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
    <div className={`card animate-fadeIn ${isAbnormal ? 'border-2 border-red-500 animate-pulse-slow' : ''}`}>
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        <span className="text-sm text-gray-600">{unit}</span>
      </div>
      {isAbnormal && (
        <div className="mt-2 flex items-center text-red-600 text-sm">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span>Abnormal</span>
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
    <div className={`p-4 rounded-lg border-2 ${severityColors[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-bold">{alert.alert_type}</span>
            <span className="text-xs px-2 py-1 rounded bg-white">{alert.severity}</span>
          </div>
          <p className="text-sm">{alert.message}</p>
          <p className="text-xs opacity-70 mt-2">
            {new Date(alert.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
