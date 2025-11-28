import type { NextApiRequest, NextApiResponse } from "next";

import { isValidStatus } from "@lib/status";
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
        "PUT",
        "DELETE",
        "OPTIONS",
    ]);

    const { method, query, headers, body } = req;
    const slug = query.slug as string;
    if (!slug) return res.status(400).json({ error: "slug required" });

    if (method === "OPTIONS") {
        return res.status(204).end();
    }

    if (method === "GET") {
        try {
            const essay = await prisma.essay.findUnique({
                where: { slug },
                include: {
                    tags: { include: { tag: true } },
                    images: { orderBy: { order: "asc" } },
                    coverImage: true,
                },
            });

            if (!essay) {
                return res.status(404).json({ error: "Essay not found" });
            }

            if (
                !essay.coverImage && essay.albumRefProvider && essay.albumRefId
            ) {
                const { url, credit } = await resolveCover({
                    provider: essay.albumRefProvider,
                    refId: essay.albumRefId,
                });
                if (url) {
                    const media = await prisma.media.create({
                        data: {
                            url,
                            credit: credit ?? null,
                            provider: essay.albumRefProvider ?? undefined,
                            sourceId: essay.albumRefId ?? undefined,
                        },
                    });

                    await prisma.essay.update({
                        where: { slug },
                        data: {
                            coverImageId: media.id,
                            imageCredit: essay.imageCredit ?? credit ?? null,
                        },
                    });

                    (essay as any).coverImage = media;
                    if (!essay.imageCredit && credit) {
                        essay.imageCredit = credit;
                    }
                }
            }

            return res.status(200).json(flattenEssay(essay));
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

            if (coverImage !== undefined) {
                if (coverImage === null) {
                    data.coverImageId = null;
                } else if (
                    typeof coverImage === "string" &&
                    coverImage.trim().length > 0
                ) {
                    const media = await prisma.media.create({
                        data: {
                            url: coverImage,
                            credit: imageCredit ?? null,
                            provider: albumRefProvider ?? undefined,
                            sourceId: albumRefId ?? undefined,
                        },
                    });
                    data.coverImageId = media.id;
                }
            }

            if (imageCredit !== undefined) {
                data.imageCredit = imageCredit ?? null;
            }
            if (albumRefProvider !== undefined) {
                data.albumRefProvider = albumRefProvider ?? null;
            }
            if (albumRefId !== undefined) data.albumRefId = albumRefId ?? null;

            if (isValidStatus(status)) {
                data.status = status;
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
                    coverImage: true,
                },
            });

            return res.status(200).json(flattenEssay(updated));
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
