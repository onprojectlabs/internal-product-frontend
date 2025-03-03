import { Clip } from "../types/clips";

const STORAGE_KEY = "clips";

export const clipsService = {
    getClips(): Clip[] {
        const clips = localStorage.getItem(STORAGE_KEY);
        return clips ? JSON.parse(clips) : [];
    },

    getClip(id: string): Clip | null {
        const clips = this.getClips();
        return clips.find((clip) => clip.id === id) || null;
    },

    addClip(clipData: Omit<Clip, "id">): Clip {
        const clips = this.getClips();
        const newClip = {
            id: crypto.randomUUID(),
            ...clipData,
        };

        clips.push(newClip);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));

        return newClip;
    },

    saveClip(clip: Clip): Clip[] {
        const clips = this.getClips();
        const exists = clips.find((c) => c.id === clip.id);

        if (!exists) {
            clips.push(clip);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
        }

        return clips;
    },

    deleteClip(id: string): Clip[] {
        const clips = this.getClips().filter((c) => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
        return clips;
    },

    updateClip(id: string, updates: Partial<Clip>): Clip[] {
        const clips = this.getClips().map((clip) =>
            clip.id === id ? { ...clip, ...updates } : clip
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
        return clips;
    },
};
