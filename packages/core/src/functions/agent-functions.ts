import { CeloClient } from '../celo-client';
import { DecisionEngine } from '../decision-engine';
import { AgentEngine } from '../agent-engine';
import { AlchemyClient } from '../alchemy-client';
import { SecureTransactionManager } from '../secure-transaction-manager';
import { Address, Hash } from 'viem';
import { AgentConfig, AgentInfo, TransactionRequest } from '../types';

export interface AgentConfigParams {
  goal: string;
  constraints: string;
  executionMode: 'auto' | 'propose';
  spendingLimits: {
    daily: string;
    perTx: string;
  };
  whitelist?: Address[];
  blacklist?: Address[];
  permissions: string[];
}

export interface AgentExecutionResult {
  success: boolean;
  actions: Array<{
    type: string;
    description: string;
    transactionHash?: Hash;
    gasUsed?: bigint;
  }>;
  totalGasUsed: bigint;
  error?: string;
}

export interface AgentSecurityConfig {
  alchemyApiKey: string;
  alchemyPolicyId?: string;
  network: 'alfajores' | 'mainnet';
  maxRiskScore?: number;
  requireApproval?: boolean;
  enableSimulation?: boolean;
}

/**
 * Create and configure an AI agent
 */
export function createAgent(
  celoClient: CeloClient,
  agentId: bigint,
  config: AgentConfigParams
): AgentEngine {
  const decisionEngine = new DecisionEngine();
  const agentEngine = new AgentEngine(celoClient, decisionEngine);

  const agentConfig: AgentConfig = {
    goal: config.goal,
    constraints: config.constraints,
    executionMode: config.executionMode,
    spendingLimits: {
      daily: BigInt(config.spendingLimits.daily),
      perTx: BigInt(config.spendingLimits.perTx)
    },
    whitelist: config.whitelist || [],
    blacklist: config.blacklist || [],
    permissions: config.permissions
  };

  return agentEngine;
}

/**
 * Register an agent with the engine
 */
export async function registerAgent(
  agentEngine: AgentEngine,
  agentId: bigint,
  config: AgentConfigParams
): Promise<void> {
  const agentConfig: AgentConfig = {
    goal: config.goal,
    constraints: config.constraints,
    executionMode: config.executionMode,
    spendingLimits: {
      daily: BigInt(config.spendingLimits.daily),
      perTx: BigInt(config.spendingLimits.perTx)
    },
    whitelist: config.whitelist || [],
    blacklist: config.blacklist || [],
    permissions: config.permissions
  };

  await agentEngine.registerAgent(agentId, agentConfig);
}

/**
 * Execute agent with security checks
 */
