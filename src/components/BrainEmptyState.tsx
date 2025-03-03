import { Brain, Search, AtSign, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

interface BrainEmptyStateProps {
  onCreateNew: () => void;
}

export function BrainEmptyState({ onCreateNew }: BrainEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-full w-fit mx-auto mb-6">
          <Brain className="h-8 w-8 text-blue-500 dark:text-blue-400 animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
          👋 Bienvenido a tu asistente personal
        </h2>
        
        <p className="text-muted-foreground mb-8">
          Tu cerebro digital está listo para ayudarte a procesar y entender toda tu información
        </p>

        <div className="grid gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-4 rounded-lg text-left transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-5 w-5 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-blue-700 dark:text-blue-300">Búsqueda inteligente</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Encuentra cualquier información de tus reuniones y documentos
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-4 rounded-lg text-left transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <AtSign className="h-5 w-5 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-blue-700 dark:text-blue-300">Menciones contextuales</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Usa <span className="text-blue-500 dark:text-blue-400 font-medium">@</span> para referenciar reuniones, carpetas o documentos específicos
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-4 rounded-lg text-left transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-blue-700 dark:text-blue-300">Análisis automático</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Obtén resúmenes y puntos clave de forma instantánea ✨
            </p>
          </div>
        </div>

        <Button 
          onClick={onCreateNew} 
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          Iniciar nueva conversación
        </Button>
      </div>
    </div>
  );
} 