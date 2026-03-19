import type { NextApiRequest, NextApiResponse } from "next";
import bcfetch from "bandcamp-fetch";
import { setCorsHeaders } from "@lib/cors";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    console.log("Incoming Origin:", req.headers.origin);
    setCorsHeaders(res, req.headers.origin, ["GET", "OPTIONS"]);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { url } = req.query;

        const albumUrl = Array.isArray(url) ? url[0] : url;

        if (!albumUrl || typeof albumUrl !== "string") {
            return res.status(400).json({ error: "Missing url parameter" });
        }

        const albumInfo = await bcfetch.album.getInfo({
            albumUrl,
        });

        const trackDurations = albumInfo.tracks?.map((t) => t.duration || 0) ||
            [];

        const response = {
            album: {
                title: albumInfo.name,
                artist: albumInfo.artist,
                imageUrl: albumInfo.imageUrl,
                releaseDate: albumInfo.releaseDate || null,
                description: albumInfo.description || null,
                tags: albumInfo.keywords,
                releases: albumInfo.releases,
            },
            metrics: {
                numTracks: albumInfo.tracks?.length || 0,
                totalDuration: trackDurations.reduce((sum, d) => sum + d, 0),
                averageTrackDuration: trackDurations.length
                    ? trackDurations.reduce((sum, d) => sum + d, 0) /
                        trackDurations.length
                    : 0,
                streamableTracks: albumInfo.tracks?.filter((t) =>
                    !!t.streamUrl
                ).length || 0,
                tracksWithLyrics: albumInfo.tracks?.filter((t) =>
                    !!t.lyrics
                ).length || 0,
            },
        };
        res.status(200).json(response);
    } catch (error) {
        console.error(
            "Bandcamp album fetch failed:",
            error,
        );
        res.status(500).json({ error: "Failed to fetch Bandcamp album" });
    }
}
