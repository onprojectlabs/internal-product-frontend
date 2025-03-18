import { FolderIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    description: string;
    created_at?: string;  // Added optional to support both APIs
    createdAt?: string;   // Added optional to support both APIs
  };
  className?: string;
}

export function FolderCard({ folder, className = '' }: FolderCardProps) {
  // Support both API formats (created_at and createdAt)
  const createdAtDate = folder.createdAt || folder.created_at;
  
  return (
    <Link 
      to={`/folder/${folder.id}`}
      className={`bg-card hover:bg-card/90 transition-colors rounded-lg p-4 cursor-pointer border border-border group ${className}`}
    >
      <div className="flex items-start justify-between">
        <FolderIcon className="h-8 w-8 text-primary mb-2" />
        <span className="text-xs text-muted-foreground">
          {createdAtDate ? new Date(createdAtDate).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : ''}
        </span>
      </div>
      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
        {folder.name}
      </h3>
      <p className="text-sm text-muted-foreground">
        {folder.description}
      </p>
    </Link>
  );
} 