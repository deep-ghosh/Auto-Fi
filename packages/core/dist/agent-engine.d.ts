import { Hash } from "viem";
import { CeloClient } from "./celo-client";
import { DecisionEngine } from "./decision-engine";
import { AgentMemory, AgentConfig } from "./types";
export declare class AgentEngine {
    private client;
    private decisionEngine;
    private memory;
    private configs;
    constructor(client: CeloClient, decisionEngine?: DecisionEngine);
    registerAgent(agentId: bigint, config: AgentConfig): Promise<void>;
    executeAgent(agentId: bigint): Promise<{
        action: string;
        params: any;
        reasoning: string;
        confidence: number;
        executed: boolean;
        txHash?: Hash;
        error?: string;
    }>;
    private observeState;
    private getAgentSpecificData;
    private executeAction;
    private executeTransfer;
    private executeSwap;
    private executeStake;
    private executeUnstake;
    private executeClaim;
    private executeBuy;
    private executeSell;
    private executeRequest;
    private executeMint;
    private updateMemory;
    getAgentMemory(agentId: bigint): AgentMemory | undefined;
    getAgentConfig(agentId: bigint): AgentConfig | undefined;
    updateAgentConfig(agentId: bigint, config: Partial<AgentConfig>): void;
    private validateAction;
}
//# sourceMappingURL=agent-engine.d.ts.map