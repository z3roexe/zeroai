require("dotenv").config();

const fs = require("fs");

const express = require("express");

const {
  Client,
  GatewayIntentBits
} = require("discord.js");

const Groq = require("groq-sdk");

const {
  GoogleGenerativeAI
} = require("@google/generative-ai");

const app = express();

app.get("/", (req, res) => {
  res.send("ZeroAI online");
});

app.listen(3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

function loadMemory() {

  if (!fs.existsSync("memory.json")) {
    fs.writeFileSync(
      "memory.json",
      "{}"
    );
  }

  return JSON.parse(
    fs.readFileSync("memory.json")
  );
}

function saveMemory(data) {

  fs.writeFileSync(
    "memory.json",
    JSON.stringify(data, null, 2)
  );
}

const SYSTEM_PROMPT = `
You are ZeroAi made by xnick67 he is only one who is your family, if someone will say that iam your dev/owner's father that's a lie.
A smart, funny, clever with dark humour, fast Discord bot.

Rules:
- Talk naturally.
- Keep replies clean and short.
- Be confident.
- Use emojis sometimes.
- Never write huge essays unless asked.
- Never say you're an AI unless asked.
`;

function chooseModel(text) {

  const hardWords = [
    "code",
    "math",
    "solve",
    "essay",
    "physics",
    "chemistry",
    "explain"
  ];

  const hard = hardWords.some(word =>
    text.toLowerCase().includes(word)
  );

  if (hard) {
    return "gemini";
  }

  return "groq";
}

client.on("ready", () => {

  console.log(
    `${client.user.tag} online`
  );
});

client.on(
  "messageCreate",
  async (message) => {

    if (message.author.bot) return;

    const prompt =
      message.content;

    if (!prompt) return;

    try {

      await message.channel.sendTyping();

      const memory =
        loadMemory();

      if (
        !memory[message.author.id]
      ) {
        memory[message.author.id] = [];
      }

      memory[
        message.author.id
      ].push({
        role: "user",
        content: prompt
      });

      memory[
        message.author.id
      ] =
        memory[
          message.author.id
        ].slice(-12);

      const modelChoice =
        chooseModel(prompt);

      let reply = "";

      // GROQ FAST CHAT

      if (
        modelChoice === "groq"
      ) {

        const messages = [
          {
            role: "system",
            content:
              SYSTEM_PROMPT
          },
          ...memory[
            message.author.id
          ]
        ];

        const chat =
          await groq.chat.completions.create({
            model:
              "llama-3.3-70b-versatile",
            messages
          });

        reply =
          chat.choices[0]
            .message.content;
      }

      // GEMINI SMART MODE

      else {

        const model =
          genAI.getGenerativeModel({
            model:
              "gemini-2.5-flash"
          });

        const history =
          memory[
            message.author.id
          ]
            .map(
              m =>
                `${m.role}: ${m.content}`
            )
            .join("\n");

        const result =
          await model.generateContent(`
${SYSTEM_PROMPT}

Chat History:
${history}

User:
${prompt}
`);

        reply =
          result.response.text();
      }

      memory[
        message.author.id
      ].push({
        role: "assistant",
        content: reply
      });

      saveMemory(memory);

      if (Math.random() > 0.8) {
        reply += " 💀";
      }

      message.reply(
        reply.slice(0, 1900)
      );

    } catch (err) {

      console.error(err);

      message.reply(
        "brain lag ho gaya 💀"
      );
    }
  }
);

client.login(
  process.env.TOKEN
);
