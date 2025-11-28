import type { NextApiRequest, NextApiResponse } from "next";

import { isValidStatus } from "@lib/status";
import type { EssayStatus } from "@lib/status";
import { prisma } from "@lib/prisma";
import { requireApiKey } from "@lib/requireApiKey";
import { flattenEssay, nextPublishedAt } from "@lib/essay";
import { setCorsHeaders } from "@lib/cors";
import { resolveCover } from "@lib/imageResolver";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    setCorsHeaders(res, req.headers.origin, [
        "GET",
        "POST",
        "OPTIONS",
    ]);

    const { method, headers, query, body } = req;

    if (method === "OPTIONS") {
        res.setHeader("Allow", "GET,POST,OPTIONS");
        return res.status(204).end();
    }

    if (method === "GET") {
        try {
            const statusQuery = query.status as string | undefined;
            const where = statusQuery && isValidStatus(statusQuery)
                ? { status: statusQuery }
                : {};
            const essays = await prisma.essay.findMany({
                where,
                orderBy: { updatedAt: "desc" },
                include: {
                    tags: { include: { tag: true } },
                    images: true,
                    coverImage: true,
                },
            });
            return res.status(200).json(essays.map(flattenEssay));
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

            const parsedStatus: EssayStatus = isValidStatus(status)
                ? status
                : "DRAFT";

            const tagNames = Array.isArray(tags) ? (tags as string[]) : [];

            const existing = await prisma.essay.findUnique({
                where: { slug },
                select: { status: true, publishedAt: true },
            });

            let resolvedCoverImage = coverImage ?? null;
            let resolvedImageCredit = imageCredit ?? null;

            if (!resolvedCoverImage && albumRefProvider && albumRefId) {
                try {
                    const { url, credit } = await resolveCover({
                        provider: String(albumRefProvider),
                        refId: String(albumRefId),
                    });
                    if (url) {
                        resolvedCoverImage = url;
                        if (!resolvedImageCredit && credit) {
                            resolvedImageCredit = credit;
                        }
                    }
                } catch (e) {
                    console.warn("cover resolve (POST) failed:", e);
                }
            }

            let coverImageDataForUpdate: { coverImageId?: string | null } = {};
            let coverImageDataForCreate: { coverImageId?: string | null } = {};

            if (resolvedCoverImage) {
                const media = await prisma.media.create({
                    data: {
                        url: resolvedCoverImage,
                        credit: resolvedImageCredit ?? null,
                        provider: albumRefProvider ?? undefined,
                        sourceId: albumRefId ?? undefined,
                    },
                });

                coverImageDataForUpdate.coverImageId = media.id;
                coverImageDataForCreate.coverImageId = media.id;
            }

            const essay = await prisma.essay.upsert({
                where: { slug },
                update: {
                    title,
                    content,
                    status: parsedStatus,
                    imageCredit: resolvedImageCredit,
                    albumRefProvider: albumRefProvider ?? null,
                    albumRefId: albumRefId ?? null,
                    publishedAt: nextPublishedAt(status, existing),
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
                    ...coverImageDataForUpdate,
                },
                create: {
                    title,
                    slug,
                    content,
                    status: parsedStatus,
                    imageCredit: resolvedImageCredit,
                    albumRefProvider: albumRefProvider ?? null,
                    albumRefId: albumRefId ?? null,
                    publishedAt: parsedStatus === "PUBLISHED"
                        ? new Date()
                        : null,
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
                    ...coverImageDataForUpdate,
                },
                include: {
                    tags: { include: { tag: true } },
                    images: true,
                    coverImage: true,
                },
            });

            const flatEssay = flattenEssay(essay);
            return res.status(201).json(flatEssay);
        } catch (err) {
            console.error("Error creating/upserting essays:", err);
            return res.status(500).json({ error: "Server error" });
        }
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
}
