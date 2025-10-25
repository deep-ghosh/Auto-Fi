"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentEngine = void 0;
const decision_engine_1 = require("./decision-engine");
class AgentEngine {
    constructor(client, decisionEngine) {
        this.memory = new Map();
        this.configs = new Map();
        this.client = client;
        this.decisionEngine = decisionEngine || new decision_engine_1.DecisionEngine();
    }
    async registerAgent(agentId, config) {
        this.configs.set(agentId, config);
        this.memory.set(agentId, {
            agentId,
            observations: [],
            actions: [],
            learnings: [],
            lastRun: new Date()
        });
    }
    async executeAgent(agentId) {
        const config = this.configs.get(agentId);
        const memory = this.memory.get(agentId);
        if (!config || !memory) {
            throw new Error(`Agent ${agentId} not registered`);
        }
        try {
            const currentState = await this.observeState(agentId);
            const decision = await this.decisionEngine.generateDecision(agentId, currentState, memory);
            const validation = this.validateAction(decision.action, decision.params, currentState);
            if (!validation.isValid) {
                return {
                    action: decision.action,
                    params: decision.params,
                    reasoning: decision.reasoning,
                    confidence: decision.confidence,
                    executed: false,
                    error: validation.reason
                };
            }
            let txHash;
            if (decision.action !== "none") {
                txHash = await this.executeAction(agentId, decision.action, decision.params);
            }
            this.updateMemory(agentId, currentState, decision, txHash);
            return {
                action: decision.action,
                params: decision.params,
                reasoning: decision.reasoning,
                confidence: decision.confidence,
                executed: true,
                txHash
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            memory.actions.push({
                timestamp: new Date(),
                type: "error",
                params: { error: errorMessage },
                result: null,
                success: false
            });
            return {
                action: "none",
                params: {},
                reasoning: "Error occurred during execution",
                confidence: 0,
                executed: false,
                error: errorMessage
            };
        }
    }
    async observeState(agentId) {
        const config = this.configs.get(agentId);
        if (!config)
            throw new Error("Agent not configured");
        const agentWallet = await this.client.getAddresses().then(addrs => addrs[0]);
        const celoBalance = await this.client.getBalance(agentWallet);
        const cusdBalance = await this.client.getTokenBalance(this.client.getNetworkConfig().tokens.cUSD, agentWallet);
        const ceurBalance = await this.client.getTokenBalance(this.client.getNetworkConfig().tokens.cEUR, agentWallet);
        const recentTransactions = await this.client.getTransactionHistory(agentWallet, undefined, undefined).then(txs => txs.slice(0, 10));
        const agentData = await this.getAgentSpecificData(agentId);
        return {
            wallet: agentWallet,
            celoBalance: celoBalance.toString(),
            cusdBalance: cusdBalance.toString(),
            ceurBalance: ceurBalance.toString(),
            recentTransactions: recentTransactions.map(tx => ({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value.toString(),
                timestamp: tx.timestamp
            })),
            agentData
        };
    }
    async getAgentSpecificData(agentId) {
        try {
            const agentInfo = await this.client.readContract(this.client.getNetworkConfig().contracts.agentRegistry, [
                {
                    name: "getAgent",
                    type: "function",
                    stateMutability: "view",
                    inputs: [{ name: "agentId", type: "uint256" }],
                    outputs: [
                        { name: "agentId", type: "uint256" },
                        { name: "owner", type: "address" },
                        { name: "agentType", type: "string" },
                        { name: "agentWallet", type: "address" },
                        { name: "dailyLimit", type: "uint256" },
                        { name: "perTxLimit", type: "uint256" },
                        { name: "dailySpent", type: "uint256" },
                        { name: "isActive", type: "bool" }
                    ]
                }
            ], "getAgent", [agentId]);
            return {
                agentType: agentInfo[2],
                dailyLimit: agentInfo[4].toString(),
                perTxLimit: agentInfo[5].toString(),
                dailySpent: agentInfo[6].toString(),
                isActive: agentInfo[7]
            };
        }
        catch (error) {
            return { error: "Failed to get agent data" };
        }
    }
    async executeAction(agentId, action, params) {
        const config = this.configs.get(agentId);
        if (!config)
            throw new Error("Agent not configured");
        switch (action) {
            case "transfer":
                return await this.executeTransfer(agentId, params);
            case "swap":
                return await this.executeSwap(agentId, params);
            case "stake":
                return await this.executeStake(agentId, params);
            case "unstake":
                return await this.executeUnstake(agentId, params);
            case "claim":
                return await this.executeClaim(agentId, params);
            case "buy":
                return await this.executeBuy(agentId, params);
            case "sell":
                return await this.executeSell(agentId, params);
            case "request":
                return await this.executeRequest(agentId, params);
            case "mint":
                return await this.executeMint(agentId, params);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    async executeTransfer(agentId, params) {
        const { token, to, amount } = params;
        if (token === this.client.getNetworkConfig().tokens.CELO) {
            return await this.client.sendNativeToken(to, BigInt(amount));
        }
        else {
            return await this.client.sendToken(token, to, BigInt(amount));
        }
    }
    async executeSwap(agentId, params) {
        const { protocol, tokenIn, tokenOut, amountIn } = params;
        throw new Error("Swap execution not implemented yet");
    }
    async executeStake(agentId, params) {
        const { protocol, token, amount } = params;
        return await this.client.writeContract(this.client.getNetworkConfig().contracts.yieldAggregator, [
            {
                name: "depositToProtocol",
                type: "function",
                stateMutability: "nonpayable",
                inputs: [
                    { name: "agentId", type: "uint256" },
                    { name: "protocolId", type: "bytes32" },
                    { name: "token", type: "address" },
                    { name: "amount", type: "uint256" }
                ],
                outputs: [{ name: "shares", type: "uint256" }]
            }
        ], "depositToProtocol", [agentId, protocol, token, BigInt(amount)]);
    }
    async executeUnstake(agentId, params) {
        const { protocol, token, shares } = params;
        return await this.client.writeContract(this.client.getNetworkConfig().contracts.yieldAggregator, [
            {
                name: "withdrawFromProtocol",
                type: "function",
                stateMutability: "nonpayable",
                inputs: [
                    { name: "agentId", type: "uint256" },
                    { name: "protocolId", type: "bytes32" },
                    { name: "token", type: "address" },
                    { name: "shares", type: "uint256" }
                ],
                outputs: [{ name: "amount", type: "uint256" }]
            }
        ], "withdrawFromProtocol", [agentId, protocol, token, BigInt(shares)]);
    }
    async executeClaim(agentId, params) {
        const { protocol } = params;
        return await this.client.writeContract(this.client.getNetworkConfig().contracts.yieldAggregator, [
            {
                name: "claimRewards",
                type: "function",
                stateMutability: "nonpayable",
                inputs: [
                    { name: "agentId", type: "uint256" },
                    { name: "protocolId", type: "bytes32" }
                ],
                outputs: [{ name: "rewards", type: "uint256" }]
            }
        ], "claimRewards", [agentId, protocol]);
    }
    async executeBuy(agentId, params) {
        const { token, amount, maxPrice, description } = params;
        return await this.client.writeContract(this.client.getNetworkConfig().contracts.masterTrading, [
            {
                name: "createBuyOrder",
                type: "function",
                stateMutability: "nonpayable",
                inputs: [
                    { name: "tokenOut", type: "address" },
                    { name: "amountOut", type: "uint256" },
                    { name: "maxAmountIn", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                    { name: "description", type: "string" }
                ],
                outputs: [{ name: "orderId", type: "uint256" }]
            }
        ], "createBuyOrder", [token, BigInt(amount), BigInt(maxPrice), BigInt(Date.now() + 86400000), description || "Agent buy order"]);
    }
    async executeSell(agentId, params) {
        const { token, amount, minPrice, description } = params;
        return await this.client.writeContract(this.client.getNetworkConfig().contracts.masterTrading, [
            {
                name: "createSellOrder",
                type: "function",
                stateMutability: "nonpayable",
                inputs: [
                    { name: "tokenIn", type: "address" },
                    { name: "amountIn", type: "uint256" },
                    { name: "minAmountOut", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                    { name: "description", type: "string" }
                ],
                outputs: [{ name: "orderId", type: "uint256" }]
            }
        ], "createSellOrder", [token, BigInt(amount), BigInt(minPrice), BigInt(Date.now() + 86400000), description || "Agent sell order"]);
    }
    async executeRequest(agentId, params) {
        const { tokenIn, tokenOut, amountIn, amountOut, description } = params;
        return await this.client.writeContract(this.client.getNetworkConfig().contracts.masterTrading, [
            {
                name: "createRequestOrder",
                type: "function",
                stateMutability: "nonpayable",
                inputs: [
                    { name: "tokenIn", type: "address" },
                    { name: "tokenOut", type: "address" },
                    { name: "amountIn", type: "uint256" },
                    { name: "amountOut", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                    { name: "description", type: "string" }
                ],
                outputs: [{ name: "orderId", type: "uint256" }]
            }
        ], "createRequestOrder", [tokenIn, tokenOut, BigInt(amountIn), BigInt(amountOut), BigInt(Date.now() + 86400000), description || "Agent request order"]);
    }
    async executeMint(agentId, params) {
        const { recipient, metadataURI, soulbound } = params;
        return await this.client.writeContract(this.client.getNetworkConfig().contracts.attendanceNFT, [
            {
                name: "mintAttendanceNFT",
                type: "function",
                stateMutability: "nonpayable",
                inputs: [
                    { name: "agentId", type: "uint256" },
                    { name: "recipient", type: "address" },
                    { name: "metadataURI", type: "string" },
                    { name: "soulbound", type: "bool" }
                ],
                outputs: [{ name: "tokenId", type: "uint256" }]
            }
        ], "mintAttendanceNFT", [agentId, recipient, metadataURI, soulbound]);
    }
    updateMemory(agentId, currentState, decision, txHash) {
        const memory = this.memory.get(agentId);
        if (!memory)
            return;
        memory.observations.push({
            timestamp: new Date(),
            type: "state",
            data: currentState
        });
        memory.actions.push({
            timestamp: new Date(),
            type: decision.action,
            params: decision.params,
            result: txHash ? { txHash } : null,
            success: !!txHash
        });
        if (txHash && decision.confidence > 0.8) {
            memory.learnings.push(`Successful ${decision.action} with confidence ${decision.confidence}`);
        }
        memory.lastRun = new Date();
        if (memory.observations.length > 100) {
            memory.observations = memory.observations.slice(-100);
        }
        if (memory.actions.length > 100) {
            memory.actions = memory.actions.slice(-100);
        }
        if (memory.learnings.length > 50) {
            memory.learnings = memory.learnings.slice(-50);
        }
    }
    getAgentMemory(agentId) {
        return this.memory.get(agentId);
    }
    getAgentConfig(agentId) {
        return this.configs.get(agentId);
    }
    updateAgentConfig(agentId, config) {
        const currentConfig = this.configs.get(agentId);
        if (currentConfig) {
            this.configs.set(agentId, { ...currentConfig, ...config });
        }
    }
    validateAction(action, params, currentState) {
        switch (action) {
            case 'transfer':
                if (!params.to || !params.amount) {
                    return { isValid: false, reason: 'Missing recipient or amount' };
                }
                if (params.amount <= 0) {
                    return { isValid: false, reason: 'Amount must be positive' };
                }
                if (params.amount > currentState.cusdBalance) {
                    return { isValid: false, reason: 'Insufficient balance' };
                }
                break;
            case 'stake':
                if (!params.protocol || !params.amount) {
                    return { isValid: false, reason: 'Missing protocol or amount' };
                }
                if (params.amount <= 0) {
                    return { isValid: false, reason: 'Amount must be positive' };
                }
                break;
            case 'swap':
                if (!params.tokenIn || !params.tokenOut || !params.amountIn) {
                    return { isValid: false, reason: 'Missing swap parameters' };
                }
                break;
            case 'buy':
                if (!params.token || !params.amount || !params.maxPrice) {
                    return { isValid: false, reason: 'Missing token, amount, or max price' };
                }
                if (params.amount <= 0 || params.maxPrice <= 0) {
                    return { isValid: false, reason: 'Amount and max price must be positive' };
                }
                break;
            case 'sell':
                if (!params.token || !params.amount || !params.minPrice) {
                    return { isValid: false, reason: 'Missing token, amount, or min price' };
                }
                if (params.amount <= 0 || params.minPrice <= 0) {
                    return { isValid: false, reason: 'Amount and min price must be positive' };
                }
                break;
            case 'request':
                if (!params.tokenIn || !params.tokenOut || !params.amountIn || !params.amountOut) {
                    return { isValid: false, reason: 'Missing token addresses or amounts' };
                }
                if (params.amountIn <= 0 || params.amountOut <= 0) {
                    return { isValid: false, reason: 'Amounts must be positive' };
                }
                break;
            case 'mint':
                if (!params.recipient || !params.metadataURI) {
                    return { isValid: false, reason: 'Missing recipient or metadata URI' };
                }
                break;
            case 'none':
                return { isValid: true };
            default:
                return { isValid: false, reason: `Unknown action: ${action}` };
        }
        return { isValid: true };
    }
}
exports.AgentEngine = AgentEngine;
//# sourceMappingURL=agent-engine.js.map