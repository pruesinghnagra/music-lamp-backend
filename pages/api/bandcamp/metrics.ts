import type { NextApiRequest, NextApiResponse } from "next";
import bcfetch from "bandcamp-fetch";
import type { SearchResultArtist } from "bandcamp-fetch";
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
        const totalAlbums = discography
            .filter((a) => a.type === "album" && a.url)
            .map((a) => ({
                name: a.name,
                url: a.url,
            }));

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
