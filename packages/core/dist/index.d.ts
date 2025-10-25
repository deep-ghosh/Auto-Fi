export { CeloClient } from "./celo-client";
export { BlockScanner } from "./event-monitor";
export { DecisionEngine } from "./decision-engine";
export { AgentEngine } from "./agent-engine";
export type { CeloNetworkConfig, AgentInfo, Transaction, TokenTransfer, Event, BlockEvents, TransactionRequest, TransactionReceipt, SimulationResult, ValidationResult, GasEstimate, AgentMemory, Observation, Action, AgentConfig, DecisionResponse, AgentAction, Donation, DonationSplit, YieldPosition, GovernanceVote, Proposal } from "./types";
export declare const ALFAJORES_CONFIG: {
    chainId: number;
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    contracts: {
        agentRegistry: string;
        agentTreasury: string;
        donationSplitter: string;
        yieldAggregator: string;
        masterTrading: string;
        attendanceNFT: string;
    };
    tokens: {
        cUSD: string;
        cEUR: string;
        cREAL: string;
        CELO: string;
    };
    defiProtocols: {
        moola: string;
        ubeswap: string;
        curve: string;
    };
};
export declare const MAINNET_CONFIG: {
    chainId: number;
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    contracts: {
        agentRegistry: string;
        agentTreasury: string;
        donationSplitter: string;
        yieldAggregator: string;
        masterTrading: string;
        attendanceNFT: string;
    };
    tokens: {
        cUSD: string;
        cEUR: string;
        cREAL: string;
        CELO: string;
    };
    defiProtocols: {
        moola: string;
        ubeswap: string;
        curve: string;
    };
};
//# sourceMappingURL=index.d.ts.map