import { useState } from 'react';
import { Trash2, Check, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Guardian {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface GuardianListProps {
  guardians: Guardian[];
  selectedGuardians: Set<string>;
  onGuardianSelect: (guardianId: string, selected: boolean) => void;
  onGuardianDelete: () => void;
}

export function GuardianList({
  guardians,
  selectedGuardians,
  onGuardianSelect,
  onGuardianDelete,
}: GuardianListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (guardianId: string) => {
    if (deletingId) return;

    setDeletingId(guardianId);
    try {
      const { error } = await supabase
        .from('guardians')
        .delete()
        .eq('id', guardianId);

      if (error) throw error;

      onGuardianDelete();
    } catch (error) {
      console.error('Error deleting guardian:', error);
      toast.error('Failed to delete emergency contact');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {guardians.map((guardian) => (
        <div
          key={guardian.id}
          className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          {/* Selection Checkbox */}
          <button
            onClick={() => onGuardianSelect(guardian.id, !selectedGuardians.has(guardian.id))}
            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              selectedGuardians.has(guardian.id)
                ? 'bg-red-600 border-red-600'
                : 'border-gray-300 hover:border-red-400'
            }`}
          >
            {selectedGuardians.has(guardian.id) && (
              <Check className="h-3 w-3 text-white" />
            )}
          </button>

          {/* Guardian Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900 truncate">
                {guardian.name}
              </h4>
              <div className="flex items-center text-gray-500">
                <Mail className="h-4 w-4 mr-1" />
                <span className="text-sm">{guardian.email}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Added {new Date(guardian.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => handleDelete(guardian.id)}
            disabled={deletingId === guardian.id}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Remove emergency contact"
          >
            {deletingId === guardian.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
