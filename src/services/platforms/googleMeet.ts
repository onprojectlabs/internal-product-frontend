import { GoogleAuthProvider, signInWithPopup, Auth } from "firebase/auth";

interface Meeting {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    meetLink?: string;
    attendees: string[];
    status: MeetingStatus;
}

interface GoogleCalendarEvent {
    id: string;
    summary: string;
    start: {
        dateTime: string;
    };
    end: {
        dateTime: string;
    };
    hangoutLink?: string;
    conferenceData?: {
        entryPoints?: Array<{
            uri: string;
        }>;
    };
    attendees?: Array<{
        email: string;
    }>;
}

interface MeetRecording {
    id: string;
    name: string;
    mimeType: string;
    downloadUrl: string;
    createdTime: Date;
    size: number;
}

interface MeetingStatus {
    isRecording?: boolean;
    isFinished?: boolean;
    hasTranscription?: boolean;
    hasSummary?: boolean;
}

/**
 * Servicio para integración con Google Meet
 * Requiere Google Workspace Business Standard o superior para grabaciones
 * @see https://workspace.google.com/pricing
 */
export class GoogleMeetService {
    constructor(private auth: Auth) {}

    private safeSetItem(key: string, value: string) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn("No se pudo guardar en localStorage:", error);
        }
    }

    private safeGetItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn("No se pudo leer de localStorage:", error);
            return null;
        }
    }

    private safeRemoveItem(key: string) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn("No se pudo eliminar de localStorage:", error);
        }
    }

    async connect() {
        try {
            const provider = new GoogleAuthProvider();

            // Añadir los scopes que necesitamos
            provider.addScope(
                "https://www.googleapis.com/auth/calendar.readonly"
            );
            provider.addScope(
                "https://www.googleapis.com/auth/calendar.events.readonly"
            );
            // Scope para acceder a las grabaciones
            provider.addScope("https://www.googleapis.com/auth/drive.readonly");

            // Esto abre la ventana de Google para que el usuario autorice
            const result = await signInWithPopup(this.auth, provider);

            // Guardar el token de acceso
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                this.safeSetItem("googleAccessToken", credential.accessToken);
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error al conectar con Google Meet:", error);
            return false;
        }
    }

    async disconnect() {
        try {
            await this.auth.signOut();
            this.safeRemoveItem("googleAccessToken");
            return true;
        } catch (error) {
            console.error("Error al desconectar:", error);
            return false;
        }
    }

    isConnected(): boolean {
        return !!this.safeGetItem("googleAccessToken");
    }

    private mapCalendarEventToMeeting(event: GoogleCalendarEvent): Meeting {
        return {
            id: event.id,
            title: event.summary,
            startTime: new Date(event.start.dateTime),
            endTime: new Date(event.end.dateTime),
            meetLink:
                event.hangoutLink ||
                event.conferenceData?.entryPoints?.[0]?.uri,
            attendees: event.attendees?.map((a) => a.email) || [],
            status: {},
        };
    }

    async getMeetings(): Promise<Meeting[]> {
        try {
            const token = this.safeGetItem("googleAccessToken");
            if (!token) {
                throw new Error("No hay token de acceso");
            }

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                    new URLSearchParams({
                        timeMin: new Date().toISOString(),
                        singleEvents: "true",
                        orderBy: "startTime",
                        maxResults: "10",
                    }),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Error al obtener reuniones");
            }

            const data = await response.json();

            // Filtrar solo eventos que son reuniones de Meet y mapearlos
            return data.items
                .filter(
                    (event: GoogleCalendarEvent) =>
                        event.hangoutLink || event.conferenceData
                )
                .map(this.mapCalendarEventToMeeting);
        } catch (error) {
            console.error("Error al obtener reuniones:", error);
            return [];
        }
    }

    async getMeetingRecording(
        meetingId: string
    ): Promise<MeetRecording | null> {
        try {
            const token = this.safeGetItem("googleAccessToken");
            if (!token) {
                throw new Error("No hay token de acceso");
            }

            // Las grabaciones de Meet se guardan en Google Drive
            // en una carpeta específica con el ID de la reunión
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?` +
                    new URLSearchParams({
                        q: `name contains '${meetingId}' and mimeType contains 'video/'`,
                        fields: "files(id,name,mimeType,webContentLink,createdTime,size)",
                    }),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Error al obtener la grabación");
            }

            const data = await response.json();
            const recording = data.files[0];

            if (!recording) {
                return null;
            }

            return {
                id: recording.id,
                name: recording.name,
                mimeType: recording.mimeType,
                downloadUrl: recording.webContentLink,
                createdTime: new Date(recording.createdTime),
                size: parseInt(recording.size),
            };
        } catch (error) {
            console.error("Error al obtener la grabación:", error);
            return null;
        }
    }

    async checkForFinishedMeetings() {
        try {
            const meetings = await this.getMeetings();
            const now = new Date();

            // Filtrar reuniones que han terminado recientemente
            const finishedMeetings = meetings.filter(
                (meeting) =>
                    meeting.endTime < now &&
                    meeting.endTime > new Date(now.getTime() - 30 * 60000) // últimos 30 minutos
            );

            // Intentar obtener las grabaciones
            for (const meeting of finishedMeetings) {
                const recording = await this.getMeetingRecording(meeting.id);
                if (recording) {
                    // Aquí implementaríamos la lógica para guardar la grabación
                    // en el sistema de almacenamiento de nuestra app
                    await this.saveRecording(recording);
                }
            }
        } catch (error) {
            console.error("Error al verificar reuniones finalizadas:", error);
        }
    }

    private async saveRecording(recording: MeetRecording) {
        try {
            const token = this.safeGetItem("googleAccessToken");
            if (!token) {
                throw new Error("No hay token de acceso");
            }

            // 1. Descargar el archivo
            const response = await fetch(recording.downloadUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Error al descargar la grabación");
            }

            // 2. Convertir a Blob
            const blob = await response.blob();

            // 3. Crear un objeto con la información de la grabación
            const recordingInfo = {
                id: recording.id,
                name: recording.name,
                type: recording.mimeType,
                size: recording.size,
                createdAt: recording.createdTime,
                blob: blob,
            };

            // 4. Emitir evento para notificar nueva grabación
            const event = new CustomEvent("newRecording", {
                detail: recordingInfo,
            });
            window.dispatchEvent(event);

            // 5. Guardar referencia en localStorage
            const savedRecordings = JSON.parse(
                this.safeGetItem("savedRecordings") || "[]"
            );
            savedRecordings.push({
                id: recording.id,
                name: recording.name,
                createdAt: recording.createdTime,
            });
            this.safeSetItem(
                "savedRecordings",
                JSON.stringify(savedRecordings)
            );

            return recordingInfo;
        } catch (error) {
            console.error("Error al guardar la grabación:", error);
            throw error;
        }
    }
}
