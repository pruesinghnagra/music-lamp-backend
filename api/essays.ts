import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const allowedOrigins = [
    "http://localhost:5173",
    "https://music-lamp.vercel.app",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const { method, url } = req;
    const match = url?.match(/\/api\/essays\/([^\/\?]+)/);
    const slug = match?.[1];

    if (method === "GET" && slug) {
        try {
            const essay = await prisma.essay.findUnique({
                where: { slug },
            });

            if (!essay) {
                return res.status(404).json({ error: "Essay not found" });
            }

            return res.status(200).json(essay);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
