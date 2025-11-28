import { Prisma } from "@prisma/client";

export function nextPublishedAt(
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

export type EssayWithTags = Prisma.EssayGetPayload<{
    include: {
        tags: { include: { tag: true } };
        images: true;
        coverImage: true;
    };
}>;

export type EssayFlattened = Omit<EssayWithTags, "tags" | "coverImage"> & {
    tags: string[];
    coverImage: string | null;
};

export function flattenEssay(essay: EssayWithTags): EssayFlattened {
    const { tags, coverImage, ...rest } = essay as any;
    return {
        ...rest,
        tags: (tags ?? []).map((et: any) => et.tag.name),
        coverImage: coverImage ? coverImage.url : null,
    };
}
