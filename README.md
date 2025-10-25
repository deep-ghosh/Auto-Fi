# Celo AI Agent Library

A comprehensive library of AI-powered autonomous agents for Celo blockchain operations, designed as n8n custom nodes for easy integration into automation workflows.

## 🚀 Features

- **AI-Powered Decision Making**: Uses OpenAI GPT-4 or Anthropic Claude for intelligent decision-making
- **Pre-built Agent Templates**: Treasury Manager, Donation Splitter, Yield Optimizer, NFT Minter, Governance Participant
- **Celo Blockchain Integration**: Full support for Celo mainnet and Alfajores testnet
- **Safety & Validation**: Built-in spending limits, whitelist/blacklist, and risk assessment
- **n8n Integration**: Easy-to-use custom nodes for workflow automation
- **Event Monitoring**: Real-time blockchain event detection and processing
- **DeFi Protocol Support**: Integration with Moola, Ubeswap, and other Celo DeFi protocols

## 📦 Architecture

```
/celo-ai-agents/
├── packages/
│   ├── contracts/          # Smart contracts (Solidity)
│   ├── core/              # Core client library (TypeScript)
│   └── n8n-nodes/         # n8n custom nodes
├── contracts/              # Smart contracts
├── core/                  # Client library
└── n8n-nodes/            # n8n integration
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- n8n instance
- Celo wallet with testnet tokens (for testing)

### Install the Package

```bash
npm install n8n-nodes-celo-ai-agents
```

### Configure n8n

1. Copy the node files to your n8n custom nodes directory
2. Restart n8n
3. The nodes will appear in the "Celo AI Agents" category

## 🤖 Available Agents

### 1. Treasury Manager Agent

**Purpose**: Manages organizational treasury with intelligent fund allocation

**Features**:
- Monitor multi-token balances (cUSD, cEUR, CELO)
- Detect imbalances based on target allocation
- Execute swaps via DeFi protocols to rebalance
- Generate treasury reports
- Alert on unusual activity

**Configuration**:
- Target allocation percentages
- Rebalancing threshold
- Spending limits
- Execution mode (auto/propose)

### 2. Donation Splitter Agent

**Purpose**: Automatically splits incoming donations to multiple recipients

**Features**:
- Monitor wallet for incoming transactions
- Identify donation transactions
- Calculate split amounts based on percentages
- Execute batch transfers
- Send thank-you notifications
- Generate donation reports

**Configuration**:
- Recipient addresses and percentages
- Minimum donation threshold
- Supported tokens
- Thank you message template

### 3. Yield Optimizer Agent

**Purpose**: Maximizes yield across Celo DeFi protocols

**Features**:
- Query APYs across DeFi protocols
- Analyze risk/reward profiles
- Execute deposits/withdrawals
- Claim and compound rewards
- Monitor for better opportunities
- Emergency exit on risk events

**Configuration**:
- Risk tolerance level
- Allowed protocols
- Rebalancing frequency
- Compounding settings

### 4. NFT Minter Agent

**Purpose**: Autonomously mints NFTs based on events or conditions

**Features**:
- Listen for trigger events
- Validate eligibility criteria
- Generate NFT metadata with AI
- Mint NFTs to recipients
- Track minting history
- Handle failures and retries

**Configuration**:
- Trigger conditions
- NFT contract address
- Metadata templates
- Eligibility rules

### 5. Governance Participation Agent

**Purpose**: Participates in Celo governance based on principles

**Features**:
- Monitor governance proposals
- Analyze proposal content and impact
- Vote according to principles
- Delegate voting power strategically
- Generate voting rationale reports

**Configuration**:
- Voting principles
- Research settings
- Delegation preferences
- Notification channels

## 🔧 Usage

### Basic Setup

1. **Configure Credentials**:
   - Celo Wallet: Private key, network, contract addresses
   - OpenAI: API key, model selection

2. **Create Agent Node**:
   - Drag the desired agent node into your workflow
   - Configure the agent parameters
   - Set execution mode (auto/propose)

3. **Connect to Workflow**:
   - Connect triggers (webhooks, schedules, etc.)
   - Add processing nodes
   - Set up notifications

### Example Workflow: Treasury Rebalancing

```
[Schedule Trigger: Daily 9am]
  → [Treasury Manager Agent]
  → [IF: Action Proposed]
    → [Send Slack Notification]
    → [Wait for Approval]
    → [Execute Transaction]
  → [Log to Google Sheets]
```

### Example Workflow: Donation Processing

```
[Webhook: Celo Transaction Monitor]
  → [Donation Splitter Agent]
  → [Split: Multiple Recipients]
  → [Send Thank You Email]
  → [Update Donor Database]
  → [Generate Receipt NFT]
```

## 🔐 Security Features

### Spending Limits
- Daily spending caps per agent
- Per-transaction limits
- Automatic limit enforcement

### Address Controls
- Whitelist approved recipients
- Blacklist blocked addresses
- Contract interaction validation

### Risk Assessment
- Pre-transaction validation
- LLM-based risk scoring
- Emergency pause functionality

### Audit Trail
- Complete action logging
- Transaction receipts
- Decision explanations
- Performance metrics

## 🧪 Testing

### Deploy Contracts

```bash
cd packages/contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy-all.ts --network alfajores
```

### Setup Demo Data

```bash
npx hardhat run scripts/setup-demo.ts --network alfajores
```

### Test Agents

```bash
cd packages/core
npm test
```

## 📊 Monitoring

### Agent Performance
- Success rate tracking
- Gas usage optimization
- Cost savings analysis
- Failure reason analysis

### Real-time Alerts
- Spending limit breaches
- Failed transactions
- Unusual activity patterns
- System health status

## 🔗 Integration

### Supported Platforms
- n8n (primary)
- Zapier (via webhooks)
- Make.com (via webhooks)
- Custom applications (via API)

### DeFi Protocols
- Moola (lending/borrowing)
- Ubeswap (DEX)
- Curve (stable swaps)
- Mento (stability protocol)

### External Services
- Telegram notifications
- Email alerts
- Slack integration
- Google Sheets logging
- Webhook endpoints

## 📚 Documentation

### Smart Contracts
- [Contract Architecture](./docs/contracts.md)
- [API Reference](./docs/api.md)
- [Security Considerations](./docs/security.md)

### Agent Development
- [Creating Custom Agents](./docs/custom-agents.md)
- [LLM Integration](./docs/llm-integration.md)
- [Testing Guide](./docs/testing.md)

### Deployment
- [Production Setup](./docs/deployment.md)
- [Monitoring Guide](./docs/monitoring.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- Documentation: [docs.celo-ai-agents.com](https://docs.celo-ai-agents.com)
- Discord: [Celo AI Agents Community](https://discord.gg/celo-ai-agents)
- GitHub Issues: [Report bugs and feature requests](https://github.com/celo-ai-agents/issues)

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core agent framework
- ✅ Basic agent templates
- ✅ n8n integration
- ✅ Celo blockchain support

### Phase 2 (Q2 2024)
- 🔄 Advanced DeFi integrations
- 🔄 Multi-chain support
- 🔄 Enhanced AI capabilities
- 🔄 Mobile app

### Phase 3 (Q3 2024)
- 📋 Cross-chain agents
- 📋 Institutional features
- 📋 Enterprise dashboard
- 📋 API marketplace

---

**Built with ❤️ for the Celo ecosystem**
