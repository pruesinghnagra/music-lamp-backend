import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const essays = await prisma.essay.findMany();
    res.status(200).json(essays.map((e) => e.slug));
}
