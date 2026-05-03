const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");

// Apply authentication to ALL routes in this router
router.use(authenticate);


function formatQuestion(question) {
    return {
        ...question,
        keywords: question.keywords.map((k) => k.name),
        userName: question.user?.name || null,
        likeCount: question._count?.likes ?? 0,
        liked: question.likes ? question.likes.length > 0 : false,
        user: undefined,
        likes: undefined,
        _count: undefined
    };
}


// GET /api/questions, /api/questins?keyword=http&page=1&limit=5
// List all questions
router.get("/", async (req, res) => {
    const {keyword} = req.query;

    const where = keyword
    ? { keywords: { some: { name: keyword } } }
    : {};

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

    const [filteredQuestions, total] = await Promise.all([
        prisma.question.findMany({
            where,
            include: { 
                keywords: true, 
                user: true,
                likes: { where: { userId: req.user.userId }, take: 1 },
                _count: { select: { likes: true } }
            },
            orderBy: { id: "asc" },
            skip,
            take: limit,
        }),

    prisma.question.count({ where })]);
    
    res.json({
    data: filteredQuestions.map(formatQuestion),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

    res.json(filteredQuestions.map(formatQuestion));

});

//GET /api/questions/:questionID
router.get("/:questionId", async (req, res) => {
    const questionId = Number(req.params.questionId);

    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { 
            keywords: true, 
            user: true,
            likes: { where: { userId: req.user.userId }, take: 1 },
            _count: { select: { likes: true } }, 
        },
        orderBy: { id: "asc" }
    });

    if (!question) {
    return res.status(404).json({ 
		message: "Question not found" 
    });
}

    res.json(formatQuestion(question));
});

//POST /api/questions
router.post("/", async (req, res) => {
    const {question, answer, keywords} = req.body;
    if(!question || !answer) {
        return res.status(400).json({msg: "Question and answer are required"})
    }

    const keywordsArray = Array.isArray(keywords) ? keywords : [];

    const newQuestion = await prisma.question.create({
        data: {
            question, answer,
            userId: req.user.userId,
            keywords: {
                connectOrCreate: keywordsArray.map((kw) => ({
                where: { name: kw }, create: { name: kw },
                })), },
        },
        include: { keywords: true}
    });

    res.status(201).json(formatQuestion(newQuestion));
});

//PUT /api/questitons/:questionId
router.put("/:questionId", isOwner, async (req,res) => {
    const questionId = Number(req.params.questionId);
    const {question, answer, keywords} = req.body;
    
    const existingQuestion = await prisma.question.findUnique({ where: { id: questionId } });
    if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
    }

    if (!question || !answer) {
        return res.status(400).json({ msg: "quesion and answer are mandatory" });
    }

    const keywordsArray = Array.isArray(keywords) ? keywords : [];
    const updatedQuestion = await prisma.question.update({
        where: { id: questionId },
        data: {
        question, answer,
        keywords: {
            set: [],
            connectOrCreate: keywordsArray.map((kw) => ({
            where: { name: kw },
            create: { name: kw },
            })),
        },
        },
        include: { keywords: true}
    });
    res.json(formatQuestion(updatedQuestion));
    
});

//DELETE /api/questions/:quesionId
router.delete("/:questionId", isOwner, async (req, res)=> {
    const questionId = Number(req.params.questionId);
    
    const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { keywords: true, user: true },
    });

    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }

    await prisma.question.delete({ where: { id: questionId } });

    res.json({
        message: "Question deleted successfully",
        question: formatQuestion(question),
    });


});

//POST /api/questions/:questionId/like
router.post("/:questionId/like", async (req, res) => {
    const questionId = Number(req.params.questionId);

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }

    //new entry, max 1 like per question
    //upsert makes this idempotent :  clicking like twice doesn’t error
    const like = await prisma.like.upsert({
        where: { userId_questionId: { userId: req.user.userId, questionId } },
        update: {},
        create: { userId: req.user.userId, questionId },
    });

    const likeCount = await prisma.like.count({ where: { questionId } });

    res.status(201).json({
        id: like.id,
        questionId,
        liked: true,
        likeCount,
        createdAt: like.createdAt,
    });
});

//DELETE /api/questions/:questionId/like
router.delete("/:questionId/like", async (req, res) => {
    const questionId = Number(req.params.questionId);

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }

    await prisma.like.deleteMany({
        where: { userId: req.user.userId, questionId },
    });

    const likeCount = await prisma.like.count({ where: { questionId } });

    res.json({ questionId, liked: false, likeCount });
});


module.exports = router;