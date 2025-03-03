import { FolderIcon } from '@heroicons/react/24/outline';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { NewFolderDialog } from '../components/NewFolderDialog';
import { foldersService } from '../services/folders/foldersService';
import { LoadingState } from '../components/LoadingState';

interface Folder {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setIsLoading(true);
        const data = await foldersService.getFolders();
        setFolders(data.items);
        setError(null);
      } catch (err) {
        console.error('Error al obtener las carpetas:', err);
        setError('Error al cargar las carpetas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolders();
  }, []);

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState message="Cargando carpetas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Error al cargar las carpetas</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Carpetas
          </h1>
          <p className="text-muted-foreground">
            Organiza y accede a todas tus reuniones por proyecto o área
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsNewFolderOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Nueva carpeta
        </Button>
      </div>

      <NewFolderDialog 
        open={isNewFolderOpen} 
        onOpenChange={setIsNewFolderOpen}
      />

      {/* Search bar */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar carpetas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Folders grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredFolders.map(folder => (
          <FolderCard key={folder.id} folder={folder} />
        ))}
      </div>

      {/* Empty state */}
      {filteredFolders.length === 0 && (
        <div className="text-center py-12">
          <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No se encontraron carpetas
          </h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? 'Intenta con otros términos de búsqueda'
              : 'Crea una carpeta para empezar a organizar tus reuniones'}
          </p>
        </div>
      )}
    </div>
  );
}

function FolderCard({ folder }: { folder: Folder }) {
  return (
    <Link 
      to={`/folder/${folder.id}`}
      className="bg-card hover:bg-card/90 transition-colors rounded-lg p-4 cursor-pointer border border-border"
    >
      <div className="flex items-start justify-between">
        <FolderIcon className="h-8 w-8 text-primary mb-2" />
        <span className="text-xs text-muted-foreground">
          {new Date(folder.created_at).toLocaleDateString()}
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