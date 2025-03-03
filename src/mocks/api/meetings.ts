import { pastMeetings, futureMeetings } from "../data/meetings";
import { ApiResponse, PaginatedResponse } from "../types";
import { Meeting } from "../../context/MeetingsContext";
import { meetingsDetails } from "../data/meetings";

// Simular delays de red
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const meetingsApi = {
    // Obtener todas las reuniones (paginadas)
    async getMeetings(
        page = 1,
        pageSize = 10
    ): Promise<PaginatedResponse<Meeting>> {
        await delay(500);
        const allMeetings = [...pastMeetings, ...futureMeetings];
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        return {
            data: allMeetings.slice(start, end),
            total: allMeetings.length,
            page,
            pageSize,
        };
    },

    // Obtener una reunión específica con todos sus detalles
    async getMeeting(id: string): Promise<ApiResponse<Meeting>> {
        await delay(300);
        const meeting = meetingsDetails[id];

        if (!meeting) {
            throw new Error("Meeting not found");
        }

        return {
            data: meeting,
            status: 200,
        };
    },

    // Obtener reuniones futuras
    async getFutureMeetings(): Promise<ApiResponse<Meeting[]>> {
        await delay(300);
        return {
            data: futureMeetings,
            status: 200,
        };
    },

    // Obtener reuniones sin clasificar
    async getUnclassifiedMeetings(): Promise<ApiResponse<Meeting[]>> {
        await delay(300);
        const unclassified = pastMeetings.filter(
            (meeting) => !meeting.folderId
        );

        return {
            data: unclassified,
            status: 200,
        };
    },
};
