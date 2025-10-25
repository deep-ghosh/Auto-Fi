"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CeloAgentBase = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const core_1 = require("@celo-ai-agents/core");
class CeloAgentBase {
    constructor() {
        this.description = {
            displayName: 'Celo AI Agent Base',
            name: 'celoAgentBase',
            group: ['transform'],
            version: 1,
            description: 'Base class for Celo AI agents',
            defaults: {
                name: 'Celo Agent',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'celoWallet',
                    required: true,
                },
                {
                    name: 'openAI',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Agent Goal',
                    name: 'goal',
                    type: 'string',
                    typeOptions: {
                        rows: 4,
                    },
                    default: '',
                    description: 'Natural language description of agent goal',
                },
                {
                    displayName: 'Constraints',
                    name: 'constraints',
                    type: 'string',
                    typeOptions: {
                        rows: 4,
                    },
                    default: '',
                    description: 'Safety constraints and limits',
                },
                {
                    displayName: 'Execution Mode',
                    name: 'executionMode',
                    type: 'options',
                    options: [
                        {
                            name: 'Auto Execute',
                            value: 'auto',
                        },
                        {
                            name: 'Propose Only',
                            value: 'propose',
                        },
                    ],
                    default: 'propose',
                    description: 'Whether to execute actions automatically or just propose them',
                },
                {
                    displayName: 'Daily Limit (CELO)',
                    name: 'dailyLimit',
                    type: 'number',
                    default: 100,
                    description: 'Maximum amount the agent can spend per day',
                },
                {
                    displayName: 'Per-Transaction Limit (CELO)',
                    name: 'perTxLimit',
                    type: 'number',
                    default: 10,
                    description: 'Maximum amount the agent can spend per transaction',
                },
                {
                    displayName: 'Whitelist Addresses',
                    name: 'whitelist',
                    type: 'string',
                    typeOptions: {
                        rows: 3,
                    },
                    default: '',
                    description: 'Comma-separated list of whitelisted addresses',
                },
                {
                    displayName: 'Blacklist Addresses',
                    name: 'blacklist',
                    type: 'string',
                    typeOptions: {
                        rows: 3,
                    },
                    default: '',
                    description: 'Comma-separated list of blacklisted addresses',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                // Get credentials
                const celoCredentials = await this.getCredentials('celoWallet');
                const openAICredentials = await this.getCredentials('openAI');
                if (!celoCredentials || !openAICredentials) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Required credentials not found');
                }
                // Get parameters
                const goal = this.getNodeParameter('goal', i);
                const constraints = this.getNodeParameter('constraints', i);
                const executionMode = this.getNodeParameter('executionMode', i);
                const dailyLimit = this.getNodeParameter('dailyLimit', i);
                const perTxLimit = this.getNodeParameter('perTxLimit', i);
                const whitelistStr = this.getNodeParameter('whitelist', i);
                const blacklistStr = this.getNodeParameter('blacklist', i);
                // Parse whitelist and blacklist
                const whitelist = whitelistStr
                    ? whitelistStr.split(',').map(addr => addr.trim()).filter(addr => addr)
                    : [];
                const blacklist = blacklistStr
                    ? blacklistStr.split(',').map(addr => addr.trim()).filter(addr => addr)
                    : [];
                // Initialize Celo client
                const client = new core_1.CeloClient(celoCredentials.privateKey, celoCredentials.network, celoCredentials.rpcUrl);
                // Set contract addresses if provided
                if (celoCredentials.agentRegistryAddress) {
                    client.setContractAddresses({
                        agentRegistry: celoCredentials.agentRegistryAddress,
                        agentTreasury: celoCredentials.agentTreasuryAddress,
                        donationSplitter: celoCredentials.donationSplitterAddress,
                        yieldAggregator: celoCredentials.yieldAggregatorAddress,
                        masterTrading: celoCredentials.masterTradingAddress,
                        attendanceNFT: celoCredentials.attendanceNFTAddress,
                    });
                }
                // Initialize decision engine
                const decisionEngine = new core_1.DecisionEngine();
                // Initialize agent engine
                const agentEngine = new core_1.AgentEngine(client, decisionEngine);
                // Create agent config
                const agentConfig = {
                    goal,
                    constraints,
                    executionMode: executionMode,
                    spendingLimits: {
                        daily: BigInt(dailyLimit * 1e18), // Convert to wei
                        perTx: BigInt(perTxLimit * 1e18),
                    },
                    whitelist: whitelist,
                    blacklist: blacklist,
                    permissions: [
                        'TRANSFER',
                        'SWAP',
                        'STAKE',
                        'UNSTAKE',
                        'CLAIM_REWARDS',
                        'VOTE',
                        'MINT_NFT',
                    ],
                };
                // Register agent (this would typically be done once, not on every execution)
                const agentId = BigInt(1); // In a real implementation, this would be retrieved or registered
                await agentEngine.registerAgent(agentId, agentConfig);
                // Execute agent
                const result = await agentEngine.executeAgent(agentId);
                // Prepare output
                const outputData = {
                    json: {
                        agentId: agentId.toString(),
                        action: result.action,
                        params: result.params,
                        reasoning: result.reasoning,
                        confidence: result.confidence,
                        executed: result.executed,
                        txHash: result.txHash,
                        error: result.error,
                        timestamp: new Date().toISOString(),
                    },
                };
                returnData.push(outputData);
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error instanceof Error ? error.message : 'Unknown error',
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
                else {
                    throw error;
                }
            }
        }
        return [returnData];
    }
}
exports.CeloAgentBase = CeloAgentBase;
//# sourceMappingURL=CeloAgentBase.node.js.map