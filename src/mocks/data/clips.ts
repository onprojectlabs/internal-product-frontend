import { Clip } from "../types";
import { getRelativeDate } from "./utils";

export const clips: Clip[] = [
    {
        id: "c1",
        title: "Demo de nueva funcionalidad",
        name: "Demo de nueva funcionalidad",
        duration: "5:30",
        source: "meeting",
        createdAt: getRelativeDate(-4),
        date: getRelativeDate(-4).toLocaleDateString(),
        folderId: "1", // Proyecto Alpha
        status: "ready",
        thumbnailUrl: "/thumbnails/demo.jpg",
        summary:
            "Demostración detallada de las nuevas características implementadas...",
        highlights: [
            "Nueva interfaz de usuario",
            "Sistema de búsqueda mejorado",
            "Integración con APIs externas",
        ],
        downloadUrl: "/clips/demo.mp4",
    },
    {
        id: "c2",
        title: "Presentación campaña Q1",
        name: "Presentación campaña Q1",
        duration: "8:15",
        source: "upload",
        createdAt: getRelativeDate(-2),
        date: getRelativeDate(-2).toLocaleDateString(),
        folderId: "2", // Marketing Q1
        status: "ready",
        thumbnailUrl: "/thumbnails/campaign.jpg",
        summary:
            "Presentación de la estrategia de marketing para Q1. Se analizan los resultados previos y se proponen nuevas iniciativas para aumentar el engagement y conversión.",
        highlights: [
            "Análisis de resultados Q4 2023",
            "Nuevos canales de adquisición",
            "Estrategia de contenidos para redes sociales",
        ],
        downloadUrl: "/clips/campaign.mp4",
    },
    {
        id: "c3",
        title: "Revisión de diseño - Dashboard",
        name: "Revisión de diseño - Dashboard",
        duration: "12:45",
        source: "meeting",
        createdAt: getRelativeDate(-1),
        date: getRelativeDate(-1).toLocaleDateString(),
        folderId: "4", // Diseño de Producto
        status: "ready",
        thumbnailUrl: "/thumbnails/design.jpg",
        summary:
            "Revisión completa del nuevo diseño del dashboard. Se discuten mejoras en la visualización de datos y la experiencia de usuario general.",
        highlights: [
            "Nueva distribución de widgets",
            "Sistema de filtros mejorado",
            "Personalización por usuario",
        ],
        downloadUrl: "/clips/dashboard-review.mp4",
    },
];