export async function executeAgentWithSecurity(
  agentEngine: AgentEngine,
  securityConfig: AgentSecurityConfig,
  agentId: bigint,
  context?: any
): Promise<AgentExecutionResult> {
  const alchemyClient = new AlchemyClient({
    apiKey: securityConfig.alchemyApiKey,
    policyId: securityConfig.alchemyPolicyId,
    network: securityConfig.network
  });

  const secureManager = new SecureTransactionManager(
    alchemyClient,
    agentEngine['client'], // Access private client
    {
      maxRiskScore: securityConfig.maxRiskScore || 50,
      requireApproval: securityConfig.requireApproval !== false,
      enableSimulation: securityConfig.enableSimulation !== false,
      enableGasOptimization: true
    }
  );

  try {
    const result = await agentEngine.executeAgent(agentId);
    
    return {
      success: true,
      actions: [{
        type: result.action || 'unknown',
        description: result.reasoning || 'Agent executed successfully',
        transactionHash: result.txHash,
        gasUsed: BigInt(0) // Would need to be calculated
      }],
      totalGasUsed: BigInt(0)
    };
  } catch (error) {
    return {
      success: false,
      actions: [],
      totalGasUsed: BigInt(0),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a treasury manager agent
 */
export function createTreasuryManagerAgent(
  celoClient: CeloClient,
  agentId: bigint,
  targetAllocation: {
    cusdPercentage: number;
    ceurPercentage: number;
    celoPercentage: number;
  },
  rebalanceThreshold: number,
  spendingLimits: {
    daily: string;
    perTx: string;
  }
): AgentEngine {
  const goal = `Manage treasury with target allocation: ${targetAllocation.cusdPercentage}% cUSD, ${targetAllocation.ceurPercentage}% cEUR, ${targetAllocation.celoPercentage}% CELO. Rebalance when deviation exceeds ${rebalanceThreshold}%.`;
  
  const constraints = `Daily limit: ${spendingLimits.daily} CELO, Per-tx limit: ${spendingLimits.perTx} CELO. Only execute swaps through approved protocols. Maintain minimum liquidity of 10% in each token.`;

  return createAgent(celoClient, agentId, {
    goal,
    constraints,
    executionMode: 'auto',
    spendingLimits,
    permissions: ['TRANSFER', 'SWAP', 'STAKE', 'UNSTAKE', 'CLAIM_REWARDS']
  });
}

/**
 * Create a donation splitter agent
 */
export function createDonationSplitterAgent(
  celoClient: CeloClient,
  agentId: bigint,
  recipients: Array<{
    address: Address;
    percentage: number;
    name?: string;
  }>,
  minimumAmount: string,
  spendingLimits: {
    daily: string;
    perTx: string;
  }
): AgentEngine {
  const recipientsList = recipients.map(r => `${r.name || r.address}: ${r.percentage}%`).join(', ');
  const goal = `Automatically split incoming donations among recipients: ${recipientsList}. Only process donations above ${minimumAmount} CELO.`;
  
  const constraints = `Daily limit: ${spendingLimits.daily} CELO, Per-tx limit: ${spendingLimits.perTx} CELO. Only process donations to whitelisted recipients. Generate personalized thank you messages.`;

  return createAgent(celoClient, agentId, {
    goal,
    constraints,
    executionMode: 'auto',
    spendingLimits,
    whitelist: recipients.map(r => r.address),
    permissions: ['TRANSFER', 'SPLIT_DONATIONS', 'SEND_NOTIFICATIONS']
  });
}

/**
 * Create an NFT minter agent
 */
export function createNFTMinterAgent(
  celoClient: CeloClient,
  agentId: bigint,
  contractAddress: Address,
  triggerConditions: string,
  spendingLimits: {
    daily: string;
    perTx: string;
  }
): AgentEngine {
  const goal = `Mint NFTs to ${contractAddress} when: ${triggerConditions}. Generate appropriate metadata and ensure proper distribution.`;
  
  const constraints = `Daily limit: ${spendingLimits.daily} CELO, Per-tx limit: ${spendingLimits.perTx} CELO. Only mint to verified recipients. Maintain metadata quality standards.`;

  return createAgent(celoClient, agentId, {
    goal,
    constraints,
    executionMode: 'auto',
    spendingLimits,
    permissions: ['MINT_NFT', 'GENERATE_METADATA', 'VALIDATE_ELIGIBILITY']
  });
}

/**
 * Get agent information
 */
export async function getAgentInfo(
  agentEngine: AgentEngine,
  agentId: bigint
): Promise<AgentInfo | null> {
  try {
    // This would require adding a getAgentInfo method to AgentEngine
    // For now, return null as it's not implemented
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Update agent configuration
 */
export async function updateAgentConfig(
  agentEngine: AgentEngine,
  agentId: bigint,
  config: Partial<AgentConfigParams>
): Promise<boolean> {
  try {
    // This would require adding an update method to AgentEngine
    // For now, return false as it's not implemented
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Pause agent execution
 */
export async function pauseAgent(
  agentEngine: AgentEngine,
  agentId: bigint
): Promise<boolean> {
  try {
    // This would require adding a pause method to AgentEngine
    // For now, return false as it's not implemented
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Resume agent execution
 */
export async function resumeAgent(
  agentEngine: AgentEngine,
  agentId: bigint
): Promise<boolean> {
  try {
    // This would require adding a resume method to AgentEngine
    // For now, return false as it's not implemented
    return false;
  } catch (error) {
    return false;
  }
}
