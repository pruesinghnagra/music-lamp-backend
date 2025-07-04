import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { method, url, headers } = req;

    console.log("Request URL:", url);
    const slug = url?.split("/")[1];
    console.log("Matched slug:", slug);

    // CORS
    const allowedOrigins = [
        "http://localhost:5173",
        "https://music-lamp.vercel.app",
    ];
    const origin = headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (method === "OPTIONS") {
        return res.status(200).end();
    }

    if (method === "GET" && slug) {
        try {
            const essay = await prisma.essay.findUnique({ where: { slug } });

            if (!essay) {
                console.log("No essay found for slug:", slug);
                return res.status(404).json({ error: "Essay not found" });
            }

            return res.status(200).json(essay);
        } catch (err) {
            console.error("Error fetching single essay:", err);
            return res.status(500).json({ error: "Server error" });
        }
    }

    if (method === "GET") {
        try {
            const essays = await prisma.essay.findMany({
                orderBy: { createdAt: "desc" },
            });
            return res.status(200).json(essays);
        } catch (err) {
            console.error("Error fetching essays:", err);
            return res.status(500).json({ error: "Server error" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
