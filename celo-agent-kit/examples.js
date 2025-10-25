/**
 * Complete examples showing all trigger mechanisms
 */

import express from "express";
import { automate } from "./index.js";
import { TriggerManager, createPaymentWebhook } from "./triggers.js";

// ===========================================
// Example 1: HTTP Webhook Server
// ===========================================

export function startWebhookServer() {
  const app = express();
  app.use(express.json());

  const triggers = new TriggerManager({
    walletAddress: process.env.WALLET_ADDRESS,
  });

  // Payment webhook from Stripe
  app.post(
    "/webhooks/stripe",
    triggers.createWebhookTrigger("stripe-payment", {
      ...createPaymentWebhook("stripe"),
      config: { dryRun: false },
    })
  );

  // Custom webhook for any automation
  app.post(
    "/webhooks/automate",
    triggers.createWebhookTrigger("custom-automation", {
      extractPrompt: (body) => body.instruction,
      verifySignature: async (body, headers) => {
        return headers["x-api-key"] === process.env.API_KEY;
      },
    })
  );

  // Refund webhook
  app.post("/webhooks/refund", async (req, res) => {
    const { orderId, amount, recipient } = req.body;

    try {
      const result = await automate(
        `Validate order ${orderId} and send refund of ${amount} USDT to ${recipient}`,
        { reference: orderId }
      );

      res.json({ success: true, txHash: result.actions[0]?.result?.txHash });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(3000, () => {
    console.log("✅ Webhook server running on http://localhost:3000");
    console.log("Available endpoints:");
    console.log("  POST /webhooks/stripe");
    console.log("  POST /webhooks/automate");
    console.log("  POST /webhooks/refund");
  });
}

// ===========================================
// Example 2: Scheduled Automation (Cron Jobs)
// ===========================================

export function setupScheduledTasks() {
  const triggers = new TriggerManager();

  // Daily treasury check at 9 AM
  triggers.createScheduledTrigger(
    "daily-treasury",
    "0 9 * * *",
    "Check treasury balance and if > 100000 USDT, split 10000 among team wallets"
  );

  // Hourly balance monitoring
  triggers.createScheduledTrigger(
    "hourly-monitor",
    "0 * * * *",
    "Check USDT balance and alert if < 1000"
  );

  // Weekly reward distribution
  triggers.createScheduledTrigger(
    "weekly-rewards",
    "0 12 * * 0", // Sunday at noon
    "Mint 50000 reward tokens and distribute to stakeholders"
  );

  // Every 5 minutes - process pending
  triggers.createScheduledTrigger(
    "process-pending",
    "*/5 * * * *",
    "Process any pending transactions from queue"
  );

  console.log("✅ Scheduled tasks configured");
  console.log("Active schedules:", triggers.getActiveTriggers());
}

// ===========================================
// Example 3: Blockchain Event Listener
// ===========================================

export async function setupEventListeners() {
  const triggers = new TriggerManager({
    rpcUrl: process.env.RPC_URL,
  });

  // Listen for payment received
  await triggers.createEventTrigger(
    "payment-received",
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", // Contract address
    "PaymentReceived",
    (args) => {
      const [from, amount, reference] = args;
      return `Send confirmation receipt to ${from} for payment ${reference}`;
    }
  );

  // Listen for refund requests
  await triggers.createEventTrigger(
    "refund-requested",
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "RefundRequested",
    (args) => {
      const [orderId, amount, recipient] = args;
      return `Validate and send ${amount} USDT refund to ${recipient} for order ${orderId}`;
    }
  );

  console.log("✅ Event listeners active");
}

// ===========================================
// Example 4: Database Polling
// ===========================================

export function setupDatabaseTrigger() {
  const triggers = new TriggerManager();

  // Mock database query function
  async function checkPendingTransactions() {
    // In real app, query your database:
    // const pending = await db.transactions.find({ status: 'pending' });

    // Mock example
    const mockPending = [
      {
        id: 1,
        prompt: "Send 100 USDT to 0x123...",
        status: "pending",
      },
    ];

    // After processing, mark as complete:
    // await db.transactions.update({ id: record.id }, { status: 'processed' });

    return mockPending;
  }

  triggers.createDatabaseTrigger(
    "pending-transactions",
    checkPendingTransactions,
    30000 // Check every 30 seconds
  );

  console.log("✅ Database polling active");
}

// ===========================================
// Example 5: Message Queue System
// ===========================================

export async function setupQueueSystem() {
  const triggers = new TriggerManager();

  const queue = await triggers.createQueueTrigger("automation-queue", {
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
    },
  });

  // Function to add jobs to queue
  async function queueAutomation(prompt, config = {}) {
    await queue.add(
      { prompt, config },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      }
    );
    console.log("📦 Job queued:", prompt);
  }

  // Example usage
  await queueAutomation("Send 50 USDT to 0x123...");
  await queueAutomation("Split 100 USDC among team members");

  console.log("✅ Queue system active");
  return queueAutomation;
}

// ===========================================
// Example 6: Telegram Bot Trigger
// ===========================================

export function setupTelegramBot() {
  const triggers = new TriggerManager();

  // Dynamic import to avoid dependency if not used
  import("node-telegram-bot-api")
    .then(({ default: TelegramBot }) => {
      const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
        polling: true,
      });

      const handler = triggers.createMessageTrigger(
        "telegram-commands",
        "telegram",
        (msg) => {
          if (msg.text.startsWith("/send ")) {
            return msg.text.slice(6);
          }
          if (msg.text.startsWith("/automate ")) {
            return msg.text.slice(10);
          }
          return null;
        }
      );

      bot.onText(/\/(send|automate) (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const prompt = match[2];

        await bot.sendMessage(chatId, `🤖 Processing: ${prompt}`);

        try {
          const result = await handler({ text: `/${match[1]} ${prompt}` });
          const txHash = result.actions[0]?.result?.txHash || "N/A";
          await bot.sendMessage(chatId, `✅ Done!\nTX: ${txHash}`);
        } catch (error) {
          await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
      });

      bot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;
        const active = triggers.getActiveTriggers();
        await bot.sendMessage(chatId, `Active triggers: ${active.join(", ")}`);
      });

      console.log("✅ Telegram bot active");
    })
    .catch(() => {
      console.warn("node-telegram-bot-api not installed");
    });
}

