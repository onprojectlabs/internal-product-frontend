import { File } from "../types";
import { getRelativeDate } from "./utils";

export const files: File[] = [
    {
        id: "f1",
        name: "Especificaciones técnicas v2.pdf",
        type: "document",
        size: 2500000,
        createdAt: getRelativeDate(-5),
        date: getRelativeDate(-5).toLocaleDateString(),
        folderId: "1", // Proyecto Alpha
        status: "ready",
        summary:
            "Documento detallado de especificaciones técnicas del proyecto. Incluye arquitectura del sistema, stack tecnológico, requisitos de infraestructura y planes de escalabilidad. Se detallan también los endpoints de la API y los modelos de datos.",
        downloadUrl: "/files/specs-v2.pdf",
    },
    {
        id: "f2",
        name: "Plan de marketing 2024.xlsx",
        type: "spreadsheet",
        size: 1800000,
        createdAt: getRelativeDate(-3),
        date: getRelativeDate(-3).toLocaleDateString(),
        folderId: "2", // Marketing Q1
        status: "ready",
        summary:
            "Plan estratégico de marketing para el primer trimestre de 2024. Contiene presupuestos, KPIs, calendario de campañas, análisis de competencia y proyecciones de crecimiento. Incluye también métricas de campañas anteriores y objetivos por canal.",
        downloadUrl: "/files/marketing-plan-2024.xlsx",
    },
    {
        id: "f3",
        name: "Diseño del sistema.pptx",
        type: "presentation",
        size: 3500000,
        createdAt: getRelativeDate(-2),
        date: getRelativeDate(-2).toLocaleDateString(),
        folderId: "4", // Diseño de Producto
        status: "ready",
        summary:
            "Presentación del nuevo diseño del sistema, incluyendo mockups, flujos de usuario, guía de estilos y componentes. Se detallan las decisiones de diseño, resultados de pruebas de usabilidad y plan de implementación por fases.",
        downloadUrl: "/files/system-design.pptx",
    },
    {
        id: "f4",
        name: "Manual de onboarding.pdf",
        type: "document",
        size: 1200000,
        createdAt: getRelativeDate(-1),
        date: getRelativeDate(-1).toLocaleDateString(),
        folderId: "3", // Recursos Humanos
        status: "ready",
        summary:
            "Manual completo del proceso de onboarding para nuevos empleados. Incluye políticas de la empresa, procesos internos, guías de herramientas, estructura organizacional y beneficios. También contiene checklist de primeros días y contactos clave.",
        downloadUrl: "/files/onboarding-manual.pdf",
    },
];
