import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const { method, headers } = req;

    const allowedOrigins = [
        "http://localhost:5173",
        "https://music-lamp.vercel.app",
    ];
    const origin = headers.origin || "";
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (method === "OPTIONS") {
        return res.status(200).end();
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
