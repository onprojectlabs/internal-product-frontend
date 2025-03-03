import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { 
  FileVideo, 
  Clock, 
  FileText,
  Sparkles,
  Hash,
  List,
  Circle as BulletIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/LoadingState';
import { clipsService } from '../services/clipsService';
import { useEffect, useState } from 'react';
import { Clip } from '../types/clips';

export function ClipPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const [clip, setClip] = useState<Clip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const storedClip = clipsService.getClip(id);
      setClip(storedClip);
      setIsLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    console.log('Handling back navigation. From:', from); // Para depurar
    
    if (from?.type === 'folder') {
      navigate(`/folder/${from.id}`);
    } else if (from?.path) {
      navigate(from.path);
    } else {
      navigate('/clips');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState message="Cargando clip..." />
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-card/50 p-6 rounded-full mb-6">
            <FileVideo className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Clip no encontrado</h1>
          <p className="text-muted-foreground mb-8">
            El clip que estás buscando no existe o ha sido eliminado
          </p>
          <Button 
            onClick={() => navigate('/clips')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Ver mis clips
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={handleBack}
          className="p-2 bg-background hover:bg-muted rounded-lg transition-colors text-muted-foreground"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <FileVideo className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground truncate">
              {clip.title}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
            </div>
            <span>Duración: {clip.duration}s</span>
          </div>
        </div>
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card del video */}
          <div className="bg-card rounded-lg p-6">
            {/* Video */}
            {clip.url && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <video src={clip.url} controls className="w-full h-full" />
              </div>
            )}
          </div>

          {/* Transcripción */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Transcripción</h2>
            <div className="space-y-4">
              {clip.transcript ? (
                clip.transcript.map((segment, index) => (
                  <div key={index} className="flex gap-4">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {segment.timestamp}
                    </span>
                    <p>{segment.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Transcripción en proceso...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar derecho */}
        <div className="space-y-6">
          {/* Resumen */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Resumen</h2>
            {clip.summary ? (
              <p className="text-muted-foreground">{clip.summary}</p>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4" />
                <p>Generando resumen...</p>
              </div>
            )}
          </div>

          {/* Palabras clave */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Palabras clave</h2>
            {clip.keywords ? (
              <div className="flex flex-wrap gap-2">
                {clip.keywords.map((keyword, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Hash className="h-12 w-12 mx-auto mb-4" />
                <p>Extrayendo palabras clave...</p>
              </div>
            )}
          </div>

          {/* Temas principales */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Temas principales</h2>
            {clip.topics ? (
              <div className="space-y-3">
                {clip.topics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <BulletIcon className="h-4 w-4 text-primary" />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <List className="h-12 w-12 mx-auto mb-4" />
                <p>Identificando temas...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 