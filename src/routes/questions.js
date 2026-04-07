const express = require("express");
const router = express.Router();

const questions = require("../data/questions");

// GET /api/questions, /api/questins?keyword=http
// List all questions
router.get("/", (req, res) => {
    const {keyword} = req.query;
    if(!keyword) {
        return res.json(questions);
    }
    const filteredQuestions = questions.filter(q => q.keywords.includes(keyword));
    res.json(filteredQuestions);
});

//GET /api/questions/:questionID
router.get("/:questionId", (req, res) => {
    const questionId = Number(req.params.questionId);

    const question = questions.find((q) => q.id === questionId);

    if (!question) {
    return res.status(404).json({ message: "Question not found"});
    }

    res.json(question);
});

//POST /api/questions
router.post("/", (req, res) => {
    const {question, answer, keywords} = req.body;
    if(!question || !answer) {
        return res.status(400).json({msg: "Question and answer are required"})
    }
    const existingIds = questions.map(q=>q.id) // return existing ids
    const maxId = Math.max(...existingIds)
    const newQuestion = {
        id: questions.length ? maxId + 1 : 1,
        question, answer,
        keywords: Array.isArray(keywords) ? keywords : []
    }
    questions.push(newQuestion);
    res.status(201).json(newQuestion);
});

//PUT /api/questitons/:questionId
router.put("/:questionId", (req,res) => {
    const questionId = Number(req.params.questionId);
    const quizitem = questions.find((q) => q.id === questionId);
    if (!quizitem) {
    return res.status(404).json({ message: "Question not found"});
    }
const {question, answer, keywords} = req.body;
    if(!question || !answer) {
        return res.status(400).json({msg: "Question and answer are required"})
    }
    quizitem.question = question;
    quizitem.answer = answer;
    quizitem.keywords = Array.isArray(keywords) ? keywords : [];

    res.json(quizitem);
});

//DELETE /api/questions/:quesionId
router.delete("/:questionId", (req, res)=> {
    const questionId = Number(req.params.questionId);
    const questionIndex = questions.findIndex( q => q.id === questionId);

    if(questionIndex === -1){
        return res.status(404).json({msg: "Question not found"})
    }
    const deleteQuestion = questions.splice(questionIndex, 1);

    res.json({
        msg: "Question deleted successfully",
        question: deleteQuestion
    })

});

module.exports = router;