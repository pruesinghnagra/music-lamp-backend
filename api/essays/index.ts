import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const allowedOrigins = [
        "http://localhost:5173",
        "https://music-lamp.vercel.app",
    ];
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const essays = await prisma.essay.findMany({
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json(essays);
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}
