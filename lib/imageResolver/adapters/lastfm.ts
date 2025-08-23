import type { Adapter, ResolveInput, ResolveResult } from "../types";

function parseLastfmRef(
    refId: string,
): { artist: string; album: string } | null {
    if (!refId) return null;

    // "artist::album"
    const sep = refId.indexOf("::");
    if (sep !== -1) {
        const artist = refId.slice(0, sep).trim();
        const album = refId.slice(sep + 2).trim();
        if (artist && album) return { artist, album };
        return null;
    }

    // Last.fm album URL: https://www.last.fm/music/{Artist}/{Album}
    if (/^https?:\/\//i.test(refId)) {
        try {
            const u = new URL(refId);
            const parts = u.pathname.split("/").filter(Boolean); // drop empty segments
            // Expect ["music", "{Artist}", "{Album}", ...]
            if (parts[0]?.toLowerCase() !== "music" || !parts[1] || !parts[2]) {
                return null;
            }
            const rawArtist = decodeURIComponent(parts[1]);
            const rawAlbum = decodeURIComponent(parts[2]);

            // Last.fm often uses '+' in slugs to represent spaces
            const artist = rawArtist.replace(/\+/g, " ").trim();
            const album = rawAlbum.replace(/\+/g, " ").trim();
            if (artist && album) return { artist, album };
            return null;
        } catch {
            return null;
        }
    }

    // Unknown format
    return null;
}

async function fetchJsonWithTimeout(
    url: string,
    timeoutMs = 2500,
): Promise<any | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    } finally {
        clearTimeout(t);
    }
}

const SIZE_ORDER = ["mega", "extralarge", "large", "medium", "small"] as const;

const lastfm: Adapter = async (
    { refId }: ResolveInput,
): Promise<ResolveResult> => {
    try {
        const parsed = parseLastfmRef(refId);
        const apiKey = process.env.LASTFM_API_KEY;
        if (!parsed || !apiKey) return { url: null };

        const { artist, album } = parsed;

        const qs = new URLSearchParams({
            method: "album.getinfo",
            artist,
            album,
            autocorrect: "1",
            api_key: apiKey,
            format: "json",
        });

        const data = await fetchJsonWithTimeout(
            `https://ws.audioscrobbler.com/2.0/?${qs.toString()}`,
        );
        const images = data?.album?.image;
        if (!Array.isArray(images)) return { url: null };

        for (const size of SIZE_ORDER) {
            const hit = images.find((i: any) =>
                i?.size === size && typeof i?.["#text"] === "string" &&
                i["#text"].length > 0
            );
            if (hit) {
                return {
                    url: hit["#text"],
                    credit: "Artwork via Last.fm",
                };
            }
        }

        return { url: null };
    } catch {
        return { url: null };
    }
};

export default lastfm;
