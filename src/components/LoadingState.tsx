import { cn } from "../lib/utils";

interface LoadingStateProps {
    className?: string;
    message?: string;
}

export function LoadingState({ 
    className,
    message = "Cargando..." 
}: LoadingStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center min-h-[400px] p-6",
            "rounded-lg space-y-4",
            className
        )}>
            {/* Spinner animado */}
            <div className="relative w-10 h-10">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="w-10 h-10 border-4 border-primary/10 rounded-full" />
                    <div className="absolute top-0 left-0 w-10 h-10 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                </div>
            </div>
            
            {/* Mensaje de carga */}
            <p className="text-muted-foreground animate-pulse">
                {message}
            </p>
        </div>
    );
} 