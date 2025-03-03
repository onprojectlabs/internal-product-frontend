import { Meeting } from '../context/MeetingsContext';

type MeetingStatusType = 
  | "scheduled"    // Programada (futura)
  | "completed"    // Completada (pasada)
  | "transcribing" // Transcribiendo
  | "transcribed"  // Transcrita
  | "summarizing"  // Generando resumen
  | "processing"   // Procesando
  | "processed";   // Procesada

interface MeetingStatusProps {
  status: MeetingStatusType;
}

export function MeetingStatus({ status }: MeetingStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case "scheduled":
        return "text-blue-500 bg-blue-500/10";
      case "completed":
      case "processed":
        return "text-green-500 bg-green-500/10";
      case "transcribing":
      case "summarizing":
      case "processing":
        return "text-yellow-500 bg-yellow-500/10";
      case "transcribed":
        return "text-purple-500 bg-purple-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "scheduled":
        return "Programada";
      case "completed":
        return "Completada";
      case "transcribing":
        return "Transcribiendo";
      case "transcribed":
        return "Transcrita";
      case "summarizing":
        return "Generando resumen";
      case "processing":
        return "Procesando";
      case "processed":
        return "Procesada";
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {getStatusText()}
    </span>
  );
} 