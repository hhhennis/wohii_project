const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

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
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("1234", 10);
    const user = await prisma.user.create({
        data: {
        email: "admin@example.com",
        password: hashedPassword,
        name: "Admin User",
        },
    });

    console.log("Created user:", user.email);


for (const question of seedQuestions) {
    await prisma.question.create({
        data: {
            id: question.id,
            question: question.question,
            answer: question.answer,
            userId: user.id,
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
