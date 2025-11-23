import { Heart } from 'lucide-react';

interface LiveBpmMiniProps {
  bpm?: number;
  status?: 'Normal' | 'High' | 'Low' | 'Critical';
}

export function LiveBpmMini({ bpm, status }: LiveBpmMiniProps) {
  if (!bpm) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
        <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500">No data</span>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-500';
      case 'High': return 'bg-orange-500 animate-pulse';
      case 'Low': return 'bg-blue-500';
      case 'Critical': return 'bg-red-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <Heart className={`w-4 h-4 text-red-500 ${status === 'Critical' || status === 'High' ? 'animate-pulse' : ''}`} />
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-800">{bpm}</span>
        <span className="text-xs text-gray-600">BPM</span>
      </div>
      <div className={`w-2 h-2 ${getStatusColor(status)} rounded-full`}></div>
    </div>
  );
}
