# Getting Started with Celo AI Agents

This guide will help you get started with the Celo AI Agents library for building intelligent blockchain automation.

## Installation

```bash
npm install @celo-ai-agents/core
```

## Prerequisites

- Node.js 18+
- Celo wallet with testnet tokens (for testing)
- Alchemy API key (for enhanced security features)

## Quick Start

### 1. Basic Setup

```typescript
import { createCeloAgent } from '@celo-ai-agents/core';

// Initialize agent
const agent = createCeloAgent({
  privateKey: '0x...', // Your private key
  network: 'alfajores', // or 'mainnet'
  alchemyApiKey: 'your-alchemy-api-key'
});
```

### 2. Check Token Balance

```typescript
import { getTokenBalance } from '@celo-ai-agents/core';

const balance = await getTokenBalance(
  agent,
  '0x...', // Address to check
  '0x765DE816845861e75A25fCA122bb6898B8B1282a' // cUSD token address
);
console.log('cUSD Balance:', balance);
```

### 3. Send CELO Securely

```typescript
import { executeSecureTransaction } from '@celo-ai-agents/core';

const result = await executeSecureTransaction(
  agent,
  {
    alchemyApiKey: 'your-alchemy-api-key',
    network: 'alfajores',
    maxRiskScore: 50
  },
  {
    to: '0x...',
    value: BigInt('1000000000000000000'), // 1 CELO
    data: '0x'
  }
);

console.log('Transaction Result:', result);
```

### 4. Mint NFT

```typescript
import { mintNFT } from '@celo-ai-agents/core';

const nftResult = await mintNFT(
  agent,
  {
    alchemyApiKey: 'your-alchemy-api-key',
    network: 'alfajores'
  },
  {
    contractAddress: '0x...', // NFT contract address
    recipient: '0x...',
    metadata: {
      name: 'My First NFT',
      description: 'A test NFT',
      image: 'https://example.com/image.png',
      attributes: [
        { trait_type: 'Type', value: 'Test' }
      ]
    }
  }
);
```

## Core Concepts

### Agents

Agents are intelligent entities that can perform automated actions on the Celo blockchain. They use AI to make decisions based on their goals and constraints.

### Security

All transactions go through security analysis using Alchemy's APIs to detect potential risks and provide recommendations.

### Functional API

The library provides a clean functional API that wraps the underlying class-based implementation, making it easy to use in any JavaScript/TypeScript project.

## Next Steps

- [API Reference](./api-reference.md) - Complete API documentation
- [Examples](../examples/) - Code examples and use cases
- [Security Guide](./security.md) - Security best practices
- [Advanced Usage](./advanced-usage.md) - Advanced features and customization

## Support

- GitHub Issues: [Report bugs and feature requests](https://github.com/celo-ai-agents/core/issues)
- Documentation: [docs.celo-ai-agents.com](https://docs.celo-ai-agents.com)
- Discord: [Celo AI Agents Community](https://discord.gg/celo-ai-agents)
