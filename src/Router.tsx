import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { MeetingsPage } from './pages/meetings/MeetingsPage';
import { ClipsPage } from './pages/clips/ClipsPage';
import { IntegrationsPage } from './pages/integrations/IntegrationsPage';
import { FolderPage } from './pages/folders/FolderPage';
import { MeetingPage } from './pages/meetings/MeetingPage';
import { ClipPage } from './pages/clips/ClipPage';
import { FoldersPage } from './pages/folders/FoldersPage';
import { BrainPage } from './pages/brain/BrainPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { DocumentPage } from './pages/documents/DocumentPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { useAuth } from './context/AuthContext';

function LoadingScreen() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

export function Router() {
  return (
    <div className="w-full h-full relative">
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="brain" element={<BrainPage />} />
          <Route path="folders" element={<FoldersPage />} />
          <Route path="folder/:id" element={<FolderPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="meeting/:id" element={<MeetingPage />} />
          <Route path="clips" element={<ClipsPage />} />
          <Route path="clip/:id" element={<ClipPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="document/:id" element={<DocumentPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </div>
  );
} 