import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { setCorsHeaders } from "@lib/cors";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    setCorsHeaders(res, req.headers.origin, ["GET", "OPTIONS"]);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const clientId = process.env.SPOTIFY_CLIENT_ID!;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

        if (!clientId || !clientSecret) {
            console.error("Missing Spotify credentials:", {
                clientId,
                clientSecret,
                NODE_ENV: process.env.NODE_ENV,
            });
            return res.status(500).json({
                error: "Missing Spotify credentials",
            });
        }

        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString(
            "base64",
        );

        const response = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({ grant_type: "client_credentials" }),
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        );

        res.status(200).json(response.data);
    } catch (error) {
        console.error(
            "Spotify token fetch failed:",
            error,
        );
        res.status(500).json({ error: "Failed to get Spotify token" });
    }
}
