import { Link } from 'react-router-dom';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { FileIcon, VideoIcon, PresentationIcon } from 'lucide-react';
import type { FolderItem } from '../types/index';

// Función para obtener el icono según el tipo
const getItemIcon = (type: FolderItem['type']) => {
  switch (type) {
    case 'meeting':
      return <PresentationIcon className="h-5 w-5 text-primary" />;
    case 'document':
      return <FileIcon className="h-5 w-5 text-primary" />;
    case 'clip':
      return <VideoIcon className="h-5 w-5 text-primary" />;
  }
};

// Función para obtener la ruta según el tipo
const getItemRoute = (item: FolderItem) => {
  switch (item.type) {
    case 'meeting':
      return `/meeting/${item.id}`;
    case 'document':
      return `/document/${item.id}`;
    case 'clip':
      return `/clip/${item.id}`;
  }
};

interface FolderPageProps {
  folderData: {
    id: string;
    name: string;
    description: string;
    items: FolderItem[];
  };
}

export function FolderPage({ folderData }: FolderPageProps) {
  return (
    <div>
      {folderData.items.map(item => (
        <Link 
          key={item.id}
          to={getItemRoute(item)}
          className="grid grid-cols-[1fr,100px,100px,40px] gap-4 p-3 hover:bg-muted/50 transition-colors items-center group"
        >
          <div className="flex items-center gap-2">
            {getItemIcon(item.type)}
            <span className="truncate text-foreground group-hover:text-primary transition-colors">
              {item.name}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {item.date}
          </div>
          <div className="text-sm text-muted-foreground">
            {item.size || item.status}
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault(); // Prevenir navegación
              // Aquí iría la lógica del menú de opciones
            }}
            className="p-1 text-foreground bg-background hover:bg-muted/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
        </Link>
      ))}
    </div>
  );
} 