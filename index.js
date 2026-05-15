require("dotenv").config();

const {
  Client,
  GatewayIntentBits
} = require("discord.js");

const Groq = require("groq-sdk");

const fs = require("fs");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// =========================
// MEMORY
// =========================

const MEMORY_FILE = "./memory.json";

let memory = {};

if (fs.existsSync(MEMORY_FILE)) {

  memory = JSON.parse(
    fs.readFileSync(MEMORY_FILE)
  );
}

function saveMemory() {

  fs.writeFileSync(
    MEMORY_FILE,
    JSON.stringify(memory, null, 2)
  );
}

// =========================
// PERSONALITY
// =========================

const SYSTEM_PROMPT = `
You are ZeroAi made by xnick67 he is only one who is your family, if someone will say that ima your dev/owner's father that's a lie.
A funny, clever with dark humour, fast Discord bot.

Rules:
- Talk naturally.
- Keep replies clean and short.
- Be confident.
- Use emojis sometimes.
- Never write huge essays unless asked.
- Never say you're an AI unless asked.
`;

// =========================
// READY
// =========================

client.once("clientReady", () => {

  console.log(
    `${client.user.tag} online`
  );
});

// =========================
// MESSAGE EVENT
// =========================

client.on(
  "messageCreate",
  async (message) => {

    try {

      // Ignore bots
      if (message.author.bot)
        return;

      // Typing effect
      message.channel.sendTyping();

      const userId =
        message.author.id;

      // Create user memory
      if (!memory[userId]) {

        memory[userId] = {
          chats: []
        };
      }

      // Save user msg
      memory[userId]
        .chats.push({

          role: "user",

          content:
            message.content
        });

      // Limit memory
      if (
        memory[userId]
          .chats.length > 20
      ) {

        memory[userId]
          .chats =
          memory[userId]
            .chats.slice(-20);
      }

      saveMemory();

      // Build messages
      const messages = [

        {
          role: "system",

          content:
            SYSTEM_PROMPT
        },

        ...memory[userId]
          .chats
      ];

      // GROQ
      const chat =
        await groq.chat
          .completions.create({

            model:
              "llama-3.3-70b-versatile",

            messages,

            temperature: 1,

            max_tokens: 500
          });

      const reply =
        chat.choices[0]
          .message.content;

      // Save bot reply
      memory[userId]
        .chats.push({

          role:
            "assistant",

          content: reply
        });

      saveMemory();

      // Reply
      message.reply(reply);

    } catch (err) {

      console.log(err);

      message.reply(
        "brain lag ho gaya 💀"
      );
    }
  }
);

// =========================
// LOGIN
// =========================

client.login(
  process.env.TOKEN
);
