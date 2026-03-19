import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { setCorsHeaders } from "@lib/cors";
import { getSpotifyToken } from "@lib/spotify";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    setCorsHeaders(res, req.headers.origin, ["GET", "OPTIONS"]);
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { albumId } = req.query;
        if (!albumId || typeof albumId !== "string") {
            return res.status(400).json({ error: "Missing albumId parameter" });
        }

        const token = await getSpotifyToken();

        // Fetch tracks for album
        const tracksResponse = await axios.get(
            `https://api.spotify.com/v1/albums/${albumId}/tracks`,
            {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 50 },
            },
        );

        const tracks = tracksResponse.data.items.map((t: any) => ({
            name: t.name,
            durationMs: t.duration_ms,
            popularity: t.popularity ?? null,
            explicit: t.explicit,
            previewUrl: t.preview_url,
        }));

        // Album info
        const albumResponse = await axios.get(
            `https://api.spotify.com/v1/albums/${albumId}`,
            { headers: { Authorization: `Bearer ${token}` } },
        );

        const albumData = albumResponse.data;
        const numTracks = tracks.length;

        const totalDuration = tracks.reduce(
            (sum: any, t: { durationMs: any }) => sum + t.durationMs,
            0,
        );

        const averageTrackDuration = numTracks ? totalDuration / numTracks : 0;

        const averagePopularity = numTracks
            ? tracks.reduce(
                (sum: any, t: { popularity: any }) => sum + (t.popularity ?? 0),
                0,
            ) /
                numTracks
            : 0;

        const metricSummary = {
            album: {
                id: albumData.id,
                name: albumData.name,
                image: albumData.images[0]?.url || null,
                releaseDate: albumData.release_date,
                totalTracks: albumData.total_tracks,
            },
            tracks,
            metrics: {
                numTracks,
                totalDuration,
                averageTrackDuration,
                averagePopularity,
            },
        };

        res.status(200).json(metricSummary);
    } catch (error: any) {
        console.error(
            "Spotify track fetch failed:",
            error.response?.data || error,
        );
        res.status(500).json({ error: "Failed to fetch album tracks" });
    }
}
