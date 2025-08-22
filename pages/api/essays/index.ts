import { EssayStatus, PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const API_KEY = process.env.API_KEY || "";

function requireApiKey(req: NextApiRequest, res: NextApiResponse): boolean {
    const key = req.headers["x-api-key"];
    if (!API_KEY || key !== API_KEY) {
        res.status(401).json({ error: "Unauthorized" });
        return false;
    }
    return true;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ??
    new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const allowedOrigins = [
    "http://localhost:5173",
    "https://music-lamp.vercel.app",
];

function flattenTagNames(essays: any[]) {
    return essays.map((essay) => ({
        ...essay,
        tags: (essay.tags ?? []).map((essayTag: any) => essayTag.tag.name),
    }));
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const { method, headers, query, body } = req;

    // CORS
    const origin = headers.origin || "";
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

    if (method === "OPTIONS") {
        res.setHeader("Allow", "GET,POST,OPTIONS");
        return res.status(204).end();
    }

    if (method === "GET") {
        try {
            const statusQuery = query.status as string | undefined;
            const where = statusQuery &&
                    (Object.values(EssayStatus) as string[]).includes(
                        statusQuery,
                    )
                ? { status: statusQuery as EssayStatus }
                : {};
            const essays = await prisma.essay.findMany({
                where,
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                    status: true,
                    updatedAt: true,
                    tags: { include: { tag: true } }, // The join
                },
            });
            return res.status(200).json(flattenTagNames(essays));
        } catch (err) {
            console.error("Error fetching essays:", err);
            return res.status(500).json({ error: "Server error" });
        }
    }

    if (method === "POST") {
        if (!requireApiKey(req, res)) return;
        try {
            const {
                title,
                slug,
                content,
                tags,
                status,
                coverImage,
                imageCredit,
                albumRefProvider,
                albumRefId,
            } = body ?? {};
            if (!title || !slug || typeof content != "string") {
                return res.status(400).json({
                    error: "title, slug, content required",
                });
            }

            const parsedStatus = typeof status === "string" &&
                    (Object.values(EssayStatus) as string[]).includes(status)
                ? (status as EssayStatus)
                : EssayStatus.DRAFT;

            const tagNames = Array.isArray(tags) ? (tags as string[]) : [];

            const essay = await prisma.essay.upsert({
                where: { slug },
                update: {
                    title,
                    content,
                    status: parsedStatus,
                    coverImage: coverImage ?? null,
                    imageCredit: imageCredit ?? null,
                    albumRefProvider: albumRefProvider ?? null,
                    albumRefId: albumRefId ?? null,
                    tags: {
                        deleteMany: {},
                        create: tagNames.map((name) => ({
                            tag: {
                                connectOrCreate: {
                                    where: { name },
                                    create: { name },
                                },
                            },
                        })),
                    },
                },
                create: {
                    title,
                    slug,
                    content,
                    status: parsedStatus,
                    coverImage: coverImage ?? null,
                    imageCredit: imageCredit ?? null,
                    albumRefProvider: albumRefProvider ?? null,
                    albumRefId: albumRefId ?? null,
                    tags: {
                        create: tagNames.map((name) => ({
                            tag: {
                                connectOrCreate: {
                                    where: { name },
                                    create: { name },
                                },
                            },
                        })),
                    },
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    content: true,
                    coverImage: true,
                    imageCredit: true,
                    albumRefProvider: true,
                    albumRefId: true,
                    status: true,
                    updatedAt: true,
                    tags: { include: { tag: true } },
                },
            });

            const flatEssay = flattenTagNames([essay])[0];
            return res.status(201).json(flatEssay);
        } catch (err) {
            console.error("Error creating/upserting essays:", err);
            return res.status(500).json({ error: "Server error" });
        }
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
}
