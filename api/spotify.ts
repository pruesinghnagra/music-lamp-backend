import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const allowedOrigin = process.env.NODE_ENV === "production"
        ? "https://music-lamp.vercel.app"
        : "http://localhost:5173";

    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const clientId = process.env.SPOTIFY_CLIENT_ID!;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
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
        console.error(error);
        res.status(500).json({ error: "Failed to get Spotify token" });
    }
}
