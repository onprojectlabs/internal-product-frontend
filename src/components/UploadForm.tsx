import { useMeetings } from '../context/MeetingsContext';

export function UploadForm() {
    const { addMeeting } = useMeetings();

    const handleUpload = async (file: File) => {
        // Crear una nueva reunión desde el clip
        const meeting: Meeting = {
            id: crypto.randomUUID(),
            title: file.name,
            date: new Date(),
            source: 'Clip',
            uploadMethod: 'Manual',
            currentStep: 'Transcribiendo',
            progress: 0,
            status: {
                isProcessing: true,
                isFinished: false,
                hasTranscription: false,
                hasSummary: false
            }
        };

        // Añadir al contexto
        addMeeting(meeting);

        // Iniciar el procesamiento
        // ... código existente de upload ...

        // Actualizar progreso
        updateProgress(meeting.id, 25, 'Transcribiendo');
        // ... etc
    };
} 