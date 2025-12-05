// server.js
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------
// MongoDB Connection
// ---------------------------
const client = new MongoClient("mongodb://localhost:27017");
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("brewheaven");
    console.log("☕ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

connectDB();

// ---------------------------
// OpenAI Configuration
// ---------------------------
const configuration = new Configuration({
  apiKey: "YOUR_OPENAI_API_KEY", // <-- Replace with your OpenAI API key
});
const openai = new OpenAIApi(configuration);

// ---------------------------
// BrewBot API
// ---------------------------
app.post("/brewbot", async (req, res) => {
  const userMessage = req.body?.message;
  if (!userMessage) {
    return res.status(400).json({ error: "Missing 'message' in request body" });
  }

  try {
    // Save user message to MongoDB
    await db.collection("chatMessages").insertOne({
      role: "user",
      text: userMessage,
      time: new Date(),
    });

    // Generate bot reply using ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are BrewBot, a helpful coffee assistant. Suggest drinks, answer questions about coffee, and be friendly."
        },
        { role: "user", content: userMessage }
      ],
      max_tokens: 200,
    });

    const botReply = completion.choices[0].message.content;

    // Save bot reply to MongoDB
    await db.collection("chatMessages").insertOne({
      role: "bot",
      text: botReply,
      time: new Date(),
    });

    // Send reply to front-end
    res.json({
      choices: [
        { message: { content: botReply } }
      ]
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Start Server
// ---------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 BrewBot server running at http://localhost:${PORT}`);
});
