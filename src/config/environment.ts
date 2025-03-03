import { MockGoogleMeetService } from "../services/platforms/__mocks__/googleMeet";
import { GoogleMeetService } from "../services/platforms/googleMeet";
import { auth } from "../services/firebase/config";

// Añadir una variable de entorno para forzar el modo mock
export const isTestEnvironment =
    process.env.NODE_ENV === "test" ||
    import.meta.env.VITE_USE_MOCKS === "true";

export const getMeetService = () => {
    if (isTestEnvironment) {
        console.log("🔧 Usando servicio mock de Google Meet");
        return new MockGoogleMeetService(auth);
    }
    console.log("🔌 Usando servicio real de Google Meet");
    return new GoogleMeetService(auth);
};
