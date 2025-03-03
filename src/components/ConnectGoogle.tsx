import { useState } from 'react';
import { auth } from '../services/firebase/config';
import { GoogleMeetService } from '../services/platforms/googleMeet';

export function ConnectGoogle() {
  const [isConnecting, setIsConnecting] = useState(false);
  const googleService = new GoogleMeetService(auth);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await googleService.connect();
      if (success) {
        // Mostrar mensaje de éxito
        console.log('Conectado exitosamente con Google');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <button 
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-4 py-2 bg-blue-500 text-white rounded-md"
    >
      {isConnecting ? 'Conectando...' : 'Conectar con Google Meet'}
    </button>
  );
} 