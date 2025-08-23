export type ResolveInput = {
    provider: string; // 'lastfm' | 'spotify' | 'discogs' | 'blob' | ...
    refId: string; // opaque: URL, ID, or "artist::album"
    hints?: Record<string, any>; // optional: { artist, album, ... }
    timeoutMs?: number; // per-adapter timeout
};

export type ResolveResult = {
    url: string | null;
    credit?: string;
    meta?: Record<string, any>;
};

export type Adapter = (input: ResolveInput) => Promise<ResolveResult>;
