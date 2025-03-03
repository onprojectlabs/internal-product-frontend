import { Message, Conversation } from "../types/brain";

const STORAGE_KEY = "brain_conversations";

export const brainService = {
    getConversations(): Conversation[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    saveConversation(conversation: Conversation) {
        const conversations = this.getConversations();
        const existingIndex = conversations.findIndex(
            (c) => c.id === conversation.id
        );

        if (existingIndex >= 0) {
            conversations[existingIndex] = conversation;
        } else {
            conversations.unshift(conversation); // Añadir al principio
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        return conversations;
    },

    async simulateResponse(message: string): Promise<string> {
        // Simular delay de API
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return `Esta es una respuesta simulada a: "${message}"`;
    },

    deleteConversation(id: string) {
        const conversations = this.getConversations();
        const filtered = conversations.filter((c) => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
    },

    renameConversation(id: string, newTitle: string) {
        const conversations = this.getConversations();
        const updated = conversations.map((conv) =>
            conv.id === id ? { ...conv, title: newTitle } : conv
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    },
};
