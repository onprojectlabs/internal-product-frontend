import { folders } from "../data/folders";
import { ApiResponse } from "../types";
import { Folder } from "../../context/MeetingsContext";
import { delay } from "../data/utils";

export const foldersApi = {
    async getFolders(): Promise<ApiResponse<Folder[]>> {
        await delay(300);
        return {
            data: folders,
            status: 200,
        };
    },

    async getFolder(id: string): Promise<ApiResponse<Folder>> {
        await delay(300);
        const folder = folders.find((f) => f.id === id);

        if (!folder) {
            throw new Error("Folder not found");
        }

        return {
            data: folder,
            status: 200,
        };
    },
};
