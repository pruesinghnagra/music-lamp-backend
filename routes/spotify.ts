import { FastifyInstance } from "fastify";
import axios from "axios";

export default async function spotifyRoutes(fastify: FastifyInstance) {
    fastify.get("/spotify-token", async () => {
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

        return response.data;
    });
}
