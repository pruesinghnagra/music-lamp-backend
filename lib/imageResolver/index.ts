import { Adapter, ResolveInput, ResolveResult } from "./types";
import lastfm from "./adapters/lastfm";

const ADAPTERS: Record<string, Adapter> = {
    lastfm,
    // spotify,
    // discogs,
    // blob,
};

export async function resolveCover(
    input: ResolveInput,
): Promise<ResolveResult> {
    const adapter = ADAPTERS[input.provider.toLowerCase()];
    if (!adapter) return { url: null };

    try {
        return await adapter({ timeoutMs: 2500, ...input });
    } catch {
        return { url: null };
    }
}
