import { useState, useEffect, useRef } from 'react';
import { 
  Video as VideoCameraIcon,
  Folder as FolderIcon,
  FileText as FileIcon,
  Search as SearchIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Exportamos la interfaz para que pueda ser usada en FloatingChat
export interface MentionItem {
  id: string;
  type: 'meeting' | 'folder' | 'document';
  name: string;
  description?: string;
}

interface MentionPopupProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
  context: {
    type: 'global' | 'meeting' | 'folder';
    id?: string;
    name?: string;
  };
}

// Añadimos la palabra clave 'export' aquí
export function MentionPopup({ query, onSelect, onClose, context }: MentionPopupProps) {
  const [items, setItems] = useState<MentionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  // Simular búsqueda de items mencionables según el contexto
  useEffect(() => {
    let mockItems: MentionItem[] = [];

    switch (context.type) {
      case 'meeting':
        // Si estamos en una reunión, mostrar contenido relacionado
        mockItems = [
          {
            id: '1',
            type: 'meeting',
            name: 'Esta reunión',
            description: context.name
          },
          {
            id: '2',
            type: 'document',
            name: 'Transcripción',
            description: 'Transcripción completa'
          },
          {
            id: '3',
            type: 'document',
            name: 'Resumen',
            description: 'Resumen generado por IA'
          }
        ];
        break;

      case 'global':
      default:
        // En el dashboard o vista global
        mockItems = [
          {
            id: '1',
            type: 'meeting',
            name: 'Daily Scrum - Frontend',
            description: 'Hace 2 días'
          },
          {
            id: '2',
            type: 'folder',
            name: 'Proyecto Alpha',
            description: '12 elementos'
          },
          {
            id: '3',
            type: 'document',
            name: 'Especificaciones.pdf',
            description: 'Actualizado ayer'
          },
          {
            id: '4',
            type: 'meeting',
            name: 'Reunión de Planificación',
            description: 'Hoy'
          }
        ];
        break;
    }

    // Filtrar por la búsqueda
    setItems(mockItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    ));
  }, [query, context]);

  const getIcon = (type: MentionItem['type']) => {
    switch (type) {
      case 'meeting':
        return <VideoCameraIcon className="h-4 w-4" />;
      case 'folder':
        return <FolderIcon className="h-4 w-4" />;
      case 'document':
        return <FileIcon className="h-4 w-4" />;
    }
  };

  // Cerrar el popup cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute z-50 w-full bg-background border border-border rounded-lg shadow-lg py-2"
      style={{ 
        bottom: '100%',
        left: 0,
        marginBottom: '8px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      {items.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
          <SearchIcon className="h-4 w-4" />
          No se encontraron resultados
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {items.map((item, index) => (
            <button
              key={item.id}
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-start gap-2",
                selectedIndex === index && "bg-muted"
              )}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="text-primary mt-1">
                {getIcon(item.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {item.name}
                </div>
                {item.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 