import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { useMeetings } from '../context/MeetingsContext';

interface AddTestMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_NAMES = [
  "Juan García", "María Rodríguez", "Carlos López", "Ana Martínez", 
  "Luis González", "Laura Sánchez", "Pedro Ramírez", "Sofia Torres",
  "Diego Herrera", "Carmen Ruiz", "Miguel Flores", "Isabel Castro",
  "Roberto Díaz", "Patricia Vargas", "Fernando Silva", "Elena Morales"
];

export function AddTestMeetingDialog({ open, onOpenChange }: AddTestMeetingDialogProps) {
  const [platform, setPlatform] = useState<'zoom' | 'meet' | 'teams'>('zoom');
  const [duration, setDuration] = useState('60');
  const [participantsCount, setParticipantsCount] = useState('4');
  const [date, setDate] = useState('');
  const { addMeeting } = useMeetings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const shuffled = [...MOCK_NAMES].sort(() => 0.5 - Math.random());
    const selectedParticipants = shuffled.slice(0, parseInt(participantsCount));

    const meetingDate = new Date(date);
    const now = new Date();
    const isPastMeeting = meetingDate < now;

    // Generar datos de ejemplo más realistas para reuniones pasadas
    const mockSummary = isPastMeeting ? 
      `En esta reunión se discutieron varios temas importantes:
      1. Revisión del progreso del proyecto
      2. Planificación de próximos objetivos
      3. Asignación de tareas al equipo
      4. Definición de plazos de entrega` : 
      "Esta es una reunión de prueba generada automáticamente.";

    const mockTranscription = isPastMeeting ?
      `[00:00] Juan: Buenos días a todos, gracias por unirse a la reunión.
[00:15] María: Hola, buenos días.
[00:30] Juan: Vamos a revisar el progreso del proyecto.
[01:00] Carlos: Me gustaría compartir los avances de mi equipo...
[15:00] Juan: Perfecto, entonces quedamos así con las tareas asignadas.
[15:30] María: Sí, enviaré el resumen por correo.
[16:00] Juan: Gracias a todos, nos vemos en la próxima reunión.` : 
      "Transcripción de prueba...";

    const mockHighlights = isPastMeeting ? [
      "Se definieron los próximos objetivos del proyecto",
      "El equipo reportó un avance del 75% en las tareas asignadas",
      "Se estableció el próximo sprint para la semana que viene",
      "Se identificaron y resolvieron los principales bloqueantes"
    ] : [];

    const mockPendingQuestions = isPastMeeting ? [
      "¿Cuándo se implementará la nueva funcionalidad?",
      "¿Quién será responsable del despliegue?",
      "¿Se necesita programar una reunión de seguimiento?"
    ] : [];

    const newMeeting = {
      id: crypto.randomUUID(),
      title: `Reunión de prueba - ${meetingDate.toLocaleDateString()}`,
      platform,
      // Si es una reunión pasada, marcarla como procesada, si no como programada
      status: isPastMeeting ? "processed" as const : "scheduled" as const,
      duration: `${duration} min`,
      date: meetingDate,
      participants: selectedParticipants,
      summary: mockSummary,
      transcription: mockTranscription,
      // Añadir datos adicionales solo si es una reunión pasada
      ...(isPastMeeting && {
        highlights: mockHighlights,
        pendingQuestions: mockPendingQuestions
      })
    };
    
    console.log('Nueva reunión a añadir:', newMeeting);
    addMeeting(newMeeting);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir reunión de prueba</DialogTitle>
          <DialogDescription>
            Esta funcionalidad es solo para pruebas. En producción, las reuniones se importarán 
            automáticamente desde Zoom, Google Meet y Microsoft Teams.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select
                value={platform}
                onValueChange={(value: 'zoom' | 'meet' | 'teams') => setPlatform(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="meet">Google Meet</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha y hora</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="participants">Número de participantes</Label>
              <Input
                id="participants"
                type="number"
                min="2"
                max="16"
                value={participantsCount}
                onChange={(e) => setParticipantsCount(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" 
              onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Añadir reunión</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 