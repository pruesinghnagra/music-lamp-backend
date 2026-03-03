import type { NextApiRequest, NextApiResponse } from "next";
import bcfetch from "bandcamp-fetch";
import type { Album, SearchResultArtist } from "bandcamp-fetch";
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
        const { name } = req.query;
        if (!name || typeof name !== "string") {
            return res.status(400).json({ error: "Missing name parameter" });
        }

        const searchResults = await bcfetch.search.artistsAndLabels({
            query: name,
        });
        const artist = searchResults.items.find((
            item,
        ): item is SearchResultArtist => item.type === "artist");

        if (!artist?.url) {
            return res.status(404).json({ error: "Artist not found" });
        }

        const bandInfo = await bcfetch.band.getInfo({ bandUrl: artist.url });
        if (bandInfo.type !== "artist") {
            return res.status(400).json({
                error: "Expected artist but got label",
            });
        }

        const discography = await bcfetch.band.getDiscography({
            bandUrl: artist.url,
        });
        const albumReleases = discography.filter((a) =>
            a.type === "album" && a.url
        ).map((a) => a as { url: string; type: "album" });

        const albumDetails = await Promise.all(
            albumReleases.map(async (album) => {
                const info = await bcfetch.album.getInfo({
                    albumUrl: album.url!,
                });
                const trackDurations = info.tracks?.map((t) =>
                    t.duration || 0
                ) || [];
                const streamableTracks = info.tracks?.filter((t) =>
                    !!t.streamUrl
                ).length || 0;
                const tracksWithLyrics = info.tracks?.filter((t) =>
                    !!t.lyrics
                ).length || 0;

                return {
                    ...info,
                    numTracks: info.tracks?.length || 0,
                    totalTrackDuration: trackDurations.reduce(
                        (sum, d) => sum + d,
                        0,
                    ),
                    averageTrackDuration: trackDurations.length > 0
                        ? trackDurations.reduce((sum, d) => sum + d, 0) /
                            trackDurations.length
                        : 0,
                    streamableTracks,
                    tracksWithLyrics,
                };
            }),
        );

        const totalAlbums = albumDetails.length;
        const averageTracksPerAlbum = albumDetails.length > 0
            ? albumDetails.reduce((sum, a) => sum + a.numTracks, 0) /
                albumDetails.length
            : 0;
        const totalTrackCount = albumDetails.reduce(
            (sum, a) => sum + a.numTracks,
            0,
        );
        const totalStreamableTracks = albumDetails.reduce(
            (sum, a) => sum + a.streamableTracks,
            0,
        );
        const totalTracksWithLyrics = albumDetails.reduce(
            (sum, a) => sum + a.tracksWithLyrics,
            0,
        );

        const metricSummary = {
            artist: {
                name: bandInfo.name,
                locationPresent: bandInfo.location ? 1 : 0,
                descriptionPresent: bandInfo.description ? 1 : 0,
                imagePresent: bandInfo.imageUrl ? 1 : 0,
                labelPresent: bandInfo.label ? 1 : 0,
                keywordsPresent: (bandInfo as any).keywords?.length ? 1 : 0,
                publisherPresent: (bandInfo as any).publisher ? 1 : 0,
                featuredTrackPresent: (bandInfo as any).featuredTrack ? 1 : 0,
            },
            discography: {
                totalAlbums,
                albumsWithReleaseDate:
                    albumDetails.filter((a) => !!a.releaseDate).length,
                albumsWithTrackCount:
                    albumDetails.filter((a) => a.numTracks > 0).length,
                albumsWithImage:
                    albumDetails.filter((a) => !!a.imageUrl).length,
                albumsWithDescription:
                    albumDetails.filter((a) => !!a.description).length,
                albumsWithLabel: albumDetails.filter((a) => !!a.label).length,
                averageTracksPerAlbum,
                totalTrackCount,
                totalStreamableTracks,
                totalTracksWithLyrics,
            },
        };

        res.status(200).json(metricSummary);
    } catch (error) {
        console.error(
            "Bandcamp band fetch failed:",
            error,
        );
        res.status(500).json({ error: "Failed to fetch Bandcamp band" });
    }
}
