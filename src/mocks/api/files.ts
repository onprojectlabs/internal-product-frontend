import { files } from "../data/files";
import { ApiResponse } from "../types";
import { File } from "../types";
import { delay } from "../data/utils";

export const filesApi = {
    async getFiles(): Promise<ApiResponse<File[]>> {
        await delay(300);
        return {
            data: files,
            status: 200,
        };
    },

    async getFile(id: string): Promise<ApiResponse<File>> {
        await delay(300);
        const file = files.find((f) => f.id === id);

        if (!file) {
            throw new Error("File not found");
        }

        return {
            data: file,
            status: 200,
        };
    },
};
