import { CeloClient } from '../celo-client';
import { Address, Hash } from 'viem';
import { CeloNetworkConfig } from '../types';

export interface CeloAgentConfig {
  privateKey: string;
  network: 'alfajores' | 'mainnet';
  rpcUrl?: string;
  alchemyApiKey?: string;
  alchemyPolicyId?: string;
}

export interface TokenBalance {
  token: string;
  balance: string;
  decimals: number;
  symbol: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: Hash;
  gasUsed?: bigint;
  error?: string;
}

/**
 * Create a new Celo agent instance
 */
export function createCeloAgent(config: CeloAgentConfig): CeloClient {
  return new CeloClient(
    config.privateKey,
    config.network,
    config.rpcUrl
  );
}

/**
 * Get token balance for an address
 */
export async function getTokenBalance(
  client: CeloClient,
  address: Address,
  token: Address
): Promise<string> {
  const balance = await client.getTokenBalance(address, token);
  return balance.toString();
}

/**
 * Get native CELO balance
 */
export async function getCELOBalance(
  client: CeloClient,
  address: Address
): Promise<string> {
  const balance = await client.getBalance(address);
  return balance.toString();
}

/**
 * Send native CELO tokens
 */
export async function sendCELO(
  client: CeloClient,
  to: Address,
  amount: string
): Promise<TransactionResult> {
  try {
    const hash = await client.sendNativeToken(to, BigInt(amount));
    return {
      success: true,
      transactionHash: hash
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send ERC20 tokens
 */
export async function sendToken(
  client: CeloClient,
  token: Address,
  to: Address,
  amount: string
): Promise<TransactionResult> {
  try {
    const hash = await client.sendToken(token, to, BigInt(amount));
    return {
      success: true,
      transactionHash: hash
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get network configuration
 */
export function getNetworkConfig(client: CeloClient): CeloNetworkConfig {
  return client.getNetworkConfig();
}

/**
 * Get all token balances for an address
 */
export async function getAllTokenBalances(
  client: CeloClient,
  address: Address
): Promise<TokenBalance[]> {
  const network = client.getNetworkConfig();
  const balances: TokenBalance[] = [];

  // Get CELO balance
  const celoBalance = await client.getBalance(address);
  balances.push({
    token: network.tokens.CELO,
    balance: celoBalance.toString(),
    decimals: 18,
    symbol: 'CELO'
  });

  // Get cUSD balance
  const cusdBalance = await client.getTokenBalance(address, network.tokens.cUSD);
  balances.push({
    token: network.tokens.cUSD,
    balance: cusdBalance.toString(),
    decimals: 18,
    symbol: 'cUSD'
  });

  // Get cEUR balance
  const ceurBalance = await client.getTokenBalance(address, network.tokens.cEUR);
  balances.push({
    token: network.tokens.cEUR,
    balance: ceurBalance.toString(),
    decimals: 18,
    symbol: 'cEUR'
  });

  return balances;
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  client: CeloClient,
  to: Address,
  value: string,
  data?: string
): Promise<bigint> {
  return await client.estimateGas({
    to,
    value: BigInt(value),
    data: data as `0x${string}` || '0x'
  });
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  client: CeloClient,
  hash: Hash
): Promise<boolean> {
  try {
    const receipt = await client.waitForTransaction(hash);
    return receipt.status === 'success';
  } catch (error) {
    return false;
  }
}
