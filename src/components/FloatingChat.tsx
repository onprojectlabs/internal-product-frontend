import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquareIcon, 
  XIcon, 
  SendIcon,
  MinimizeIcon,
  MaximizeIcon,
  Brain,
  Plus,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
import { MentionPopup, MentionItem } from './MentionPopup';
import { brainService } from '../services/brainService';
import { Message, Conversation } from '../types/brain';
import { WelcomeMessage } from './WelcomeMessage';

interface ChatContext {
  type: 'global' | 'meeting' | 'folder';
  id?: string;
  name?: string;
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [context, setContext] = useState<ChatContext>({ type: 'global' });
  const [mentionState, setMentionState] = useState<{
    isOpen: boolean;
    query: string;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    query: '',
    position: { top: 0, left: 0 }
  });
  const [showConversations, setShowConversations] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Detectar el contexto basado en la ruta
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setContext({ type: 'global' });
    } else if (path.startsWith('/meeting/')) {
      const id = path.split('/')[2];
      setContext({ 
        type: 'meeting', 
        id, 
        name: 'Daily Scrum - Equipo Frontend' 
      });
    } else if (path.startsWith('/folder/')) {
      const id = path.split('/')[2];
      setContext({ 
        type: 'folder', 
        id, 
        name: 'Proyecto Alpha' 
      });
    }
  }, [location]);

  // Cargar conversaciones al abrir
  useEffect(() => {
    const stored = brainService.getConversations();
    setConversations(stored);
    if (stored.length > 0) {
      setCurrentConversation(stored[0]);
    }
  }, [isOpen]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Math.random().toString(36).substring(7),
      title: 'Nueva conversación',
      messages: [],
      createdAt: new Date()
    };
    
    const updated = brainService.saveConversation(newConversation);
    setConversations(updated);
    setCurrentConversation(newConversation);
    setShowConversations(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentConversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // Si es el primer mensaje, actualizar el título
    const isFirstMessage = currentConversation.messages.length === 0;
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      ...(isFirstMessage && { title: message.substring(0, 40) })
    };

    setMessage('');
    
    // Actualizar estado y localStorage
    const updatedConversations = brainService.saveConversation(updatedConversation);
    setConversations(updatedConversations);
    setCurrentConversation(updatedConversation);

    // Simular respuesta
    const response = await brainService.simulateResponse(message);
    const assistantMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    const conversationWithResponse = {
      ...updatedConversation,
      messages: [...updatedConversation.messages, assistantMessage]
    };

    const finalConversations = brainService.saveConversation(conversationWithResponse);
    setConversations(finalConversations);
    setCurrentConversation(conversationWithResponse);
  };

  // No mostrar el botón si estamos en la página del cerebro
  if (location.pathname === '/brain' || location.pathname.startsWith('/brain/')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Brain className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-background border border-border rounded-lg shadow-xl w-[400px] h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <button
              onClick={() => setShowConversations(!showConversations)}
              className="flex items-center gap-2 hover:bg-muted px-3 py-1.5 rounded-md transition-colors"
            >
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium truncate max-w-[200px]">
                {currentConversation?.title || 'Nueva conversación'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={createNewConversation}
                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                title="Nueva conversación"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/brain')}
                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                title="Ir a Cerebro"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                title="Cerrar"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showConversations ? (
            <div className="flex-1 p-4">
              <div className="space-y-2">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setCurrentConversation(conv);
                      setShowConversations(false);
                    }}
                    className="w-full flex items-center gap-2 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <Brain className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conv.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.messages[conv.messages.length - 1]?.content || 'Nueva conversación'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentConversation?.messages.length === 0 && <WelcomeMessage />}
                {currentConversation?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 relative"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMessage(value);

                      // Solo buscamos menciones si no hay un espacio después del último @
                      const lastAtIndex = value.lastIndexOf('@');
                      const textAfterAt = value.slice(lastAtIndex + 1);
                      
                      if (lastAtIndex !== -1 && !textAfterAt.includes(' ')) {
                        const query = textAfterAt;
                        const input = inputRef.current;
                        
                        if (input) {
                          setMentionState({
                            isOpen: true,
                            query,
                            position: {
                              top: 300,
                              left: 0
                            }
                          });
                        }
                      } else {
                        setMentionState(prev => ({ ...prev, isOpen: false }));
                      }
                    }}
                    placeholder="Escribe tu pregunta... (usa @ para mencionar)"
                    className="flex-1 bg-muted p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <SendIcon className="h-5 w-5" />
                  </button>

                  {mentionState.isOpen && (
                    <MentionPopup
                      query={mentionState.query}
                      position={mentionState.position}
                      onSelect={(item) => {
                        const lastAtIndex = message.lastIndexOf('@');
                        const newMessage = message.slice(0, lastAtIndex) + 
                          `@${item.name} ` + 
                          message.slice(lastAtIndex + mentionState.query.length + 1);
                        
                        setMessage(newMessage);
                        setMentionState({ // Reseteamos completamente el estado
                          isOpen: false,
                          query: '',
                          position: { top: 0, left: 0 }
                        });
                        inputRef.current?.focus();
                      }}
                      onClose={() => setMentionState(prev => ({ ...prev, isOpen: false }))}
                      context={context}
                    />
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 