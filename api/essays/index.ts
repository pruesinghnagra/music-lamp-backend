import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === "GET") {
            const essays = await prisma.essay.findMany({
                orderBy: { createdAt: "desc" },
            });
            return res.status(200).json(essays);
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}
