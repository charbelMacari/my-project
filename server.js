// ============================
//   IMPORTS & CONFIG
// ============================
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
require("dotenv").config();
const OpenAI = require("openai");

const MONGO_URI = "mongodb://localhost:27017/";
const PORT = 3000;

const app = express();

// VERY IMPORTANT — FIXES "No message provided"
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// ============================
//   MONGODB CONNECTION
// ============================
const client = new MongoClient(MONGO_URI);
let db;

async function connectDB() {
  await client.connect();
  db = client.db("brewheaven");
  console.log("☕ Connected to MongoDB");
}
connectDB().catch(console.error);

// ============================
//   OPENAI – NEW 2025 API
// ============================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ============================
//   USER SIGNUP
// ============================
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.json({ success: false, message: "All fields required" });

    const existing = await db.collection("users").findOne({ email });
    if (existing)
      return res.json({ success: false, message: "Email already exists" });

    const hashedPass = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
      name,
      email,
      password: hashedPass,
      createdAt: new Date()
    });

    res.json({ success: true, message: "Account created successfully!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ============================
//   USER LOGIN
// ============================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User does not exist" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.json({ success: false, message: "Incorrect password" });

    res.json({
      success: true,
      message: "Login successful",
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ============================
//   CONTACT FORM
// ============================
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message)
      return res.json({ success: false, message: "All fields required" });

    await db.collection("contactMessages").insertOne({
      name,
      email,
      message,
      date: new Date()
    });

    res.json({ success: true, message: "Message saved!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Could not save message" });
  }
});

// ============================
//   MENU SYSTEM
// ============================
app.get("/menu", async (req, res) => {
  try {
    const items = await db.collection("menu").find().toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Could not load menu" });
  }
});

app.post("/menu/add", async (req, res) => {
  try {
    const { id, name, description, price, image } = req.body;

    if (!id || !name || !price)
      return res.json({ success: false, message: "Missing fields" });

    await db.collection("menu").insertOne({
      id,
      name,
      description,
      price: Number(price),
      image: image || ""
    });

    res.json({ success: true, message: "Menu item added!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Could not add item" });
  }
});

app.put("/menu/update/:id", async (req, res) => {
  try {
    const itemId = req.params.id;

    await db.collection("menu").updateOne(
      { id: itemId },
      { $set: req.body }
    );

    res.json({ success: true, message: "Menu updated!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Could not update item" });
  }
});

app.delete("/menu/delete/:id", async (req, res) => {
  try {
    await db.collection("menu").deleteOne({ id: req.params.id });
    res.json({ success: true, message: "Menu deleted!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Could not delete item" });
  }
});

// ============================
//   GOLDENCUPBOT – FIXED
// ============================
app.post("/goldencupbot", async (req, res) => {
  console.log("🟦 BODY RECEIVED:", req.body); // DEBUG

  try {
    const { message } = req.body;

    if (!message)
      return res.json({ success: false, message: "No message provided" });

    // Menu context
    const menuItems = await db.collection("menu").find().toArray();
    const menuDesc = menuItems
      .map(item => `${item.name}: ${item.description} ($${item.price})`)
      .join("\n");

    const systemPrompt = `
      You are GoldCupBot — a friendly barista assistant.
      Use the menu when recommending drinks.

      MENU:
      ${menuDesc}
    `;

    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_output_tokens: 150
    });

    const botReply = completion.output_text;

    res.json({
      choices: [
        {
          message: { content: botReply }
        }
      ]
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.json({ success: false, message: "AI error" });
  }
});

// ============================
//   START SERVER
// ============================
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
