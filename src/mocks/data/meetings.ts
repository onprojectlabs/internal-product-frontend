import {
    Meeting,
    MeetingSource,
    ProcessingStep,
} from "../../context/MeetingsContext";

// Función helper para crear fechas relativas
const getRelativeDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

// Datos detallados de las reuniones (incluyendo resumen, highlights, etc.)
export const meetingsDetails: Record<string, Meeting> = {
    "1": {
        id: "1",
        title: "Daily Scrum - Equipo Frontend",
        date: getRelativeDate(-1),
        source: "Google Meet",
        uploadMethod: "Automático",
        currentStep: "Completado",
        progress: 100,
        folderId: "1",
        participants: [
            "Ana García",
            "Carlos López",
            "María Rodríguez",
            "Juan Pérez",
        ],
        duration: "25 minutos",
        status: {
            isUploading: false,
            isProcessing: false,
            isFinished: true,
            hasTranscription: true,
            hasSummary: true,
            transcriptionUrl: "/transcriptions/1",
            transcriptionStarted: true,
        },
        summary:
            "En esta reunión diaria, el equipo discutió el progreso del sprint actual...",
        highlights: [
            "El equipo reportó un 80% de avance en la nueva interfaz",
            "Se identificaron 3 bugs críticos que necesitan atención inmediata",
            "La fecha de entrega se mantiene para el 28 de febrero",
        ],
        pendingQuestions: [
            "¿Cómo manejaremos la compatibilidad con navegadores antiguos?",
            "¿Cuándo se realizarán las pruebas de usuario?",
            "¿Qué métricas usaremos para medir el éxito del proyecto?",
        ],
    },
    "2": {
        id: "2",
        title: "Reunión de Diseño UI",
        date: getRelativeDate(-3),
        source: "Google Meet" as MeetingSource,
        uploadMethod: "Automático",
        currentStep: "Completado",
        progress: 100,
        participants: ["Ana García", "María Rodríguez", "David Torres"],
        duration: "45 minutos",
        status: {
            isUploading: false,
            isProcessing: false,
            isFinished: true,
            hasTranscription: true,
            hasSummary: true,
            transcriptionUrl: "/transcriptions/2",
            transcriptionStarted: true,
        },
        summary:
            "Revisión exhaustiva de los nuevos componentes de la interfaz. Se discutieron las mejoras en la experiencia de usuario y se definieron los estándares de diseño para mantener la consistencia en toda la aplicación.",
        highlights: [
            "Se aprobó el nuevo sistema de diseño para componentes comunes",
            "Definición de la paleta de colores para estados y feedback",
            "Acuerdo sobre las animaciones y transiciones a implementar",
            "Revisión de la accesibilidad en todos los componentes",
        ],
        pendingQuestions: [
            "¿Cómo implementaremos el modo oscuro en los nuevos componentes?",
            "¿Necesitamos variantes adicionales para los botones?",
            "¿Cuándo podemos comenzar la fase de pruebas con usuarios?",
        ],
    },
    "3": {
        id: "3",
        title: "Retrospectiva Sprint 12",
        date: getRelativeDate(-5),
        source: "Teams" as MeetingSource,
        uploadMethod: "Automático",
        currentStep: "Completado",
        progress: 100,
        participants: [
            "Carlos López",
            "Juan Pérez",
            "Ana García",
            "Laura Martínez",
            "Miguel Sánchez",
        ],
        duration: "1 hora",
        status: {
            isUploading: false,
            isProcessing: false,
            isFinished: true,
            hasTranscription: true,
            hasSummary: true,
            transcriptionUrl: "/transcriptions/3",
            transcriptionStarted: true,
        },
        summary:
            "Análisis detallado del Sprint 12, identificando áreas de mejora y celebrando los logros del equipo. Se establecieron acciones concretas para optimizar el proceso de desarrollo y la comunicación entre equipos.",
        highlights: [
            "Reducción del tiempo de revisión de código en un 30%",
            "Mejora en la calidad de las pruebas automatizadas",
            "Éxito en la implementación del nuevo pipeline de CI/CD",
            "Mayor colaboración entre desarrollo y diseño",
        ],
        pendingQuestions: [
            "¿Cómo podemos mejorar la estimación de las historias de usuario?",
            "¿Deberíamos ajustar la duración de las daily meetings?",
            "¿Qué herramientas adicionales necesitamos para el próximo sprint?",
            "¿Cómo podemos reducir el tiempo de onboarding de nuevos miembros?",
        ],
    },
    "4": {
        id: "4",
        title: "Sprint Planning Q1",
        date: getRelativeDate(1),
        source: "Google Meet" as MeetingSource,
        uploadMethod: "Automático",
        currentStep: "Programado",
        progress: 0,
        folderId: "1",
        participants: [
            "Ana García",
            "Carlos López",
            "María Rodríguez",
            "David Torres",
            "Laura Martínez",
        ],
        duration: "2 horas",
        status: {
            isUploading: false,
            isProcessing: false,
            isFinished: false,
            hasTranscription: false,
            hasSummary: false,
        },
        joinUrl: "https://meet.google.com/abc-defg-hij",
    },
    "5": {
        id: "5",
        title: "Review de Diseño",
        date: getRelativeDate(3),
        source: "Teams" as MeetingSource,
        uploadMethod: "Automático",
        currentStep: "Programado",
        progress: 0,
        participants: [
            "María Rodríguez",
            "Carlos López",
            "Elena Ruiz",
            "Pablo Moreno",
        ],
        duration: "45 minutos",
        status: {
            isUploading: false,
            isProcessing: false,
            isFinished: false,
            hasTranscription: false,
            hasSummary: false,
        },
        joinUrl: "https://teams.microsoft.com/l/meetup-join/xyz...",
    },
};

export const meetings = Object.values(meetingsDetails);

// Exportaciones filtradas
export const pastMeetings = meetings.filter((m) => m.date < new Date());
export const futureMeetings = meetings.filter((m) => m.date > new Date());
