/**
 * Strategy execution engine
 * Executes parsed actions with conditional logic and error handling
 */

import * as blockchain from "./blockchain.js";

/**
 * Execute a strategy (list of actions)
 * @param {Array} actions - Array of action objects
 * @param {Object} config - Configuration options
 * @returns {Object} Execution results
 */
export async function executeStrategy(actions, config = {}) {
  console.log("🚀 Executing strategy...\n");

  const results = {
    success: true,
    actions: [],
    failedAt: null,
    totalActions: actions.length,
    executedActions: 0,
  };

  let shouldContinue = true;

  for (let i = 0; i < actions.length; i++) {
    if (!shouldContinue) {
      console.log(`⏸️  Execution stopped at action ${i + 1}`);
      break;
    }

    const action = actions[i];
    console.log(`\n[${i + 1}/${actions.length}] Executing: ${action.type}`);

    try {
      const result = await executeAction(action, config);

      results.actions.push({
        action,
        result,
        success: result.success !== false,
        index: i,
      });

      results.executedActions++;

      // Check if action failed and should stop execution
      if (result.success === false) {
        shouldContinue = false;
        results.success = false;
        results.failedAt = i;
        console.log(`   ❌ Action failed - stopping execution`);
      } else {
        console.log(`   ✅ Action completed`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);

      results.actions.push({
        action,
        error: error.message,
        success: false,
        index: i,
      });

      results.success = false;
      results.failedAt = i;

      if (!config.continueOnError) {
        shouldContinue = false;
      }
    }
  }

  return results;
}

/**
 * Execute a single action
 * @param {Object} action - Action object
 * @param {Object} config - Configuration
 * @returns {Object} Action result
 */
async function executeAction(action, config) {
  switch (action.type) {
    case "checkBalance":
      return await executeCheckBalance(action, config);

    case "validateRequest":
      return await executeValidateRequest(action, config);

    case "sendToken":
      return await executeSendToken(action, config);

    case "splitFunds":
      return await executeSplitFunds(action, config);

    case "mintToken":
      return await executeMintToken(action, config);

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

/**
 * Check balance and evaluate condition
 */
async function executeCheckBalance(action, config) {
  const balance = await blockchain.getBalance(
    action.token,
    config.walletAddress
  );

  // Evaluate condition
  const threshold = action.threshold || 0;
  let conditionMet = false;

  if (action.condition) {
    if (action.condition.startsWith(">=")) {
      conditionMet = balance >= threshold;
    } else if (action.condition.startsWith("<=")) {
      conditionMet = balance <= threshold;
    } else if (action.condition.startsWith(">")) {
      conditionMet = balance > threshold;
    } else if (action.condition.startsWith("<")) {
      conditionMet = balance < threshold;
    } else if (action.condition.startsWith("==")) {
      conditionMet = balance === threshold;
    }
  } else {
    conditionMet = balance >= threshold;
  }

  return {
    success: conditionMet,
    balance,
    threshold,
    condition: action.condition,
    conditionMet,
  };
}

/**
 * Validate a request/address
 */
async function executeValidateRequest(action, config) {
  const isValid = await blockchain.validateRequest(action.recipient);

  return {
    success: isValid,
    recipient: action.recipient,
    isValid,
  };
}

/**
 * Send tokens
 */
async function executeSendToken(action, config) {
  // Validate inputs
  if (!action.recipient || !action.amount || !action.token) {
    throw new Error("Missing required parameters for sendToken");
  }

  // Check if dry run mode
  if (config.dryRun) {
    console.log("   🧪 DRY RUN - transaction not executed");
    return {
      success: true,
      dryRun: true,
      action,
    };
  }

  const result = await blockchain.sendToken(
    action.token,
    action.amount,
    action.recipient
  );

  return {
    success: true,
    ...result,
  };
}

/**
 * Split funds among multiple recipients
 */
async function executeSplitFunds(action, config) {
  if (!action.recipients || action.recipients.length === 0) {
    throw new Error("No recipients specified for splitFunds");
  }

  if (config.dryRun) {
    console.log("   🧪 DRY RUN - transactions not executed");
    return {
      success: true,
      dryRun: true,
      action,
    };
  }

  const result = await blockchain.splitFunds(
    action.token,
    action.amount,
    action.recipients
  );

  return {
    success: true,
    ...result,
  };
}

/**
 * Mint new tokens
 */
async function executeMintToken(action, config) {
  if (!action.recipient || !action.amount || !action.token) {
    throw new Error("Missing required parameters for mintToken");
  }

  if (config.dryRun) {
    console.log("   🧪 DRY RUN - mint not executed");
    return {
      success: true,
      dryRun: true,
      action,
    };
  }

  const result = await blockchain.mintToken(
    action.token,
    action.amount,
    action.recipient
  );

  return {
    success: true,
    ...result,
  };
}

/**
 * Execute actions in parallel (for independent actions)
 * @param {Array} actions - Actions to execute in parallel
 * @param {Object} config - Configuration
 * @returns {Array} Results
 */
export async function executeParallel(actions, config = {}) {
  console.log(`⚡ Executing ${actions.length} actions in parallel...\n`);

  const promises = actions.map((action, i) =>
    executeAction(action, config)
      .then((result) => ({ action, result, success: true, index: i }))
      .catch((error) => ({
        action,
        error: error.message,
        success: false,
        index: i,
      }))
  );

  const results = await Promise.all(promises);

  return {
    success: results.every((r) => r.success),
    actions: results,
    totalActions: actions.length,
    executedActions: results.filter((r) => r.success).length,
  };
}

/**
 * Schedule an action for future execution
 * @param {Object} action - Action to schedule
 * @param {Date|number} time - When to execute (Date object or ms from now)
 * @param {Object} config - Configuration
 */
export function scheduleAction(action, time, config = {}) {
  const delay = time instanceof Date ? time.getTime() - Date.now() : time;

  console.log(
    `⏰ Scheduled action for ${new Date(Date.now() + delay).toISOString()}`
  );

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await executeAction(action, config);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

/**
 * Create a recurring automation
 * @param {Array} actions - Actions to repeat
 * @param {number} interval - Interval in ms
 * @param {Object} config - Configuration
 * @returns {Function} Stop function
 */
export function createRecurringAutomation(actions, interval, config = {}) {
  let running = true;

  const execute = async () => {
    while (running) {
      console.log(
        `\n🔄 Starting recurring execution at ${new Date().toISOString()}`
      );

      try {
        await executeStrategy(actions, config);
      } catch (error) {
        console.error("Recurring execution error:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  };

  execute();

  return () => {
    running = false;
    console.log("🛑 Stopped recurring automation");
  };
}
