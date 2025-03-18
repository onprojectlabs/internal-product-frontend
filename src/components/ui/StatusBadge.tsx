import { cn } from "../../lib/utils";
import { DocumentStatus } from "../../types/documents";

interface StatusBadgeProps {
  status: DocumentStatus | string;
  percentage?: number;
  variant?: "default" | "small" | "large";
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  uploaded: { 
    label: 'Subido', 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  },
  processing: { 
    label: 'Procesando', 
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
  },
  processed: { 
    label: 'Procesado', 
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  },
  failed: { 
    label: 'Error', 
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  },
  // Podemos agregar más estados aquí para clips u otros tipos de elementos
};

export function StatusBadge({ status, percentage, variant = "default", className }: StatusBadgeProps) {
  // Determinar la configuración basada en el estado
  const config = statusConfig[status] || { 
    label: status, 
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  };
  
  // Determinar si mostrar el porcentaje (solo para documentos en procesamiento)
  const showPercentage = percentage !== undefined && percentage > 0 && 
                          (status === 'processing' || status === 'uploaded');
  
  // Clases base según la variante
  const baseClasses = {
    default: "px-2 py-1 rounded-md text-xs font-medium",
    small: "px-1.5 py-0.5 rounded text-xs font-medium",
    large: "px-3 py-1.5 rounded-lg text-sm font-medium"
  };
  
  return (
    <div className="flex items-center gap-2">
      {/* Etiqueta de estado */}
      <span className={cn(
        baseClasses[variant],
        config.className,
        className
      )}>
        {config.label}
      </span>
      
      {/* Etiqueta de porcentaje (opcional) */}
      {showPercentage && (
        <span className={cn(
          baseClasses[variant],
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
        )}>
          {percentage}%
        </span>
      )}
    </div>
  );
} 