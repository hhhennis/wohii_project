const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const prisma = require("./lib/prisma");
const path = require('path');

const questionsRouter = require("./routes/questions");
const authRouter = require("./routes/auth");

app.use(express.static(path.join(__dirname, '..', 'public')));


//everything under /api/questions
app.use("/api/auth", authRouter);
app.use("/api/questions", questionsRouter);


// Middleware to parse JSON bodies (will be useful in later steps)
app.use(express.json());


//for unsupportetd routes, we send 404 not found (catch anything unsupported)
app.use((req,res)=> {
  res.status(404).json({msg: "Not found"});
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
//databse connection will gracefully shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});