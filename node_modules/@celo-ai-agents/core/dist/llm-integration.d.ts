import { LLMResponse, AgentMemory } from "./types";
export interface LLMProvider {
    generateDecision(agentType: string, goal: string, constraints: string, currentState: any, memory: AgentMemory): Promise<LLMResponse>;
    explainAction(action: string, params: any, context: any): Promise<string>;
    validateAction(action: string, params: any, context: any): Promise<{
        isValid: boolean;
        reason?: string;
    }>;
}
export declare class OpenAIProvider implements LLMProvider {
    private client;
    constructor(apiKey: string, model?: string);
    generateDecision(agentType: string, goal: string, constraints: string, currentState: any, memory: AgentMemory): Promise<LLMResponse>;
    explainAction(action: string, params: any, context: any): Promise<string>;
    validateAction(action: string, params: any, context: any): Promise<{
        isValid: boolean;
        reason?: string;
    }>;
    private buildDecisionPrompt;
}
export declare class AnthropicProvider implements LLMProvider {
    private client;
    constructor(apiKey: string, model?: string);
    generateDecision(agentType: string, goal: string, constraints: string, currentState: any, memory: AgentMemory): Promise<LLMResponse>;
    explainAction(action: string, params: any, context: any): Promise<string>;
    validateAction(action: string, params: any, context: any): Promise<{
        isValid: boolean;
        reason?: string;
    }>;
    private buildDecisionPrompt;
}
export declare class LLMIntegration {
    private provider;
    constructor(provider: LLMProvider);
    generateDecision(agentType: string, goal: string, constraints: string, currentState: any, memory: AgentMemory): Promise<LLMResponse>;
    explainAction(action: string, params: any, context: any): Promise<string>;
    validateAction(action: string, params: any, context: any): Promise<{
        isValid: boolean;
        reason?: string;
    }>;
    static createOpenAIProvider(apiKey: string, model?: string): LLMProvider;
    static createAnthropicProvider(apiKey: string, model?: string): LLMProvider;
}
//# sourceMappingURL=llm-integration.d.ts.map