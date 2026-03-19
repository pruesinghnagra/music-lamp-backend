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
        const { name } = req.query;
        if (!name || typeof name !== "string") {
            return res.status(400).json({ error: "Missing name parameter" });
        }

        const token = await getSpotifyToken();

        // Search artist by name
        const searchResponse = await axios.get(
            "https://api.spotify.com/v1/search",
            {
                headers: { Authorization: `Bearer ${token}` },
                params: { q: name, type: "artist", limit: 1 },
            },
        );

        const artist = searchResponse.data.artists.items[0];
        if (!artist) {
            return res.status(404).json({
                error: "Artist not found on Spotify",
            });
        }

        const artistId = artist.id;

        // Top tracks
        const topTracksResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=NZ`,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        const tracks = topTracksResponse.data.tracks;
        const topTrackNames = tracks.map((t: any) => t.name).join(", ");

        const totalTracks = tracks.length;
        const averagePopularity = totalTracks
            ? tracks.reduce((sum: number, t: any) => sum + t.popularity, 0) /
                totalTracks
            : 0;
        const averageDuration = totalTracks
            ? tracks.reduce((sum: number, t: any) => sum + t.duration_ms, 0) /
                totalTracks
            : 0;

        // Albums
        const albumsResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}/albums`,
            {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    include_groups: "album,single",
                    market: "NZ",
                    limit: 50,
                },
            },
        );

        const albumsData = albumsResponse.data.items
            .sort((a: any, b: any) =>
                new Date(b.release_date).getTime() -
                new Date(a.release_date).getTime()
            );

        const albums = albumsData.map((a: any) => ({
            id: a.id,
            name: a.name,
            albumType: a.album_type,
            releaseDate: a.release_date,
            totalTracks: a.total_tracks,
            popularity: a.popularity,
            image: a.images[0]?.url || null,
            genres: artist.genres || [],
            externalUrl: a.external_urls.spotify,
        }));

        const latestReleaseDate = albumsData[0]?.release_date || null;

        const metricSummary = {
            artist: {
                name: artist.name,
                followers: artist.followers.total,
                popularity: artist.popularity,
                uri: artist.uri,
            },
            tracks: {
                averagePopularity,
                averageDuration,
                topTrackNames,
                totalTracks,
            },
            albums,
            latestReleaseDate,
        };
        res.status(200).json(metricSummary);
    } catch (error: any) {
        console.error(
            "Spotify metrics fetch failed:",
            error.response?.data || error,
        );
        console.error("STATUS:", error.response?.status);
        console.error("DATA:", error.response?.data);
        res.status(500).json({ error: "Failed to fetch artist info" });
    }
}
