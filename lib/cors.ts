import type { NextApiResponse } from "next";

const allowedOrigins = [
    "http://localhost:5173",
    "https://music-lamp.vercel.app",
];

export function setCorsHeaders(
    res: NextApiResponse,
    origin: string | undefined,
    methods: string[],
) {
    // CORS: only allow known origins
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Vary", "Origin");

    // CORS: tell browser which methods + headers are allowed
    res.setHeader("Access-Control-Allow-Methods", methods.join(","));
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

    // Standard HTTP: advertise supported methods
    res.setHeader("Allow", methods.join(","));
}