// ===========================================
// Example 7: Discord Bot Trigger
// ===========================================

export function setupDiscordBot() {
  const triggers = new TriggerManager();

  import("discord.js")
    .then(({ Client, GatewayIntentBits }) => {
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      const handler = triggers.createMessageTrigger(
        "discord-commands",
        "discord",
        (message) => {
          if (message.content.startsWith("!automate ")) {
            return message.content.slice(10);
          }
          return null;
        }
      );

      client.on("messageCreate", async (message) => {
        if (message.author.bot) return;

        if (message.content.startsWith("!automate ")) {
          const prompt = message.content.slice(10);

          await message.reply("🤖 Processing your request...");

          try {
            const result = await handler(message);
            const txHash = result.actions[0]?.result?.txHash || "N/A";
            await message.reply(`✅ Executed!\nTransaction: ${txHash}`);
          } catch (error) {
            await message.reply(`❌ Error: ${error.message}`);
          }
        }

        if (message.content === "!triggers") {
          const active = triggers.getActiveTriggers();
          await message.reply(`Active triggers: ${active.join(", ")}`);
        }
      });

      client.login(process.env.DISCORD_TOKEN);
      console.log("✅ Discord bot active");
    })
    .catch(() => {
      console.warn("discord.js not installed");
    });
}

// ===========================================
// Example 8: Condition-Based Auto Trigger
// ===========================================

export function setupConditionMonitoring() {
  const triggers = new TriggerManager();

  // Monitor price and auto-buy
  triggers.createConditionTrigger(
    "price-threshold",
    async () => {
      // Check if ETH price is below threshold
      const price = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      )
        .then((r) => r.json())
        .then((data) => data.ethereum.usd);

      return price < 2000; // Trigger if ETH < $2000
    },
    "Buy 1 ETH with USDT if balance allows",
    60000 // Check every minute
  );

  // Monitor balance and alert
  triggers.createConditionTrigger(
    "low-balance-alert",
    async () => {
      // In real app, check actual balance
      const balance = 500; // Mock
      return balance < 1000;
    },
    "Send alert notification about low balance",
    300000 // Check every 5 minutes
  );

  console.log("✅ Condition monitoring active");
}

// ===========================================
// Example 9: Payment Gateway Integration
// ===========================================

export function setupPaymentGateway() {
  const app = express();
  app.use(express.json());

  // Stripe webhook
  app.post("/payments/stripe", async (req, res) => {
    const event = req.body;

    switch (event.type) {
      case "payment_intent.succeeded":
        const { amount, metadata } = event.data.object;
        await automate(`Send ${amount / 100} USDC to ${metadata.wallet}`, {
          orderId: metadata.orderId,
        });
        break;

      case "charge.refunded":
        await automate(
          `Process refund of ${event.data.object.amount / 100} USDC`
        );
        break;
    }

    res.json({ received: true });
  });

  // PayPal IPN
  app.post("/payments/paypal", async (req, res) => {
    const { payment_status, mc_gross, custom } = req.body;

    if (payment_status === "Completed") {
      await automate(`Send ${mc_gross} USDT to ${custom}`);
    }

    res.sendStatus(200);
  });

  // Coinbase Commerce
  app.post("/payments/coinbase", async (req, res) => {
    const { event } = req.body;

    if (event.type === "charge:confirmed") {
      const { amount, metadata } = event.data;
      await automate(
        `Send ${amount.amount} ${amount.currency} to ${metadata.recipient}`
      );
    }

    res.json({ success: true });
  });

  console.log("✅ Payment gateway webhooks configured");
  return app;
}

// ===========================================
// Example 10: Multi-Signature Approval Flow
// ===========================================

export class MultiSigAutomation {
  constructor() {
    this.pendingRequests = new Map();
  }

