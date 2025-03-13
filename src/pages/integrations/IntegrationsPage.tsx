import { Button } from "../../components/ui/Button";
import { TeamsIcon, ZoomIcon, MeetIcon } from "../../components/icons";

export function IntegrationsPage() {
  return (
    <div className="container py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Integraciones
        </h1>
      </div>

      {/* Plataformas de reuniones */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Conecta tus plataformas de reuniones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Microsoft Teams */}
          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TeamsIcon />
                <span className="text-card-foreground font-medium">Teams</span>
              </div>
              <Button variant="default">Conectar</Button>
            </div>
          </div>

          {/* Zoom */}
          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ZoomIcon />
                <span className="text-card-foreground font-medium">Zoom</span>
              </div>
              <Button variant="default">Conectar</Button>
            </div>
          </div>

          {/* Google Meet */}
          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MeetIcon />
                <span className="text-card-foreground font-medium">Meet</span>
              </div>
              <Button variant="destructive">Desconectar</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sincronizando automáticamente tus reuniones{" "}
              <span className="text-yellow-500">(Modo Mock)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Configuración
        </h2>
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-card-foreground font-medium">
                Descargar grabaciones automáticamente
              </h3>
              <p className="text-sm text-muted-foreground">
                Las grabaciones se descargarán automáticamente cuando estén disponibles
              </p>
            </div>
            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              ✓
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-card-foreground font-medium">
                Notificar nuevas grabaciones
              </h3>
              <p className="text-sm text-muted-foreground">
                Recibe notificaciones cuando haya nuevas grabaciones disponibles
              </p>
            </div>
            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              ✓
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="text-card-foreground font-medium mb-2">
              Límite de almacenamiento (GB)
            </h3>
            <input
              type="range"
              min="0"
              max="1000"
              value="100"
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="text-sm text-muted-foreground mt-1">100 GB</div>
          </div>
        </div>
      </div>
    </div>
  );
} 