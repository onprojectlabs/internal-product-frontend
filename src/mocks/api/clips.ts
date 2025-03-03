import { clips } from "../data/clips";
import { ApiResponse } from "../types";
import { Clip } from "../types";
import { delay } from "../data/utils";

export const clipsApi = {
    async getClips(): Promise<ApiResponse<Clip[]>> {
        await delay(300);
        return {
            data: clips,
            status: 200,
        };
    },

    async getClip(id: string): Promise<ApiResponse<Clip>> {
        await delay(300);
        const clip = clips.find((c) => c.id === id);

        if (!clip) {
            throw new Error("Clip not found");
        }

        return {
            data: clip,
            status: 200,
        };
    },
};
