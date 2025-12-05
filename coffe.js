import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini", // or "gpt-4.1"
    messages: [
      { role: "system", content: "You are BrewBot, a friendly AI barista who helps customers order coffee." },
      { role: "user", content: userMessage }
    ],
  });

  const reply = completion.choices[0].message.content;
  res.json({ reply });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
