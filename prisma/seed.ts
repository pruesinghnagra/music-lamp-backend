import { EssayStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Base tags
    const tagNames = ["music", "auckland", "review"];
    await Promise.all(
        tagNames.map((name) =>
            prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
            })
        ),
    );

    const slug = "third-places-auckland";
    const essay = await prisma.essay.upsert({
        where: { slug },
        update: {
            title: "Third Places and Empty Auckland",
            content: "Looking at the death of third places here and abroad...",
            status: EssayStatus.DRAFT,
            publishedAt: null,
            // replace tag set to exactly these names
            tags: {
                // disconnect all current tags (idempotent)
                deleteMany: {},
                // then connect existing tags by name via create on join table
                create: tagNames.map((name) => ({
                    tag: { connect: { name } },
                })),
            },
        },
        create: {
            title: "Third Places and Empty Auckland",
            slug,
            content: "Looking at the death of third places here and abroad...",
            status: EssayStatus.DRAFT,
            tags: {
                create: tagNames.map((name) => ({
                    tag: { connect: { name } },
                })),
            },
            images: {
                create: [
                    {
                        url: "https://example.com/gallery/auckland-venue-1.jpg",
                        alt: "Crowd at a small venue",
                        credit: "Photo: Jane Doe",
                        order: 0,
                    },
                ],
            },
        },
    });

    console.log("✅ Seeded", { id: essay.id, slug: essay.slug });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
