import { useParams } from 'react-router-dom';

interface TranscriptionSegment {
    speaker: string;
    text: string;
    timestamp: string;
}

const mockTranscription: TranscriptionSegment[] = [
    {
        speaker: "Juan García",
        text: "Buenos días a todos. Hoy vamos a revisar los avances del proyecto de IA.",
        timestamp: "00:00:00"
    },
    {
        speaker: "María López",
        text: "Perfecto. Por mi parte, hemos completado la implementación del sistema de transcripción en tiempo real.",
        timestamp: "00:00:15"
    },
    {
        speaker: "Carlos Ruiz",
        text: "Excelente. ¿Podemos ver una demo de cómo está funcionando?",
        timestamp: "00:00:30"
    },
    {
        speaker: "María López",
        text: "Sí, claro. Permítanme compartir mi pantalla...",
        timestamp: "00:00:45"
    },
    // ... más segmentos mock
];

export function TranscriptionPage() {
    const { id } = useParams();

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-8">Transcripción de la reunión</h1>
            
            <div className="space-y-6">
                {mockTranscription.map((segment, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-blue-600">
                                {segment.speaker}
                            </span>
                            <span className="text-sm text-gray-500">
                                {segment.timestamp}
                            </span>
                        </div>
                        <p className="text-gray-700">
                            {segment.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
} 