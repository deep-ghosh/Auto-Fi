"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMIntegration = exports.AnthropicProvider = exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class OpenAIProvider {
    constructor(apiKey, model = "gpt-4") {
        this.client = new openai_1.default({ apiKey });
    }
    async generateDecision(agentType, goal, constraints, currentState, memory) {
        const prompt = this.buildDecisionPrompt(agentType, goal, constraints, currentState, memory);
        const response = await this.client.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an AI agent that makes decisions for Celo blockchain operations. Always respond with valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from OpenAI");
        }
        try {
            const parsed = JSON.parse(content);
            return {
                action: parsed.action || "none",
                params: parsed.params || {},
                reasoning: parsed.reasoning || "No reasoning provided",
                confidence: parsed.confidence || 0.5
            };
        }
        catch (error) {
            throw new Error(`Failed to parse LLM response: ${error}`);
        }
    }
    async explainAction(action, params, context) {
        const prompt = `Explain this blockchain action in simple terms:

Action: ${action}
Parameters: ${JSON.stringify(params, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Provide a clear, human-readable explanation of what this action does and why it's being taken.`;
        const response = await this.client.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        });
        return response.choices[0]?.message?.content || "No explanation available";
    }
    async validateAction(action, params, context) {
        const prompt = `Validate this blockchain action for safety and correctness:

Action: ${action}
Parameters: ${JSON.stringify(params, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Respond with JSON: {"isValid": true/false, "reason": "explanation"}

Consider:
- Is the action safe?
- Are the parameters reasonable?
- Does it align with the agent's goals?
- Are there any potential risks?`;
        const response = await this.client.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1,
            max_tokens: 300
        });
        try {
            const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
            return {
                isValid: parsed.isValid || false,
                reason: parsed.reason
            };
        }
        catch (error) {
            return {
                isValid: false,
                reason: "Failed to parse validation response"
            };
        }
    }
    buildDecisionPrompt(agentType, goal, constraints, currentState, memory) {
        return `You are a ${agentType} managing a Celo wallet.

Goal: ${goal}
Constraints: ${constraints}

Current State:
- Wallet: ${currentState.wallet || "N/A"}
- cUSD Balance: ${currentState.cusdBalance || "0"}
- cEUR Balance: ${currentState.ceurBalance || "0"}
- CELO Balance: ${currentState.celoBalance || "0"}
- Recent Transactions: ${JSON.stringify(currentState.recentTransactions || [], null, 2)}
- Agent-specific data: ${JSON.stringify(currentState.agentData || {}, null, 2)}

Memory Context:
- Previous actions: ${memory.actions.length}
- Key learnings: ${memory.learnings.join(", ") || "None"}
- Last run: ${memory.lastRun}

Based on this state and your goal, decide:
1. Should you take action? (yes/no)
2. If yes, what action? (transfer/swap/stake/unstake/claim/vote/mint/etc)
3. What are the specific parameters?
4. Why are you making this decision?

Respond in JSON format:
{
  "action": "action_name_or_none",
  "params": {
    "key": "value"
  },
  "reasoning": "explanation of decision",
  "confidence": 0.0-1.0
}`;
    }
}
exports.OpenAIProvider = OpenAIProvider;
class AnthropicProvider {
    constructor(apiKey, model = "claude-3-sonnet-20240229") {
        this.client = new sdk_1.default({ apiKey });
    }
    async generateDecision(agentType, goal, constraints, currentState, memory) {
        const prompt = this.buildDecisionPrompt(agentType, goal, constraints, currentState, memory);
        const response = await this.client.completions.create({
            model: "claude-3-sonnet-20240229",
            max_tokens_to_sample: 1000,
            prompt: prompt
        });
        const content = response.completion;
        if (!content) {
            throw new Error("No response from Anthropic");
        }
        try {
            const parsed = JSON.parse(content);
            return {
                action: parsed.action || "none",
                params: parsed.params || {},
                reasoning: parsed.reasoning || "No reasoning provided",
                confidence: parsed.confidence || 0.5
            };
        }
        catch (error) {
            throw new Error(`Failed to parse LLM response: ${error}`);
        }
    }
    async explainAction(action, params, context) {
        const prompt = `Explain this blockchain action in simple terms:

Action: ${action}
Parameters: ${JSON.stringify(params, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Provide a clear, human-readable explanation of what this action does and why it's being taken.`;
        const response = await this.client.completions.create({
            model: "claude-3-sonnet-20240229",
            max_tokens_to_sample: 500,
            prompt: prompt
        });
        const content = response.completion;
        return content || "No explanation available";
    }
    async validateAction(action, params, context) {
        const prompt = `Validate this blockchain action for safety and correctness:

Action: ${action}
Parameters: ${JSON.stringify(params, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Respond with JSON: {"isValid": true/false, "reason": "explanation"}

Consider:
- Is the action safe?
- Are the parameters reasonable?
- Does it align with the agent's goals?
- Are there any potential risks?`;
        const response = await this.client.completions.create({
            model: "claude-3-sonnet-20240229",
            max_tokens_to_sample: 300,
            prompt: prompt
        });
        const content = response.completion;
        if (!content) {
            return { isValid: false, reason: "No response from Anthropic" };
        }
        try {
            const parsed = JSON.parse(content);
            return {
                isValid: parsed.isValid || false,
                reason: parsed.reason
            };
        }
        catch (error) {
            return {
                isValid: false,
                reason: "Failed to parse validation response"
            };
        }
    }
    buildDecisionPrompt(agentType, goal, constraints, currentState, memory) {
        return `You are a ${agentType} managing a Celo wallet.

Goal: ${goal}
Constraints: ${constraints}

Current State:
- Wallet: ${currentState.wallet || "N/A"}
- cUSD Balance: ${currentState.cusdBalance || "0"}
- cEUR Balance: ${currentState.ceurBalance || "0"}
- CELO Balance: ${currentState.celoBalance || "0"}
- Recent Transactions: ${JSON.stringify(currentState.recentTransactions || [], null, 2)}
- Agent-specific data: ${JSON.stringify(currentState.agentData || {}, null, 2)}

Memory Context:
- Previous actions: ${memory.actions.length}
- Key learnings: ${memory.learnings.join(", ") || "None"}
- Last run: ${memory.lastRun}

Based on this state and your goal, decide:
1. Should you take action? (yes/no)
2. If yes, what action? (transfer/swap/stake/unstake/claim/vote/mint/etc)
3. What are the specific parameters?
4. Why are you making this decision?

Respond in JSON format:
{
  "action": "action_name_or_none",
  "params": {
    "key": "value"
  },
  "reasoning": "explanation of decision",
  "confidence": 0.0-1.0
}`;
    }
}
exports.AnthropicProvider = AnthropicProvider;
class LLMIntegration {
    constructor(provider) {
        this.provider = provider;
    }
    async generateDecision(agentType, goal, constraints, currentState, memory) {
        return await this.provider.generateDecision(agentType, goal, constraints, currentState, memory);
    }
    async explainAction(action, params, context) {
        return await this.provider.explainAction(action, params, context);
    }
    async validateAction(action, params, context) {
        return await this.provider.validateAction(action, params, context);
    }
    static createOpenAIProvider(apiKey, model) {
        return new OpenAIProvider(apiKey, model);
    }
    static createAnthropicProvider(apiKey, model) {
        return new AnthropicProvider(apiKey, model);
    }
}
exports.LLMIntegration = LLMIntegration;
//# sourceMappingURL=llm-integration.js.map