import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "GET") {
        try {
            const essays = await prisma.essay.findMany({
                orderBy: { createdAt: "desc" },
            });
            res.status(200).json(essays);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch essays" });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}
