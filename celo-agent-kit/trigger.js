/**
 * Trigger system for blockchain automation
 * Supports webhooks, events, schedules, and more
 */

import { automate } from "./index.js";
import { EventEmitter } from "events";

export class TriggerManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.activeTriggers = new Map();
  }

  /**
   * Register a webhook trigger
   * Returns an Express middleware function
   */
  createWebhookTrigger(name, options = {}) {
    return async (req, res, next) => {
      const { body, headers } = req;

      console.log(`🔔 Webhook triggered: ${name}`);

      try {
        // Verify webhook signature if provided
        if (options.verifySignature) {
          const isValid = await options.verifySignature(body, headers);
          if (!isValid) {
            return res.status(401).json({ error: "Invalid signature" });
          }
        }

        // Extract prompt from request
        const prompt = options.extractPrompt
          ? options.extractPrompt(body)
          : body.prompt;

        if (!prompt) {
          return res.status(400).json({ error: "No prompt provided" });
        }

        // Execute automation
        const result = await automate(prompt, {
          ...this.config,
          ...options.config,
          triggerName: name,
          webhookData: body,
        });

        this.emit("webhook-executed", { name, prompt, result });

        res.json({
          success: true,
          result,
          triggeredAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Webhook error: ${error.message}`);
        this.emit("webhook-error", { name, error });

        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    };
  }

  /**
   * Create a scheduled trigger using cron syntax
   */
  createScheduledTrigger(name, cronPattern, prompt, config = {}) {
    // Dynamic import to avoid dependency if not used
    import("node-cron")
      .then((cron) => {
        const task = cron.schedule(cronPattern, async () => {
          console.log(`⏰ Scheduled trigger: ${name}`);

          try {
            const result = await automate(prompt, {
              ...this.config,
              ...config,
              triggerName: name,
            });

            this.emit("scheduled-executed", { name, prompt, result });
          } catch (error) {
            console.error(`Scheduled trigger error: ${error.message}`);
            this.emit("scheduled-error", { name, error });
          }
        });

        this.activeTriggers.set(name, task);
        console.log(
          `📅 Scheduled trigger registered: ${name} (${cronPattern})`
        );
      })
      .catch(() => {
        console.warn(
          "node-cron not installed. Install with: npm install node-cron"
        );
      });
  }

  /**
   * Create a blockchain event trigger
   */
  async createEventTrigger(name, contractAddress, eventName, handler) {
    try {
      const { ethers } = await import("ethers");

      const provider = new ethers.JsonRpcProvider(
        this.config.rpcUrl || process.env.RPC_URL
      );

      const contract = new ethers.Contract(
        contractAddress,
        [`event ${eventName}(...)`], // Simplified ABI
        provider
      );

      contract.on(eventName, async (...args) => {
        console.log(`🔗 Event triggered: ${name}`);

        try {
          const prompt = handler(args);

          if (prompt) {
            const result = await automate(prompt, {
              ...this.config,
              triggerName: name,
              eventData: args,
            });

            this.emit("event-executed", { name, eventName, result });
          }
        } catch (error) {
          console.error(`Event trigger error: ${error.message}`);
          this.emit("event-error", { name, error });
        }
      });

      this.activeTriggers.set(name, { provider, contract });
      console.log(`🔗 Event trigger registered: ${name}`);
    } catch (error) {
      console.warn("ethers not installed. Install with: npm install ethers");
    }
  }

  /**
   * Create a message/chat trigger
   */
  createMessageTrigger(name, platform, messageHandler) {
    const trigger = {
      platform,
      handler: async (message) => {
        console.log(`💬 Message trigger: ${name}`);

        const prompt = messageHandler(message);

        if (prompt) {
          try {
            const result = await automate(prompt, {
              ...this.config,
              triggerName: name,
              messageData: message,
            });

            this.emit("message-executed", { name, platform, result });
            return result;
          } catch (error) {
            console.error(`Message trigger error: ${error.message}`);
            this.emit("message-error", { name, error });
            throw error;
          }
        }
      },
    };

    this.activeTriggers.set(name, trigger);
    return trigger.handler;
  }

  /**
   * Create a database change trigger
   */
  createDatabaseTrigger(name, checkFunction, interval = 30000) {
    const timer = setInterval(async () => {
      try {
        const records = await checkFunction();

        if (records && records.length > 0) {
          console.log(
            `💾 Database trigger: ${name} (${records.length} records)`
          );

          for (const record of records) {
            if (record.prompt) {
              const result = await automate(record.prompt, {
                ...this.config,
                triggerName: name,
                recordData: record,
              });

              this.emit("database-executed", { name, record, result });
            }
          }
        }
      } catch (error) {
        console.error(`Database trigger error: ${error.message}`);
        this.emit("database-error", { name, error });
      }
    }, interval);

    this.activeTriggers.set(name, timer);
    console.log(
      `💾 Database trigger registered: ${name} (every ${interval}ms)`
    );
  }

  /**
   * Create a queue-based trigger
   */
  async createQueueTrigger(name, queueConfig) {
    try {
      const Queue = (await import("bull")).default;

      const queue = new Queue(name, queueConfig);

      queue.process(async (job) => {
        console.log(`📦 Queue job: ${job.id}`);

        const { prompt, config } = job.data;

        const result = await automate(prompt, {
          ...this.config,
          ...config,
          triggerName: name,
          jobId: job.id,
        });

        this.emit("queue-executed", { name, jobId: job.id, result });

        return result;
      });

      this.activeTriggers.set(name, queue);
      console.log(`📦 Queue trigger registered: ${name}`);

      return queue;
    } catch (error) {
      console.warn("bull not installed. Install with: npm install bull");
    }
  }

  /**
   * Create a condition-based trigger (polling)
   */
  createConditionTrigger(name, checkCondition, prompt, interval = 60000) {
    const timer = setInterval(async () => {
      try {
        const shouldTrigger = await checkCondition();

        if (shouldTrigger) {
          console.log(`✅ Condition met for: ${name}`);

          const result = await automate(prompt, {
            ...this.config,
            triggerName: name,
          });

          this.emit("condition-executed", { name, result });

          // Optional: stop after first trigger
          if (this.config.triggerOnce) {
            this.stopTrigger(name);
          }
        }
      } catch (error) {
        console.error(`Condition trigger error: ${error.message}`);
        this.emit("condition-error", { name, error });
      }
    }, interval);

    this.activeTriggers.set(name, timer);
    console.log(
      `🎯 Condition trigger registered: ${name} (every ${interval}ms)`
    );
  }

  /**
   * Stop a specific trigger
   */
  stopTrigger(name) {
    const trigger = this.activeTriggers.get(name);

    if (!trigger) {
      console.warn(`No trigger found: ${name}`);
      return false;
    }

    if (trigger.stop) {
      trigger.stop();
    } else if (typeof trigger === "number") {
      clearInterval(trigger);
    }

    this.activeTriggers.delete(name);
    console.log(`🛑 Stopped trigger: ${name}`);

    return true;
  }

  /**
   * Stop all triggers
   */
  stopAll() {
    console.log("🛑 Stopping all triggers...");

    for (const [name] of this.activeTriggers) {
      this.stopTrigger(name);
    }
  }

  /**
   * Get list of active triggers
   */
  getActiveTriggers() {
    return Array.from(this.activeTriggers.keys());
  }
}

/**
 * Helper function to create payment webhook handlers
 */
export function createPaymentWebhook(provider) {
  const handlers = {
    stripe: {
      extractPrompt: (body) => {
        if (body.type === "payment_intent.succeeded") {
          const { amount, metadata } = body.data.object;
          return `Send ${amount / 100} USDC to ${metadata.recipientAddress}`;
        }
      },
      verifySignature: async (body, headers) => {
        // Implement Stripe signature verification
        return true;
      },
    },

    paypal: {
      extractPrompt: (body) => {
        if (body.payment_status === "Completed") {
          return `Send ${body.mc_gross} USDT to ${body.custom}`;
        }
      },
    },

    coinbase: {
      extractPrompt: (body) => {
        if (body.event?.type === "charge:confirmed") {
          const { amount, metadata } = body.event.data;
          return `Send ${amount.amount} ${amount.currency} to ${metadata.recipient}`;
        }
      },
    },
  };

  return handlers[provider] || handlers.stripe;
}

// Export singleton instance
export const triggerManager = new TriggerManager();
