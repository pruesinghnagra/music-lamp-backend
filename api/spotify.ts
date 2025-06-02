import { Request, Response } from "express";
import axios from "axios";

export default async (req: Request, res: Response) => {
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

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to get Spotify token" });
    }
};
