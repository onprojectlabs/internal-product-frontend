import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '../../components/ui/Select';
import { profileService, Language } from '../../services/auth/profileService';
import { User } from '../../types/auth';

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [language, setLanguage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cargar el perfil del usuario
        const profileData = await profileService.getProfile();
        setUser(profileData);
        setFullName(profileData.full_name);
        setLanguage(profileData.default_language);

        // Cargar los idiomas disponibles
        const languagesData = await profileService.getAvailableLanguages();
        setLanguages(languagesData);
        console.log('Idiomas disponibles:', languagesData);
      } catch (err) {
        setError('Error al cargar los datos del perfil. Por favor, intenta de nuevo.');
        console.error('Error fetching profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan si se está actualizando
    if (password && password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setPasswordError(null);
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      // Preparar los datos para actualizar
      const updateData: {
        full_name?: string;
        default_language?: string;
        password?: string;
      } = {};

      if (fullName !== user?.full_name) {
        updateData.full_name = fullName;
      }

      if (language !== user?.default_language) {
        updateData.default_language = language;
      }

      if (password) {
        updateData.password = password;
      }

      // Solo hacer la petición si hay cambios
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await profileService.updateProfile(updateData);
        setUser(updatedUser);
        
        // Limpiar campos de contraseña después de actualizar
        setPassword('');
        setConfirmPassword('');
        
        setSuccessMessage('Perfil actualizado con éxito');
      } else {
        setSuccessMessage('No se han detectado cambios');
      }
    } catch (err) {
      setError('Error al actualizar el perfil. Por favor, intenta de nuevo.');
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perfil de Usuario</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 text-green-800 p-4 rounded-md">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El correo electrónico no se puede modificar
              </p>
            </div>

            <div>
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="language">Idioma predeterminado</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Selecciona un idioma" />
                </SelectTrigger>
                <SelectContent>
                  {languages && languages.length > 0 ? (
                    languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          {lang.icon_url && (
                            <img 
                              src={lang.icon_url} 
                              alt={lang.name} 
                              className="h-4 w-4 object-contain"
                            />
                          )}
                          <span>{lang.name}</span>
                          {lang.native_name && lang.native_name !== lang.name && (
                            <span className="text-xs text-muted-foreground">
                              ({lang.native_name})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-languages" disabled>
                      No hay idiomas disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium">Cambiar contraseña</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Deja estos campos en blanco si no deseas cambiar tu contraseña
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                  />
                  {passwordError && (
                    <p className="text-xs text-destructive mt-1">{passwordError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 