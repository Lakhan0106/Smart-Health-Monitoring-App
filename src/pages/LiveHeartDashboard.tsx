import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Activity, Clock, AlertCircle, TrendingUp,
  Gauge, BarChart3, Wifi, WifiOff, RefreshCw, Smartphone, Zap, Bell
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Bar, ComposedChart
} from 'recharts';
import Navbar from '../components/Navbar';
import { EmergencyAlertButton } from '../components/EmergencyAlertButton';
import { speechRecognition } from '../utils/speech';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

interface SensorData {
  id: number;
  created_at: string;
  rr_interval: number | null;
  bpm: number | null;
  accel_x: number | null;
  accel_y: number | null;
  accel_z: number | null;
  raw_values: string | null;
}

interface HeartStats {
  currentBpm: number | null;
  averageBpm: number;
  minBpm: number;
  maxBpm: number;
  status: 'Normal' | 'High' | 'Low' | 'Critical';
  lastUpdated: string;
  totalReadings: number;
  heartRateVariability: number;
  connectionStatus: 'Connected' | 'Disconnected' | 'Poor';
}

interface AlertInfo {
  type: 'BPM' | 'Irregular' | 'Connection' | 'Sensor';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  timestamp: string;
}

export default function LiveHeartDashboard() {
  const { user, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  // Check if user is a patient and redirect caretakers
  useEffect(() => {
    if (!authLoading && user && user.role !== 'Patient') {
      toast.error("Access denied: This section is only for patients.");
      navigate('/dashboard');
      return;
    }
  }, [user, authLoading, navigate]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not a patient
  if (user?.role !== 'Patient') {
    return null;
  }

  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [heartStats, setHeartStats] = useState<HeartStats>({
    currentBpm: null,
    averageBpm: 0,
    minBpm: 0,
    maxBpm: 0,
    status: 'Normal',
    lastUpdated: '',
    totalReadings: 0,
    heartRateVariability: 0,
    connectionStatus: 'Disconnected',
  });

  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLatestData();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    if (!user) return;

    // Initial data fetch
    fetchInitialData();

    // Subscribe to real-time updates
    const sensorChannel = supabase
      .channel('sensor_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
        },
        (payload) => {
          const newData = payload.new as SensorData;
          handleNewSensorData(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sensorChannel);
    };
  }, [user]);

  // Voice command integration for emergency alerts
  useEffect(() => {
    if (!speechRecognition.isSupported()) {
      return;
    }

    const handleVoiceCommand = (command: string) => {
      if (command === 'EMERGENCY_ALERT') {
        toast.success('Voice command detected! Opening emergency alert...', {
          duration: 3000,
        });

        // Find and click the emergency alert button
        const emergencyButton = document.querySelector('[data-emergency-button]') as HTMLButtonElement;
        if (emergencyButton) {
          emergencyButton.click();
        }
      }
    };

    // Start voice command listening
    speechRecognition.startVoiceCommands(handleVoiceCommand);

    return () => {
      speechRecognition.stop();
    };
  }, []);

  const fetchInitialData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching sensor data:', error);
        toast.error('Failed to load sensor data');
        return;
      }

      if (data) {
        setSensorData(data.reverse());
        updateHeartStats(data);
        setLastUpdateTime(new Date());
        setHeartStats(prev => ({ ...prev, connectionStatus: 'Connected' }));
      }
    } catch (error) {
      console.error('Error:', error);
      setHeartStats(prev => ({ ...prev, connectionStatus: 'Disconnected' }));
      toast.error('Failed to connect to sensor data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching latest data:', error);
        setHeartStats(prev => ({ ...prev, connectionStatus: 'Disconnected' }));
        return;
      }

      if (data) {
        handleNewSensorData(data);
        setLastUpdateTime(new Date());
        setHeartStats(prev => ({ ...prev, connectionStatus: 'Connected' }));
      }
    } catch (error) {
      setHeartStats(prev => ({ ...prev, connectionStatus: 'Disconnected' }));
    }
  };

  const handleNewSensorData = (newData: SensorData) => {
    setSensorData((prev) => {
      const updated = [newData, ...prev.slice(0, 99)]; // Keep last 100 records
      updateHeartStats(updated);
      return updated;
    });
  };

  const updateHeartStats = (data: SensorData[]) => {
    if (data.length === 0) return;

    const validBpmData = data.filter(d => d.bpm !== null);
    if (validBpmData.length === 0) return;

    const latest = validBpmData[0];
    const currentBpm = latest.bpm!;

    // Calculate statistics
    const bpmValues = validBpmData.map(d => d.bpm!);
    const averageBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
    const minBpm = Math.min(...bpmValues);
    const maxBpm = Math.max(...bpmValues);

    // Calculate heart rate variability (simplified)
    const recentBpm = bpmValues.slice(0, 10);
    const hrv = recentBpm.length > 1
      ? Math.round(Math.sqrt(recentBpm.reduce((sum, bpm, i) => {
          if (i === 0) return 0;
          const diff = bpm - recentBpm[i - 1];
          return sum + (diff * diff);
        }, 0) / (recentBpm.length - 1)) * 10) / 10
      : 0;

    // Determine status
    let status: 'Normal' | 'High' | 'Low' | 'Critical' = 'Normal';
    if (currentBpm > 120 || currentBpm < 40) status = 'Critical';
    else if (currentBpm > 100) status = 'High';
    else if (currentBpm < 60) status = 'Low';

    setHeartStats({
      currentBpm,
      averageBpm,
      minBpm,
      maxBpm,
      status,
      lastUpdated: new Date(latest.created_at).toLocaleTimeString(),
      totalReadings: data.length,
      heartRateVariability: hrv,
      connectionStatus: 'Connected',
    });

    // Generate alerts
    generateAlerts(currentBpm, status, latest);
  };

  const generateAlerts = (currentBpm: number, status: string, latestData: SensorData) => {
    const newAlerts: AlertInfo[] = [];

    // BPM alerts
    if (status === 'Critical') {
      newAlerts.push({
        type: 'BPM',
        severity: 'Critical',
        message: `Critical heart rate detected: ${currentBpm} BPM`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } else if (status === 'High') {
      newAlerts.push({
        type: 'BPM',
        severity: 'High',
        message: `Elevated heart rate: ${currentBpm} BPM`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } else if (status === 'Low') {
      newAlerts.push({
        type: 'BPM',
        severity: 'Medium',
        message: `Low heart rate: ${currentBpm} BPM`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    // Irregular rhythm detection (simplified)
    if (heartStats.heartRateVariability > 20) {
      newAlerts.push({
        type: 'Irregular',
        severity: 'Medium',
        message: 'Irregular heart rhythm detected',
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    // Connection status alert
    if (heartStats.connectionStatus === 'Disconnected') {
      newAlerts.push({
        type: 'Connection',
        severity: 'High',
        message: 'Sensor connection lost',
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Keep last 10 alerts
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'text-green-600 bg-green-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Low': return 'text-blue-600 bg-blue-100';
      case 'Critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionIcon = () => {
    switch (heartStats.connectionStatus) {
      case 'Connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'Poor': return <Wifi className="h-4 w-4 text-yellow-500" />;
      default: return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  // Prepare chart data
  const chartData = sensorData.slice(0, 20).map((data) => ({
    time: new Date(data.created_at).toLocaleTimeString(),
    bpm: data.bpm,
    rrInterval: data.rr_interval,
    accelX: data.accel_x,
    accelY: data.accel_y,
    accelZ: data.accel_z,
  }));

  // ECG waveform data (parsed from raw_values)
  const getEcgData = () => {
    if (!sensorData[0]?.raw_values) return [];

    const values = sensorData[0].raw_values.split(',').map(v => parseFloat(v));
    return values.slice(0, 50).map((value, index) => ({
      index,
      value: value * 100, // Scale for visualization
    }));
  };

  const ecgData = getEcgData();

  // Accelerometer data for the last 20 readings
  const accelData = sensorData.slice(0, 20).map((data) => ({
    time: new Date(data.created_at).toLocaleTimeString(),
    x: data.accel_x || 0,
    y: data.accel_y || 0,
    z: data.accel_z || 0,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading heart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Heart className="h-16 w-16 text-red-500 animate-pulse" />
              <div className="absolute -top-2 -right-2">
                <Activity className="h-8 w-8 text-purple-500 animate-bounce" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Live Heart Data Analysis
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Real-time sensor monitoring and health analytics
          </p>
          <div className="flex justify-center items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {getConnectionIcon()}
              <span>Status: {heartStats.connectionStatus}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Last Update: {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'Never'}</span>
            </div>
            <EmergencyAlertButton className="ml-4" data-emergency-button />
          </div>
        </div>

        {/* Live Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center bg-gradient-to-r from-pink-500 to-red-500 text-white">
            <Heart className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p className="text-3xl font-bold">{heartStats.currentBpm || '--'}</p>
            <p className="text-sm opacity-90">Current BPM</p>
          </div>

          <div className={`card text-center ${getStatusColor(heartStats.status)}`}>
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{heartStats.status}</p>
            <p className="text-sm opacity-90">Health Status</p>
          </div>

          <div className="card text-center bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{heartStats.heartRateVariability}</p>
            <p className="text-sm opacity-90">HRV Score</p>
          </div>

          <div className="card text-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{heartStats.totalReadings}</p>
            <p className="text-sm opacity-90">Total Readings</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Heart Rate Range</h3>
              <Gauge className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average</span>
                <span className="font-semibold">{heartStats.averageBpm} BPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Min</span>
                <span className="font-semibold text-green-600">{heartStats.minBpm} BPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max</span>
                <span className="font-semibold text-red-600">{heartStats.maxBpm} BPM</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Connection Status</h3>
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getConnectionIcon()}
                <span className="font-semibold">{heartStats.connectionStatus}</span>
              </div>
              <div className="text-sm text-gray-600">
                Last sync: {heartStats.lastUpdated}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
              <RefreshCw className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-full text-sm px-3 py-2 rounded-lg ${
                  autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={fetchLatestData}
                className="w-full text-sm px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Manual Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ECG Waveform */}
        {ecgData.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">ECG Waveform</h3>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-600">Real-time ECG</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ecgData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" hide />
                <YAxis hide />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  fill="url(#ecgGradient)"
                  strokeWidth={1.5}
                />
                <defs>
                  <linearGradient id="ecgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* BPM Trend */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-gray-800">BPM Trend (Last 20 readings)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[40, 140]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="bpm"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* RR Interval Trend */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-gray-800">RR Interval Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[600, 1000]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rrInterval"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accelerometer Data */}
        <div className="card mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Accelerometer Data (Movement)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={accelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="x" fill="#3b82f6" name="X-Axis" />
              <Bar dataKey="y" fill="#10b981" name="Y-Axis" />
              <Bar dataKey="z" fill="#f59e0b" name="Z-Axis" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>X-Axis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Y-Axis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Z-Axis</span>
            </div>
          </div>
        </div>

        {/* Alerts and Recent Data */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Active Alerts */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Active Alerts</h3>
              <Bell className="h-5 w-5 text-red-500" />
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No active alerts</p>
              ) : (
                alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'Critical' ? 'bg-red-50 border-red-500' :
                    alert.severity === 'High' ? 'bg-orange-50 border-orange-500' :
                    alert.severity === 'Medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{alert.message}</p>
                        <p className="text-xs text-gray-600 mt-1">{alert.timestamp}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        alert.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                        alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Readings Table */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Sensor Readings</h3>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">BPM</th>
                    <th className="text-left py-2">RR Interval</th>
                    <th className="text-left py-2">Accel X</th>
                    <th className="text-left py-2">Accel Y</th>
                    <th className="text-left py-2">Accel Z</th>
                  </tr>
                </thead>
                <tbody>
                  {sensorData.slice(0, 10).map((data, index) => (
                    <tr key={`${data.id}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="py-2">{new Date(data.created_at).toLocaleTimeString()}</td>
                      <td className="py-2 font-semibold">{data.bpm || '--'}</td>
                      <td className="py-2">{data.rr_interval || '--'}</td>
                      <td className="py-2">{data.accel_x?.toFixed(3) || '--'}</td>
                      <td className="py-2">{data.accel_y?.toFixed(3) || '--'}</td>
                      <td className="py-2">{data.accel_z?.toFixed(3) || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Health Insights */}
        <div className="card mb-8">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Health Insights & Recommendations</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
              {heartStats.status === 'Critical' && (
                <div className="flex items-center text-red-600 mb-2">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p className="font-semibold">Critical: Seek immediate medical attention</p>
                </div>
              )}
              {heartStats.status === 'High' && (
                <div className="flex items-center text-orange-600 mb-2">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p className="font-semibold">Elevated: Try relaxation techniques</p>
                </div>
              )}
              {heartStats.status === 'Low' && (
                <div className="flex items-center text-blue-600 mb-2">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p className="font-semibold">Low: Consider light activity</p>
                </div>
              )}
              {heartStats.status === 'Normal' && (
                <div className="flex items-center text-green-600 mb-2">
                  <Activity className="h-5 w-5 mr-2" />
                  <p className="font-semibold">Normal: Your heart rate is healthy!</p>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-600">
                <p>• Average BPM: {heartStats.averageBpm}</p>
                <p>• Heart Rate Variability: {heartStats.heartRateVariability}ms</p>
                <p>• Total Readings: {heartStats.totalReadings}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
              <h4 className="font-semibold text-gray-800 mb-2">Movement Analysis</h4>
              <div className="text-sm text-gray-600">
                <p>• Activity Level: {Math.abs((sensorData[0]?.accel_x || 0) + (sensorData[0]?.accel_y || 0) + (sensorData[0]?.accel_z || 0)) > 2 ? 'High' : 'Low'}</p>
                <p>• Stability: {Math.abs(sensorData[0]?.accel_z || 0) > 9.5 ? 'Good' : 'Poor'}</p>
                <p>• Orientation: {sensorData[0]?.accel_z && sensorData[0].accel_z > 0 ? 'Upright' : 'Tilted'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
