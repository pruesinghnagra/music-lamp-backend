import { prisma } from "@lib/prisma";
import { del, put } from "@vercel/blob";

export async function POST(request: Request) {
    const form = await request.formData();

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: "Missing file" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const essayIdValue = form.get("essayId");
    const essayId =
        typeof essayIdValue === "string" && essayIdValue.trim().length > 0
            ? essayIdValue
            : undefined;

    const blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
    });

    const media = await prisma.media.create({
        data: {
            essayId,
            url: blob.url,
            provider: "vercel-blob",
            sourceId: blob.pathname,
        },
    });

    return Response.json(media);
}

export async function GET() {
    try {
        const images = await prisma.media.findMany({
            orderBy: { order: "asc" },
        });
        return new Response(JSON.stringify(images), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: "failed to fetch images" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return new Response(
                JSON.stringify({ error: "Missing image ID" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const image = await prisma.media.findUnique({ where: { id } });
        if (!image) {
            return new Response(
                JSON.stringify({ error: "Image not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        if (image.sourceId) {
            try {
                await del(image.sourceId);
            } catch (err) {
                console.warn("Failed to delete from Vercel Blob:", err);
            }
        }

        await prisma.media.delete({ where: { id } });

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("DELETE /api/image-uploader error:", err);
        return new Response(
            JSON.stringify({ error: "Failed to delete image" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
