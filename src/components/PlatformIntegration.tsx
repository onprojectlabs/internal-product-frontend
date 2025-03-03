import { useState, useEffect } from 'react';
import { TeamsIcon, ZoomIcon, MeetIcon } from '../icons';
import { getMeetService } from '../config/environment';

interface Platform {
  name: 'teams' | 'zoom' | 'meet';
  icon: React.ComponentType<{ className?: string }>;
  isConnected: boolean;
}

export function PlatformIntegration() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    { name: 'teams', icon: TeamsIcon, isConnected: false },
    { name: 'zoom', icon: ZoomIcon, isConnected: false },
    { name: 'meet', icon: MeetIcon, isConnected: false },
  ]);
  const [isConnecting, setIsConnecting] = useState(false);

  const googleMeetService = getMeetService();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    const isMeetConnected = googleMeetService.isConnected();
    
    setPlatforms(prev => prev.map(platform => 
      platform.name === 'meet' 
        ? { ...platform, isConnected: isMeetConnected }
        : platform
    ));
  };

  const handleConnect = async (platform: Platform) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      if (platform.name === 'meet') {
        if (platform.isConnected) {
          await googleMeetService.disconnect();
        } else {
          await googleMeetService.connect();
        }
        await checkConnectionStatus();
      }
      // Implementar otros servicios aquí
    } catch (error) {
      console.error(`Error ${platform.isConnected ? 'disconnecting from' : 'connecting to'} ${platform.name}:`, error);
    } finally {
      setIsConnecting(false);
    }
  };

  const isMockMode = () => import.meta.env.VITE_USE_MOCKS === "true";

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        Conecta tus plataformas de reuniones
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <div key={platform.name} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <platform.icon className="h-8 w-8" />
                <span className="font-medium capitalize">{platform.name}</span>
              </div>
              
              <button
                onClick={() => handleConnect(platform)}
                disabled={isConnecting}
                className={`px-4 py-2 rounded-md ${
                  isConnecting 
                    ? 'bg-gray-300 cursor-not-allowed'
                    : platform.isConnected
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isConnecting 
                  ? 'Conectando...' 
                  : platform.isConnected 
                    ? 'Desconectar' 
                    : 'Conectar'
                }
              </button>
            </div>
            
            {platform.isConnected && (
              <div className="mt-3 text-sm">
                <span className="text-gray-500">
                  Sincronizando automáticamente tus reuniones
                </span>
                {platform.name === 'meet' && isMockMode() && (
                  <span className="ml-2 text-yellow-600 text-xs">
                    (Modo Mock)
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 