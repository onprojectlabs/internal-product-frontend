import { useState, useEffect } from 'react';
import { Brain, Plus, Send, Trash2, Pencil, MoreVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { brainService } from '../services/brainService';
import { Conversation, Message } from '../types/brain';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingState } from '../components/LoadingState';
import { WelcomeMessage } from '../components/WelcomeMessage';
import { BrainEmptyState } from '../components/BrainEmptyState';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { useTheme } from '../hooks/useTheme';

export function BrainPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const { colors } = useTheme();

  // Cargar todas las conversaciones
  useEffect(() => {
    const stored = brainService.getConversations();
    setConversations(stored);
  }, []);

  // Cargar conversación específica si hay ID
  useEffect(() => {
    if (id) {
      setIsLoadingConversation(true);
      // Simular carga de API
      setTimeout(() => {
        const conversation = conversations.find(c => c.id === id);
        if (conversation) {
          setCurrentConversation(conversation);
        } else {
          navigate('/brain');
        }
        setIsLoadingConversation(false);
      }, 1000);
    }
  }, [id, conversations, navigate]);

  // Cuando se selecciona una conversación, navegar a su ruta
  const handleConversationSelect = (conversation: Conversation) => {
    navigate(`/brain/${conversation.id}`);
  };

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
  };

  const generateConversationTitle = (message: string): string => {
    // Limitar a 40 caracteres y añadir ...
    const maxLength = 40;
    const cleanMessage = message.trim();
    return cleanMessage.length > maxLength 
      ? cleanMessage.substring(0, maxLength) + '...'
      : cleanMessage;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Si es el primer mensaje, actualizar el título
    const isFirstMessage = currentConversation.messages.length === 0;
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      ...(isFirstMessage && { title: generateConversationTitle(inputMessage) })
    };

    setInputMessage('');
    
    // Actualizar estado y localStorage
    const updatedConversations = brainService.saveConversation(updatedConversation);
    setConversations(updatedConversations);
    setCurrentConversation(updatedConversation);

    // Simular respuesta
    const response = await brainService.simulateResponse(inputMessage);
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

  const handleDelete = (id: string) => {
    setConversationToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      const updated = brainService.deleteConversation(conversationToDelete);
      setConversations(updated);
      if (currentConversation?.id === conversationToDelete) {
        setCurrentConversation(null);
        navigate('/brain');
      }
    }
  };

  const handleRename = (id: string) => {
    setEditingId(id);
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setNewTitle(conversation.title);
    }
  };

  const saveNewTitle = (id: string) => {
    if (newTitle.trim()) {
      const updated = brainService.renameConversation(id, newTitle.trim());
      setConversations(updated);
      setEditingId(null);
      setNewTitle('');
    }
  };

  return (
    <>
      <div className="flex h-full">
        {/* Sidebar de conversaciones */}
        <div className="w-64 border-r border-border bg-card p-4">
          <Button
            onClick={createNewConversation}
            className="w-full mb-4 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva conversación
          </Button>

          <div className="space-y-2">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className="group relative"
              >
                {editingId === conv.id ? (
                  <div className="p-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveNewTitle(conv.id);
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setNewTitle('');
                        }
                      }}
                      onBlur={() => {
                        setEditingId(null);
                        setNewTitle('');
                      }}
                      className="w-full bg-muted p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => handleConversationSelect(conv)}
                    className={`w-full p-2 text-left rounded-lg transition-colors flex items-center justify-between group ${
                      currentConversation?.id === conv.id
                        ? 'bg-primary/10 text-primary'
                        : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground border border-input'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Brain className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{conv.title}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(conv.id);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-accent rounded text-slate-500 hover:text-slate-700 transition-colors"
                        title="Renombrar"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conv.id);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-accent rounded text-slate-500 hover:text-destructive transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Área principal */}
        <div className="flex-1 flex flex-col">
          {isLoadingConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingState 
                message="Cargando conversación..." 
                className="bg-transparent"
              />
            </div>
          ) : currentConversation ? (
            <>
              {/* Mensajes */}
              <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-3xl mx-auto space-y-6">
                  {currentConversation.messages.length === 0 && <WelcomeMessage />}
                  {currentConversation.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="max-w-3xl mx-auto flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-muted p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <BrainEmptyState onCreateNew={createNewConversation} />
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setConversationToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar conversación"
        description="¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer."
      />
    </>
  );
} 