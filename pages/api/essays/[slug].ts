import { EssayStatus, PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const API_KEY = process.env.API_KEY || "";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ??
    new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const allowedOrigins = [
    "http://localhost:5173",
    "https://music-lamp.vercel.app",
];

function requireApiKey(req: NextApiRequest, res: NextApiResponse): boolean {
    const key = req.headers["x-api-key"];
    if (!API_KEY || key !== API_KEY) {
        res.status(401).json({ error: "Unauthorized" });
        return false;
    }
    return true;
}

function flattenTags(essay: any) {
    if (!essay) return essay;
    return {
        ...essay,
        tags: (essay.tags ?? []).map((essayTag: any) => essayTag.tag.name),
    };
}

function nextPublishedAt(
    incomingStatus: string | undefined,
    prev: { status: string; publishedAt: Date | null } | null,
) {
    if (incomingStatus === "PUBLISHED") {
        // set once and don't overwrite
        return prev?.publishedAt ?? new Date();
    }

    if (incomingStatus && incomingStatus !== "PUBLISHED") {
        return null;
    }

    return undefined;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const { method, query, headers, body } = req;
    const slug = query.slug as string;
    if (!slug) return res.status(400).json({ error: "slug required" });

    // CORS
    const origin = headers.origin || "";
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

    if (method === "OPTIONS") {
        res.setHeader("Allow", "GET,PUT,DELETE,OPTIONS");
        return res.status(204).end();
    }

    if (method === "GET") {
        try {
            const essay = await prisma.essay.findUnique({
                where: { slug },
                include: {
                    tags: { include: { tag: true } },
                    images: { orderBy: { order: "asc" } },
                },
            });

            if (!essay) {
                return res.status(404).json({ error: "Essay not found" });
            }
            return res.status(200).json(flattenTags(essay));
        } catch (err) {
            console.error("GET /essays/[slug] error", err);
            return res.status(500).json({ error: "Server error" });
        }
    }

    if (method === "PUT") {
        if (!requireApiKey(req, res)) return;
        try {
            const {
                title,
                content,
                status,
                coverImage,
                imageCredit,
                albumRefProvider,
                albumRefId,
                tags,
                // images: [],
            } = body ?? {};

            const existing = await prisma.essay.findUnique({
                where: { slug },
                select: { status: true, publishedAt: true },
            });

            const data: any = {};
            if (title !== undefined) data.title = title;
            if (content !== undefined) data.content = content;
            if (coverImage !== undefined) data.coverImage = coverImage ?? null;
            if (imageCredit !== undefined) {
                data.imageCredit = imageCredit ?? null;
            }
            if (albumRefProvider !== undefined) {
                data.albumRefProvider = albumRefProvider ?? null;
            }
            if (albumRefId !== undefined) data.albumRefId = albumRefId ?? null;

            if (
                typeof status === "string" &&
                (Object.values(EssayStatus) as string[]).includes(status)
            ) {
                data.status = status as EssayStatus;
            }

            if (tags !== undefined) {
                const tagNames = Array.isArray(tags) ? (tags as string[]) : [];
                data.tags = {
                    deleteMany: {},
                    create: tagNames.map((name) => ({
                        tag: {
                            connectOrCreate: {
                                where: { name },
                                create: { name },
                            },
                        },
                    })),
                };
            }

            const incomingStatus = typeof status === "string"
                ? status
                : undefined;
            const maybePublishedAt = nextPublishedAt(incomingStatus, existing);
            if (maybePublishedAt !== undefined) {
                data.publishedAt = maybePublishedAt;
            }

            const updated = await prisma.essay.update({
                where: { slug },
                data,
                include: {
                    tags: { include: { tag: true } },
                    images: { orderBy: { order: "asc" } },
                },
            });

            return res.status(200).json(flattenTags(updated));
        } catch (err: any) {
            console.error("PUT /essays/[slug] error:", err);
            if (err.code === "P2025") {
                return res.status(404).json({ error: "Not found" });
            }
            return res.status(500).json({ error: "Server error" });
        }
    }

    if (method === "DELETE") {
        if (!requireApiKey(req, res)) return;
        try {
            await prisma.essay.delete({ where: { slug } });
            return res.status(204).end();
        } catch (err: any) {
            console.error("DELETE /essays/[slug] error:", err);
            if (err.code === "P2025") {
                return res.status(404).json({ error: "Not found" });
            }
            return res.status(500).json({ error: "Server error" });
        }
    }

    res.setHeader("Allow", "GET,PUT,DELETE,OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "2mb",
        },
    },
};
