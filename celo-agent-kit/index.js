import { parsePrompt } from "./ai.js";
import { executeStrategy } from "./automation.js";

/**
 * Main automation function - accepts natural language prompts
 * and executes blockchain tasks autonomously
 * @param {string} prompt - Natural language description of tasks
 * @param {Object} config - Optional configuration (wallet, network, etc.)
 * @returns {Object} Execution results
 */
export async function automate(prompt, config = {}) {
  console.log("🤖 Starting blockchain automation...\n");

  try {
    // Parse the prompt into structured actions
    const actions = await parsePrompt(prompt, config);

    if (!actions || actions.length === 0) {
      throw new Error("No valid actions parsed from prompt");
    }

    console.log(`📋 Generated ${actions.length} action(s)\n`);

    // Execute the strategy
    const results = await executeStrategy(actions, config);

    console.log("\n✅ Automation completed successfully");
    return results;
  } catch (error) {
    console.error("\n❌ Automation failed:", error.message);
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const prompt =
    process.argv[2] ||
    "Check my USDT balance, and if it's over 100, send 50 USDT to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb after validating the request";

  automate(prompt)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
