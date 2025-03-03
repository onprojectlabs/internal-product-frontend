import { Auth } from "firebase/auth";

interface Meeting {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    meetLink?: string;
    attendees: string[];
    status: MeetingStatus;
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

interface GoogleCalendarEvent {
    id: string;
    summary: string; // Título de la reunión
    start: {
        dateTime: string; // Fecha/hora inicio
    };
    end: {
        dateTime: string; // Fecha/hora fin
    };
    hangoutLink?: string; // Link de Meet
    conferenceData?: {
        // Info de la videoconferencia
        conferenceId: string;
        entryPoints: Array<{
            uri: string;
            label?: string;
            entryPointType: "video" | "phone" | "sip";
        }>;
    };
    attendees?: Array<{
        email: string;
        responseStatus: "needsAction" | "declined" | "tentative" | "accepted";
    }>;
}

interface GoogleDriveFile {
    id: string;
    name: string;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
    webViewLink: string; // Link para ver
    webContentLink: string; // Link para descargar
    size: string;
    parents: string[]; // IDs de carpetas contenedoras
}

export class MockGoogleMeetService {
    constructor(private auth: Auth) {}

    async connect() {
        return true;
    }

    async disconnect() {
        return true;
    }

    isConnected(): boolean {
        return true;
    }

    private mapCalendarEventToMeeting(event: GoogleCalendarEvent): Meeting {
        return {
            id: event.id,
            title: event.summary,
            startTime: new Date(event.start.dateTime),
            endTime: new Date(event.end.dateTime),
            meetLink:
                event.hangoutLink || event.conferenceData?.entryPoints[0]?.uri,
            attendees: event.attendees?.map((a) => a.email) || [],
            status: {},
        };
    }

    async getMeetings(): Promise<Meeting[]> {
        const calendarEvents = await this.getCalendarEvents();
        return calendarEvents.map(this.mapCalendarEventToMeeting);
    }

    private async getCalendarEvents(): Promise<GoogleCalendarEvent[]> {
        const now = new Date();
        return [
            {
                id: "meet_upcoming_1",
                summary: "Product Review",
                start: {
                    dateTime: new Date(
                        now.getTime() + 2 * 60 * 60000
                    ).toISOString(),
                },
                end: {
                    dateTime: new Date(
                        now.getTime() + 3 * 60 * 60000
                    ).toISOString(),
                },
                hangoutLink: "https://meet.google.com/mock-link-1",
                conferenceData: {
                    conferenceId: "mock-conf-1",
                    entryPoints: [
                        {
                            uri: "https://meet.google.com/mock-link-1",
                            entryPointType: "video",
                        },
                    ],
                },
                attendees: [
                    {
                        email: "user1@example.com",
                        responseStatus: "accepted",
                    },
                    {
                        email: "user2@example.com",
                        responseStatus: "tentative",
                    },
                ],
            },
            {
                id: "meet_processing_1",
                summary: "Sprint Planning",
                start: {
                    dateTime: new Date(
                        now.getTime() + 4 * 60 * 60000
                    ).toISOString(),
                },
                end: {
                    dateTime: new Date(
                        now.getTime() + 5 * 60 * 60000
                    ).toISOString(),
                },
                hangoutLink: "https://meet.google.com/mock-link-2",
                conferenceData: {
                    conferenceId: "mock-conf-2",
                    entryPoints: [
                        {
                            uri: "https://meet.google.com/mock-link-2",
                            entryPointType: "video",
                        },
                    ],
                },
                attendees: [
                    {
                        email: "user3@example.com",
                        responseStatus: "accepted",
                    },
                    {
                        email: "user4@example.com",
                        responseStatus: "tentative",
                    },
                ],
            },
            {
                id: "meet_finished_1",
                summary: "Tech Review",
                start: {
                    dateTime: new Date(
                        now.getTime() + 6 * 60 * 60000
                    ).toISOString(),
                },
                end: {
                    dateTime: new Date(
                        now.getTime() + 7 * 60 * 60000
                    ).toISOString(),
                },
                hangoutLink: "https://meet.google.com/mock-link-3",
                conferenceData: {
                    conferenceId: "mock-conf-3",
                    entryPoints: [
                        {
                            uri: "https://meet.google.com/mock-link-3",
                            entryPointType: "video",
                        },
                    ],
                },
                attendees: [
                    {
                        email: "user5@example.com",
                        responseStatus: "accepted",
                    },
                    {
                        email: "user6@example.com",
                        responseStatus: "accepted",
                    },
                ],
            },
        ];
    }

    async getMeetingRecording(
        meetingId: string
    ): Promise<GoogleDriveFile | null> {
        return {
            id: `rec_${meetingId}`,
            name: `Meeting Recording - ${meetingId}.mp4`,
            mimeType: "video/mp4",
            createdTime: new Date().toISOString(),
            modifiedTime: new Date().toISOString(),
            webViewLink: `https://drive.google.com/file/d/${meetingId}/view`,
            webContentLink: `https://drive.google.com/uc?id=${meetingId}&export=download`,
            size: "15000000", // 15MB en bytes
            parents: ["mock_folder_id"],
        };
    }

    async checkForFinishedMeetings() {
        // Simular que encontramos una grabación
        const meetings = await this.getMeetings();
        const now = new Date();

        // Simular que la primera reunión ya terminó
        const mockMeeting = {
            ...meetings[0],
            endTime: new Date(now.getTime() - 5 * 60000), // 5 minutos atrás
        };

        const recording = {
            id: `rec_${mockMeeting.id}`,
            name: `Grabación de ${mockMeeting.title}`,
            mimeType: "video/mp4",
            downloadUrl: "mock-url",
            createdTime: mockMeeting.endTime,
            size: 1024 * 1024,
        };

        await this.saveRecording(recording);
    }

    private async saveRecording(recording: MeetRecording) {
        const recordingInfo = {
            id: recording.id,
            name: recording.name,
            type: recording.mimeType,
            size: recording.size,
            createdAt: recording.createdTime,
            blob: new Blob(["mock data"], { type: recording.mimeType }),
        };

        const event = new CustomEvent("newRecording", {
            detail: recordingInfo,
        });
        window.dispatchEvent(event);

        return recordingInfo;
    }
}
