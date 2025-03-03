import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useMeetings } from '../context/MeetingsContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export function ChatPage() {
    const { id } = useParams();
    const { meetings } = useMeetings();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const meeting = meetings.find(m => m.id === id);

    if (!meeting) {
        return (
            <div className="p-6">
                <p className="text-gray-500">Reunión no encontrada</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        // Simular respuesta del AI
        setTimeout(() => {
            const aiMessage: Message = {
                id: crypto.randomUUID(),
                text: `Esta es una respuesta simulada a tu pregunta sobre la reunión "${meeting.title}"`,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col">
            <div className="mb-6 flex-none">
                <h1 className="text-2xl font-semibold mb-2">Chat con la reunión</h1>
                <p className="text-gray-600">{meeting.title}</p>
            </div>

            {/* Mensajes - usar flex-1 para que ocupe el espacio disponible */}
            <div className="bg-white rounded-lg shadow mb-4 p-4 flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map(message => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                    message.sender === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                }`}
                            >
                                <p className="mb-1">{message.text}</p>
                                <span className="text-xs opacity-70">
                                    {message.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg px-4 py-2">
                                <p className="text-gray-500">Escribiendo...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input - usar flex-none para que mantenga su tamaño */}
            <form onSubmit={handleSubmit} className="flex gap-2 flex-none">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Haz una pregunta sobre la reunión..."
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !inputText.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    Enviar
                </button>
            </form>
        </div>
    );
} 