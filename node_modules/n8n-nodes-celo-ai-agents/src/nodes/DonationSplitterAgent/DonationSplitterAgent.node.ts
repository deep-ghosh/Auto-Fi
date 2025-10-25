import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { CeloClient, DecisionEngine, AgentEngine, AgentConfig } from '@celo-ai-agents/core';

export class DonationSplitterAgent implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Donation Splitter Agent',
    name: 'donationSplitterAgent',
    group: ['transform'],
    version: 1,
    description: 'AI agent that automatically splits incoming donations to multiple recipients',
    defaults: {
      name: 'Donation Splitter Agent',
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
        displayName: 'Split Configuration',
        name: 'splitConfig',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'recipients',
            displayName: 'Recipients',
            values: [
              {
                displayName: 'Address',
                name: 'address',
                type: 'string',
                default: '',
                description: 'Recipient wallet address',
              },
              {
                displayName: 'Percentage',
                name: 'percentage',
                type: 'number',
                default: 50,
                description: 'Percentage of donation to send to this recipient',
              },
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
                description: 'Human-readable name for this recipient',
              },
            ],
          },
        ],
        description: 'Configure how donations should be split among recipients',
      },
      {
        displayName: 'Minimum Donation Amount',
        name: 'minimumAmount',
        type: 'number',
        default: 0.01,
        description: 'Minimum donation amount to trigger splitting',
      },
      {
        displayName: 'Supported Tokens',
        name: 'supportedTokens',
        type: 'multiOptions',
        options: [
          {
            name: 'CELO',
            value: 'CELO',
          },
          {
            name: 'cUSD',
            value: 'cUSD',
          },
          {
            name: 'cEUR',
            value: 'cEUR',
          },
        ],
        default: ['CELO', 'cUSD'],
        description: 'Tokens that this agent can process',
      },
      {
        displayName: 'Daily Limit (CELO)',
        name: 'dailyLimit',
        type: 'number',
        default: 500,
        description: 'Maximum amount the agent can process per day',
      },
      {
        displayName: 'Per-Transaction Limit (CELO)',
        name: 'perTxLimit',
        type: 'number',
        default: 50,
        description: 'Maximum amount the agent can process per transaction',
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
        displayName: 'Thank You Message Template',
        name: 'thankYouTemplate',
        type: 'string',
        typeOptions: {
          rows: 3,
        },
        default: 'Thank you for your donation of {{amount}} {{token}}! Your contribution has been split and sent to our partners.',
        description: 'Template for thank you messages (use {{amount}} and {{token}} variables)',
      },
      {
        displayName: 'Notification Webhook',
        name: 'notificationWebhook',
        type: 'string',
        default: '',
        description: 'Webhook URL to send notifications about donation processing',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        // Get credentials
        const celoCredentials = await this.getCredentials('celoWallet');
        const openAICredentials = await this.getCredentials('openAI');

        if (!celoCredentials || !openAICredentials) {
          throw new NodeOperationError(this.getNode(), 'Required credentials not found');
        }

        // Get parameters
        const splitConfig = this.getNodeParameter('splitConfig.recipients', i) as any[];
        const minimumAmount = this.getNodeParameter('minimumAmount', i) as number;
        const supportedTokens = this.getNodeParameter('supportedTokens', i) as string[];
        const dailyLimit = this.getNodeParameter('dailyLimit', i) as number;
        const perTxLimit = this.getNodeParameter('perTxLimit', i) as number;
        const executionMode = this.getNodeParameter('executionMode', i) as string;
        const thankYouTemplate = this.getNodeParameter('thankYouTemplate', i) as string;
        const notificationWebhook = this.getNodeParameter('notificationWebhook', i) as string;

        // Validate split configuration
        const totalPercentage = splitConfig.reduce((sum, recipient) => sum + recipient.percentage, 0);
        if (totalPercentage !== 100) {
          throw new NodeOperationError(this.getNode(), `Split percentages must total 100%, got ${totalPercentage}%`);
        }

        // Initialize Celo client
        const client = new CeloClient(
          celoCredentials.privateKey as string,
          celoCredentials.network as 'alfajores' | 'mainnet',
          celoCredentials.rpcUrl as string
        );

        // Set contract addresses if provided
        if (celoCredentials.agentRegistryAddress) {
          client.setContractAddresses({
            agentRegistry: celoCredentials.agentRegistryAddress as `0x${string}`,
            agentTreasury: celoCredentials.agentTreasuryAddress as `0x${string}`,
            donationSplitter: celoCredentials.donationSplitterAddress as `0x${string}`,
            yieldAggregator: celoCredentials.yieldAggregatorAddress as `0x${string}`,
            masterTrading: celoCredentials.masterTradingAddress as `0x${string}`,
            attendanceNFT: celoCredentials.attendanceNFTAddress as `0x${string}`,
          });
        }

        // Initialize decision engine
        const decisionEngine = new DecisionEngine();

        // Initialize agent engine
        const agentEngine = new AgentEngine(client, decisionEngine);

        // Create agent config with donation-specific goal
        const recipientsList = splitConfig.map(r => `${r.name || r.address}: ${r.percentage}%`).join(', ');
        const goal = `Automatically split incoming donations among recipients: ${recipientsList}. Only process donations above ${minimumAmount} CELO. Support tokens: ${supportedTokens.join(', ')}.`;
        
        const constraints = `Daily limit: ${dailyLimit} CELO, Per-tx limit: ${perTxLimit} CELO. Only process donations to whitelisted recipients. Generate personalized thank you messages.`;

        const agentConfig: AgentConfig = {
          goal,
          constraints,
          executionMode: executionMode as 'auto' | 'propose',
          spendingLimits: {
            daily: BigInt(dailyLimit * 1e18),
            perTx: BigInt(perTxLimit * 1e18),
          },
          whitelist: splitConfig.map(r => r.address),
          blacklist: [],
          permissions: [
            'TRANSFER',
            'MINT_NFT',
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
                agent: 'Donation Splitter',
                action: result.action,
                reasoning: result.reasoning,
                txHash: result.txHash,
                splitConfig,
                timestamp: new Date().toISOString(),
              },
              json: true,
            });
          } catch (error) {
            console.log('Failed to send notification:', error);
          }
        }

        // Prepare output
        const outputData: INodeExecutionData = {
          json: {
            agentId: agentId.toString(),
            agentType: 'DonationSplitter',
            action: result.action,
            params: result.params,
            reasoning: result.reasoning,
            confidence: result.confidence,
            executed: result.executed,
            txHash: result.txHash,
            error: result.error,
            splitConfig,
            minimumAmount,
            supportedTokens,
            thankYouTemplate,
            timestamp: new Date().toISOString(),
          },
        };

        returnData.push(outputData);

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString(),
            },
          });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
