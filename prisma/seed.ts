import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    await prisma.essay.create({
        data: {
            title: "Third Places and empty Auckland",
            slug: "third-places-auckland",
            content: "Looking at the death of third places here and abroad...",
            tags: ["space", "community", "Aotearoa"],
        },
    });

    console.log("✅ Seeded");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
