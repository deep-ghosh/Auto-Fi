# API Reference

Complete reference for the Celo AI Agents library API.

## Core Functions

### `createCeloAgent(config)`

Creates a new Celo agent instance.

**Parameters:**
- `config.privateKey` (string): Private key for the agent
- `config.network` ('alfajores' | 'mainnet'): Network to use
- `config.rpcUrl` (string, optional): Custom RPC URL
- `config.alchemyApiKey` (string, optional): Alchemy API key for enhanced features

**Returns:** `CeloClient` instance

### `getTokenBalance(client, address, token)`

Gets the token balance for an address.

**Parameters:**
- `client` (CeloClient): Agent instance
- `address` (Address): Address to check
- `token` (Address): Token contract address

**Returns:** `Promise<string>` - Balance as string

### `sendCELO(client, to, amount)`

Sends native CELO tokens.

**Parameters:**
- `client` (CeloClient): Agent instance
- `to` (Address): Recipient address
- `amount` (string): Amount in wei

**Returns:** `Promise<TransactionResult>`

## Security Functions

### `analyzeTransactionSecurity(config, to, value, data?, from?)`

Analyzes transaction security using Alchemy.

**Parameters:**
- `config` (SecurityConfig): Security configuration
- `to` (Address): Recipient address
- `value` (bigint): Transaction value
- `data` (string, optional): Transaction data
- `from` (Address, optional): Sender address

**Returns:** `Promise<SecurityAnalysisResult>`

### `executeSecureTransaction(client, config, transaction)`

Executes a transaction with full security analysis.

**Parameters:**
- `client` (CeloClient): Agent instance
- `config` (SecurityConfig): Security configuration
- `transaction` (TransactionRequest): Transaction details

**Returns:** `Promise<SecureTransactionResult>`

### `validateTransaction(config, transaction)`

Validates a transaction before execution.

**Parameters:**
- `config` (SecurityConfig): Security configuration
- `transaction` (TransactionRequest): Transaction details

**Returns:** `Promise<ValidationResult>`

## NFT Functions

### `mintNFT(client, config, params)`

Mints an NFT with security checks.

**Parameters:**
- `client` (CeloClient): Agent instance
- `config` (NFTMintConfig): NFT configuration
- `params` (NFTMintParams): Minting parameters

**Returns:** `Promise<NFTMintResult>`

### `getNFTMetadata(config, contractAddress, tokenId)`

Gets NFT metadata.

**Parameters:**
- `config` (NFTMintConfig): NFT configuration
- `contractAddress` (Address): NFT contract address
- `tokenId` (string): Token ID

**Returns:** `Promise<NFTMetadata>`

### `getOwnedNFTs(config, address, contractAddress?)`

Gets owned NFTs for an address.

**Parameters:**
- `config` (NFTMintConfig): NFT configuration
- `address` (Address): Address to check
- `contractAddress` (Address, optional): Specific contract

**Returns:** `Promise<NFTOwned[]>`

## Agent Functions

### `createTreasuryManagerAgent(client, agentId, targetAllocation, rebalanceThreshold, spendingLimits)`

Creates a treasury management agent.

**Parameters:**
- `client` (CeloClient): Agent instance
- `agentId` (bigint): Unique agent ID
- `targetAllocation` (object): Target token allocation percentages
- `rebalanceThreshold` (number): Rebalancing threshold percentage
- `spendingLimits` (object): Daily and per-transaction limits

**Returns:** `AgentEngine` instance

### `createDonationSplitterAgent(client, agentId, recipients, minimumAmount, spendingLimits)`

Creates a donation splitting agent.

**Parameters:**
- `client` (CeloClient): Agent instance
- `agentId` (bigint): Unique agent ID
- `recipients` (array): Recipient addresses and percentages
- `minimumAmount` (string): Minimum donation amount
- `spendingLimits` (object): Spending limits

**Returns:** `AgentEngine` instance

### `executeAgentWithSecurity(agentEngine, securityConfig, agentId)`

Executes an agent with security checks.

**Parameters:**
- `agentEngine` (AgentEngine): Agent instance
- `securityConfig` (AgentSecurityConfig): Security configuration
- `agentId` (bigint): Agent ID

**Returns:** `Promise<AgentExecutionResult>`

## Deployment Functions

### `deployContract(client, config)`

Deploys a smart contract.

**Parameters:**
- `client` (CeloClient): Agent instance
- `config` (ContractDeploymentConfig): Deployment configuration

**Returns:** `Promise<ContractDeploymentResult>`

### `deployAllContracts(client, nftConfig?)`

Deploys all contracts in sequence.

**Parameters:**
- `client` (CeloClient): Agent instance
- `nftConfig` (object, optional): NFT contract configuration

**Returns:** `Promise<DeploymentResult>`

## Types

### SecurityConfig

```typescript
interface SecurityConfig {
  alchemyApiKey: string;
  alchemyPolicyId?: string;
  network: 'alfajores' | 'mainnet';
  maxRiskScore?: number;
  requireApproval?: boolean;
  enableSimulation?: boolean;
  enableGasOptimization?: boolean;
}
```

### NFTMintParams

```typescript
interface NFTMintParams {
  contractAddress: Address;
  recipient: Address;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  tokenId?: string;
}
```

### AgentConfigParams

```typescript
interface AgentConfigParams {
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
```

## Error Handling

All functions return result objects with success indicators and error messages:

```typescript
interface TransactionResult {
  success: boolean;
  transactionHash?: Hash;
  gasUsed?: bigint;
  error?: string;
}
```

## Best Practices

1. **Always use security functions** for transactions
2. **Set appropriate risk thresholds** based on your use case
3. **Test on Alfajores** before mainnet deployment
4. **Monitor agent performance** and adjust parameters
5. **Keep private keys secure** and use environment variables
