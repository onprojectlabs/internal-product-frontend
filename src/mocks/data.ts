import { Project } from "../types";

export const mockProjects: Project[] = [
    {
        id: "1",
        name: "Proyecto Alpha",
        description: "Desarrollo de nueva plataforma",
        createdAt: "2024-02-19",
        updatedAt: "2024-02-19",
        folders: [
            {
                id: "1",
                name: "Reuniones de Planificación",
                createdAt: "2024-02-19",
                meetings: [
                    {
                        id: "1",
                        name: "Product Review",
                        platform: "meet",
                        status: "scheduled",
                        duration: "1h",
                        date: "2024-03-25T13:57:00",
                        participants: ["Juan P.", "María S.", "Carlos R."],
                    },
                    {
                        id: "2",
                        name: "Sprint Planning",
                        platform: "meet",
                        status: "scheduled",
                        duration: "1h 30m",
                        date: "2024-03-26T15:57:00",
                        participants: [
                            "Juan P.",
                            "María S.",
                            "Carlos R.",
                            "Ana M.",
                        ],
                    },
                    {
                        id: "3",
                        name: "Tech Review",
                        platform: "meet",
                        status: "transcribing",
                        duration: "1h",
                        date: "2024-02-19T17:57:00",
                        participants: ["Carlos R.", "Ana M.", "Luis T."],
                    },
                ],
            },
            {
                id: "2",
                name: "Reuniones Técnicas",
                createdAt: "2024-02-19",
                meetings: [
                    {
                        id: "4",
                        name: "Arquitectura del Sistema",
                        platform: "meet",
                        status: "summarizing",
                        duration: "2h",
                        date: "2024-02-21T11:00:00",
                        participants: ["Carlos R.", "Ana M.", "Luis T."],
                    },
                ],
            },
        ],
    },
    {
        id: "2",
        name: "Proyecto Beta",
        description: "Migración de sistema legacy",
        createdAt: "2024-02-18",
        updatedAt: "2024-02-19",
        folders: [
            {
                id: "3",
                name: "Reuniones con Cliente",
                createdAt: "2024-02-18",
                meetings: [
                    {
                        id: "4",
                        name: "Kick-off Meeting",
                        platform: "zoom",
                        status: "completed",
                        duration: "1h",
                        date: "2024-02-18T09:00:00",
                        participants: ["María S.", "Cliente A", "Cliente B"],
                        summary:
                            "Presentación del equipo y definición de expectativas...",
                    },
                ],
            },
        ],
    },
    {
        id: "5",
        name: "Daily Scrum",
        platform: "teams",
        status: "transcribing",
        duration: "15m",
        date: "2024-02-25T10:00:00",
        participants: ["Juan P.", "María S.", "Carlos R."],
    },
];
