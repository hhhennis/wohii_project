const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const seedQuestions = [
    {
        id: 1,
        question: "What equals 1+1?",
        answer: "2",
        keywords: ["math", "addition"]
    },
    {
        id: 2,
        question: "What equals 5-2?",
        answer: "3",
        keywords: ["math", "subtraction"]
    }
];

async function main() {
    await prisma.question.deleteMany();
    await prisma.keyword.deleteMany();

for (const question of seedQuestions) {
    await prisma.question.create({
        data: {
            id: question.id,
            question: question.question,
            answer: question.answer,
            keywords: {
            connectOrCreate: question.keywords.map((kw) => ({
                where: { name: kw },
                create: { name: kw },
            })),
            },
        },
    });
}

    console.log("Seed data inserted successfully");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
