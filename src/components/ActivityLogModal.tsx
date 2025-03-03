import { ClockIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityList, Activity } from './ActivityList';
import { useState, useEffect } from 'react';

// Restaurar los datos de prueba
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'meeting',
    name: 'Product Review',
    event: 'transcribing',
    platform: 'Google Meet',
    timestamp: '19/2/2025, 13:57:10'
  },
  {
    id: '2',
    type: 'meeting',
    name: 'Sprint Planning',
    event: 'transcribed',
    platform: 'Google Meet',
    timestamp: '19/2/2025, 15:57:10'
  },
  {
    id: '3',
    type: 'meeting',
    name: 'Tech Review',
    event: 'processing',
    platform: 'Google Meet',
    timestamp: '19/2/2025, 17:57:10'
  },
  {
    id: '4',
    type: 'clip',
    name: 'WhatsApp Video 2024-07-09 at 00.37.16.mp4',
    event: 'processed',
    platform: 'Clip',
    timestamp: '19/2/2025, 11:58:23'
  }
];

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityLogModal({ isOpen, onClose }: ActivityLogModalProps) {
  const [filterText, setFilterText] = useState('');

  // Filtrar actividades
  const filteredActivities = mockActivities.filter(activity =>
    activity.name.toLowerCase().includes(filterText.toLowerCase()) ||
    activity.platform.toLowerCase().includes(filterText.toLowerCase())
  );

  // Manejar la tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleItemClick = () => {
    onClose(); // Cerrar el modal cuando se hace click en una actividad
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={e => e.stopPropagation()}
            className="fixed inset-10 m-auto z-50 w-full max-w-2xl h-fit max-h-[90vh] bg-card rounded-lg shadow-lg border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Registro de actividad</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border">
              <input
                type="text"
                placeholder="Buscar actividad..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="w-full p-2 bg-muted rounded-lg"
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <ActivityList 
                activities={filteredActivities} 
                showEmpty={true}
                onItemClick={handleItemClick}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 