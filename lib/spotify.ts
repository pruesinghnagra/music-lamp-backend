import axios from "axios";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getSpotifyToken(): Promise<string> {
    const clientId = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

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

    const { access_token, expires_in } = response.data;

    cachedToken = access_token;
    tokenExpiry = Date.now() + (expires_in - 60) * 1000; // buffer 60s

    return access_token;
}
