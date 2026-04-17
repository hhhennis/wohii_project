const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const prisma = require("./lib/prisma");

const questionsRouter = require("./routes/questions");

// Middleware to parse JSON bodies (will be useful in later steps)
app.use(express.json());

//everything under /api/questions
app.use("/api/questions", questionsRouter);

//for unsupportetd routes, we send 404 not found (catch anything unsupported)
app.use((req,res)=> {
  res.json({msg: "not found"});
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


