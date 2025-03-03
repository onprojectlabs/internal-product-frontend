import { AtSign } from 'lucide-react';

export function WelcomeMessage() {
  return (
    <div className="p-4 bg-muted/50 rounded-lg text-sm">
      <p className="font-medium mb-2">👋 ¡Hola! Puedo ayudarte con:</p>
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2">
          <AtSign className="h-4 w-4 mt-0.5 text-primary" />
          <span>
            Usa <span className="text-primary font-medium">@</span> para mencionar reuniones, carpetas o documentos específicos
          </span>
        </li>
        <li>• Búsqueda en todo tu contenido</li>
        <li>• Resúmenes y puntos clave</li>
        <li>• Análisis de documentos y reuniones</li>
      </ul>
    </div>
  );
} 