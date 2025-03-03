import { Folder } from "../../context/MeetingsContext";
import { meetings } from "./meetings";
import { files } from "./files";
import { clips } from "./clips";

// Carpetas principales
export const folders: Folder[] = [
    {
        id: "1",
        name: "Proyecto Alpha",
        description: "Desarrollo de la nueva plataforma",
        createdAt: new Date("2024-01-15"),
        stats: {
            meetings: 8,
            files: 12,
            clips: 5,
        },
        items: [
            // Convertir reuniones a items
            ...meetings
                .filter((m) => m.folderId === "1")
                .map((m) => ({
                    id: m.id,
                    type: "meeting",
                    name: m.title,
                    date: m.date.toLocaleDateString(),
                    status: m.status.hasTranscription
                        ? "Transcrito"
                        : "Pendiente",
                })),
            // Convertir archivos a items
            ...files
                .filter((f) => f.folderId === "1")
                .map((f) => ({
                    id: f.id,
                    type: "document",
                    name: f.name,
                    date: f.createdAt.toLocaleDateString(),
                    size: `${Math.round(f.size / 1024 / 1024)} MB`,
                })),
            // Convertir clips a items
            ...clips
                .filter((c) => c.folderId === "1")
                .map((c) => ({
                    id: c.id,
                    type: "clip",
                    name: c.title,
                    date: c.createdAt.toLocaleDateString(),
                    duration: c.duration,
                })),
        ],
    },
    {
        id: "2",
        name: "Marketing Q1",
        description: "Campañas y estrategias del primer trimestre",
        createdAt: new Date("2024-01-20"),
        stats: {
            meetings: 5,
            files: 8,
            clips: 3,
        },
        items: [
            // Convertir reuniones a items
            ...meetings
                .filter((m) => m.folderId === "2")
                .map((m) => ({
                    id: m.id,
                    type: "meeting",
                    name: m.title,
                    date: m.date.toLocaleDateString(),
                    status: m.status.hasTranscription
                        ? "Transcrito"
                        : "Pendiente",
                })),
            // Convertir archivos a items
            ...files
                .filter((f) => f.folderId === "2")
                .map((f) => ({
                    id: f.id,
                    type: "document",
                    name: f.name,
                    date: f.createdAt.toLocaleDateString(),
                    size: `${Math.round(f.size / 1024 / 1024)} MB`,
                })),
            // Convertir clips a items
            ...clips
                .filter((c) => c.folderId === "2")
                .map((c) => ({
                    id: c.id,
                    type: "clip",
                    name: c.title,
                    date: c.createdAt.toLocaleDateString(),
                    duration: c.duration,
                })),
        ],
    },
    {
        id: "3",
        name: "Recursos Humanos",
        description: "Procesos internos y contrataciones",
        createdAt: new Date("2024-01-25"),
        stats: {
            meetings: 4,
            files: 6,
            clips: 2,
        },
        items: [
            // Convertir reuniones a items
            ...meetings
                .filter((m) => m.folderId === "3")
                .map((m) => ({
                    id: m.id,
                    type: "meeting",
                    name: m.title,
                    date: m.date.toLocaleDateString(),
                    status: m.status.hasTranscription
                        ? "Transcrito"
                        : "Pendiente",
                })),
            // Convertir archivos a items
            ...files
                .filter((f) => f.folderId === "3")
                .map((f) => ({
                    id: f.id,
                    type: "document",
                    name: f.name,
                    date: f.createdAt.toLocaleDateString(),
                    size: `${Math.round(f.size / 1024 / 1024)} MB`,
                })),
            // Convertir clips a items
            ...clips
                .filter((c) => c.folderId === "3")
                .map((c) => ({
                    id: c.id,
                    type: "clip",
                    name: c.title,
                    date: c.createdAt.toLocaleDateString(),
                    duration: c.duration,
                })),
        ],
    },
    {
        id: "4",
        name: "Diseño de Producto",
        description: "UX/UI y experiencia de usuario",
        createdAt: new Date("2024-02-01"),
        stats: {
            meetings: 6,
            files: 15,
            clips: 4,
        },
        items: [
            // Convertir reuniones a items
            ...meetings
                .filter((m) => m.folderId === "4")
                .map((m) => ({
                    id: m.id,
                    type: "meeting",
                    name: m.title,
                    date: m.date.toLocaleDateString(),
                    status: m.status.hasTranscription
                        ? "Transcrito"
                        : "Pendiente",
                })),
            // Convertir archivos a items
            ...files
                .filter((f) => f.folderId === "4")
                .map((f) => ({
                    id: f.id,
                    type: "document",
                    name: f.name,
                    date: f.createdAt.toLocaleDateString(),
                    size: `${Math.round(f.size / 1024 / 1024)} MB`,
                })),
            // Convertir clips a items
            ...clips
                .filter((c) => c.folderId === "4")
                .map((c) => ({
                    id: c.id,
                    type: "clip",
                    name: c.title,
                    date: c.createdAt.toLocaleDateString(),
                    duration: c.duration,
                })),
        ],
    },
];