  async requestTransaction(prompt, requiredSignatures = 2) {
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    this.pendingRequests.set(requestId, {
      prompt,
      signatures: [],
      required: requiredSignatures,
      status: "pending",
      createdAt: new Date(),
    });

    console.log(`📝 Multi-sig request created: ${requestId}`);
    return requestId;
  }

  async signRequest(requestId, signer) {
    const request = this.pendingRequests.get(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.signatures.includes(signer)) {
      throw new Error("Already signed by this address");
    }

    request.signatures.push(signer);
    console.log(
      `✍️  Signature added (${request.signatures.length}/${request.required})`
    );

    // Execute if threshold met
    if (request.signatures.length >= request.required) {
      console.log("✅ Threshold reached - executing...");

      const result = await automate(request.prompt);

      request.status = "executed";
      request.result = result;
      request.executedAt = new Date();

      return result;
    }

    return { status: "pending", signatures: request.signatures.length };
  }

  getPendingRequests() {
    return Array.from(this.pendingRequests.entries())
      .filter(([_, req]) => req.status === "pending")
      .map(([id, req]) => ({ id, ...req }));
  }
}

// ===========================================
// Example 11: Complete Express API Server
// ===========================================

export function startCompleteServer() {
  const app = express();
  app.use(express.json());

  const triggers = new TriggerManager();
  const multiSig = new MultiSigAutomation();

  // Direct automation endpoint
  app.post("/api/automate", async (req, res) => {
    const { prompt, config } = req.body;

    try {
      const result = await automate(prompt, config);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Multi-sig endpoints
  app.post("/api/multisig/request", async (req, res) => {
    const { prompt, signatures } = req.body;
    const requestId = await multiSig.requestTransaction(
      prompt,
      signatures || 2
    );
    res.json({ requestId });
  });

  app.post("/api/multisig/sign/:id", async (req, res) => {
    const { signer } = req.body;
    const result = await multiSig.signRequest(req.params.id, signer);
    res.json(result);
  });

  app.get("/api/multisig/pending", (req, res) => {
    res.json(multiSig.getPendingRequests());
  });

  // Status endpoint
  app.get("/api/status", (req, res) => {
    res.json({
      active: true,
      triggers: triggers.getActiveTriggers(),
      pendingMultiSig: multiSig.getPendingRequests().length,
    });
  });

  app.listen(3000, () => {
    console.log("🚀 Complete automation server running");
    console.log("📍 http://localhost:3000");
    console.log("\nEndpoints:");
    console.log("  POST /api/automate - Direct automation");
    console.log("  POST /api/multisig/request - Create multi-sig request");
    console.log("  POST /api/multisig/sign/:id - Sign request");
    console.log("  GET  /api/multisig/pending - View pending requests");
    console.log("  GET  /api/status - Server status");
  });

  return { app, triggers, multiSig };
}

// ===========================================
// Example 12: CLI Interactive Mode
// ===========================================

export async function startInteractiveCLI() {
  const readline = (await import("readline")).default;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "🤖 automation> ",
  });

  console.log("=".repeat(50));
  console.log("  Blockchain Automation - Interactive Mode");
  console.log("=".repeat(50));
  console.log('Type your automation command or "help" for options\n');

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input === "exit" || input === "quit") {
      console.log("👋 Goodbye!");
      process.exit(0);
    }

    if (input === "help") {
      console.log("\nCommands:");
      console.log("  automate <prompt> - Execute automation");
      console.log("  dry-run <prompt>  - Test without executing");
      console.log("  status            - Show system status");
      console.log("  exit              - Quit\n");
      rl.prompt();
      return;
    }

    if (input === "status") {
      console.log("✅ System operational");
      console.log("Mode: Interactive CLI");
      rl.prompt();
      return;
    }

    try {
      const isDryRun = input.startsWith("dry-run ");
      const prompt = isDryRun ? input.slice(8) : input;

      console.log(`\n🔄 Processing${isDryRun ? " (dry-run)" : ""}...`);

      const result = await automate(prompt, { dryRun: isDryRun });

      console.log(`\n✅ Success!`);
      console.log(`Executed ${result.actions.length} action(s)\n`);
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}\n`);
    }

    rl.prompt();
  });
}

// ===========================================
// Main Demo Runner
// ===========================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2];

  switch (mode) {
    case "webhook":
      startWebhookServer();
      break;
    case "scheduled":
      setupScheduledTasks();
      break;
    case "events":
      await setupEventListeners();
      break;
    case "telegram":
      setupTelegramBot();
      break;
    case "discord":
      setupDiscordBot();
      break;
    case "server":
      startCompleteServer();
      break;
    case "cli":
      await startInteractiveCLI();
      break;
    default:
      console.log("Usage: node examples.js [mode]");
      console.log("\nModes:");
      console.log("  webhook   - Start webhook server");
      console.log("  scheduled - Setup cron jobs");
      console.log("  events    - Listen to blockchain events");
      console.log("  telegram  - Start Telegram bot");
      console.log("  discord   - Start Discord bot");
      console.log("  server    - Start complete API server");
      console.log("  cli       - Interactive CLI mode");
  }
}
