import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface FolderItem {
  id: string;
  type: 'meeting' | 'clip' | 'document';
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  items: FolderItem[];
}

interface FoldersContextType {
  folders: Folder[];
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Omit<Folder, 'id'>) => Folder;
  addItemToFolder: (folderId: string, item: FolderItem) => void;
  removeItemFromFolder: (folderId: string, itemId: string) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useLocalStorage<Folder[]>('folders', []);

  const addFolder = (folder: Omit<Folder, 'items' | 'createdAt' | 'updatedAt'>) => {
    const newFolder: Folder = {
      ...folder,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setFolders([...folders, newFolder]);
    return newFolder;
  };

  const addItemToFolder = (folderId: string, item: FolderItem) => {
    setFolders(folders.map(folder => 
      folder.id === folderId 
        ? { 
            ...folder, 
            items: folder.items.some(existingItem => 
              existingItem.id === item.id && existingItem.type === item.type
            )
              ? folder.items
              : [...folder.items, item],
            updatedAt: new Date()
          }
        : folder
    ));
  };

  const removeItemFromFolder = (folderId: string, itemId: string) => {
    setFolders(folders.map(folder =>
      folder.id === folderId
        ? {
            ...folder,
            items: folder.items.filter(item => item.id !== itemId),
            updatedAt: new Date()
          }
        : folder
    ));
  };

  const updateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders(folders.map(folder => 
      folder.id === id ? { ...folder, ...updates, updatedAt: new Date() } : folder
    ));
  };

  const deleteFolder = (id: string) => {
    setFolders(folders.filter(folder => folder.id !== id));
  };

  return (
    <FoldersContext.Provider value={{ 
      folders, 
      setFolders, 
      addFolder,
      addItemToFolder,
      removeItemFromFolder,
      updateFolder,
      deleteFolder
    }}>
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error('useFolders must be used within a FoldersProvider');
  }
  return context;
} 