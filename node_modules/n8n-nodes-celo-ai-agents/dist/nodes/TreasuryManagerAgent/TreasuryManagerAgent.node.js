"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryManagerAgent = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const core_1 = require("@celo-ai-agents/core");
class TreasuryManagerAgent {
    constructor() {
        this.description = {
            displayName: 'Treasury Manager Agent',
            name: 'treasuryManagerAgent',
            group: ['transform'],
            version: 1,
            description: 'AI agent that manages organizational treasury with intelligent fund allocation',
            defaults: {
                name: 'Treasury Manager Agent',
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
                    displayName: 'Target Allocation',
                    name: 'targetAllocation',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: false,
                    },
                    default: {},
                    options: [
                        {
                            name: 'allocation',
                            displayName: 'Token Allocation',
                            values: [
                                {
                                    displayName: 'cUSD Percentage',
                                    name: 'cusdPercentage',
                                    type: 'number',
                                    default: 30,
                                    description: 'Target percentage of cUSD in treasury',
                                },
                                {
                                    displayName: 'cEUR Percentage',
                                    name: 'ceurPercentage',
                                    type: 'number',
                                    default: 50,
                                    description: 'Target percentage of cEUR in treasury',
                                },
                                {
                                    displayName: 'CELO Percentage',
                                    name: 'celoPercentage',
                                    type: 'number',
                                    default: 20,
                                    description: 'Target percentage of CELO in treasury',
                                },
                            ],
                        },
                    ],
                    description: 'Target allocation percentages for different tokens',
                },
                {
                    displayName: 'Rebalance Threshold',
                    name: 'rebalanceThreshold',
                    type: 'number',
                    default: 10,
                    description: 'Percentage deviation from target allocation that triggers rebalancing',
                },
                {
                    displayName: 'Daily Limit (CELO)',
                    name: 'dailyLimit',
                    type: 'number',
                    default: 1000,
                    description: 'Maximum amount the agent can spend per day',
                },
                {
                    displayName: 'Per-Transaction Limit (CELO)',
                    name: 'perTxLimit',
                    type: 'number',
                    default: 100,
                    description: 'Maximum amount the agent can spend per transaction',
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
                    displayName: 'Notification Webhook',
                    name: 'notificationWebhook',
                    type: 'string',
                    default: '',
                    description: 'Webhook URL to send notifications about treasury actions',
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
                const targetAllocation = this.getNodeParameter('targetAllocation.allocation', i);
                const rebalanceThreshold = this.getNodeParameter('rebalanceThreshold', i);
                const dailyLimit = this.getNodeParameter('dailyLimit', i);
                const perTxLimit = this.getNodeParameter('perTxLimit', i);
                const executionMode = this.getNodeParameter('executionMode', i);
                const notificationWebhook = this.getNodeParameter('notificationWebhook', i);
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
                // Create agent config with treasury-specific goal
                const goal = `Manage treasury with target allocation: ${targetAllocation.cusdPercentage}% cUSD, ${targetAllocation.ceurPercentage}% cEUR, ${targetAllocation.celoPercentage}% CELO. Rebalance when deviation exceeds ${rebalanceThreshold}%.`;
                const constraints = `Daily limit: ${dailyLimit} CELO, Per-tx limit: ${perTxLimit} CELO. Only execute swaps through approved protocols. Maintain minimum liquidity of 10% in each token.`;
                const agentConfig = {
                    goal,
                    constraints,
                    executionMode: executionMode,
                    spendingLimits: {
                        daily: BigInt(dailyLimit * 1e18),
                        perTx: BigInt(perTxLimit * 1e18),
                    },
                    whitelist: [],
                    blacklist: [],
                    permissions: [
                        'TRANSFER',
                        'SWAP',
                        'STAKE',
                        'UNSTAKE',
                        'CLAIM_REWARDS',
                    ],
                };
                // Register agent
                const agentId = BigInt(1);
                await agentEngine.registerAgent(agentId, agentConfig);
                // Execute agent
                const result = await agentEngine.executeAgent(agentId);
                // Send notification if webhook is provided
                if (notificationWebhook && result.executed) {
                    try {
                        await this.helpers.request({
                            method: 'POST',
                            url: notificationWebhook,
                            body: {
                                agent: 'Treasury Manager',
                                action: result.action,
                                reasoning: result.reasoning,
                                txHash: result.txHash,
                                timestamp: new Date().toISOString(),
                            },
                            json: true,
                        });
                    }
                    catch (error) {
                        console.log('Failed to send notification:', error);
                    }
                }
                // Prepare output
                const outputData = {
                    json: {
                        agentId: agentId.toString(),
                        agentType: 'TreasuryManager',
                        action: result.action,
                        params: result.params,
                        reasoning: result.reasoning,
                        confidence: result.confidence,
                        executed: result.executed,
                        txHash: result.txHash,
                        error: result.error,
                        targetAllocation,
                        rebalanceThreshold,
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
exports.TreasuryManagerAgent = TreasuryManagerAgent;
//# sourceMappingURL=TreasuryManagerAgent.node.js.map