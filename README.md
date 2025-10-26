# 🚀 Celo AI Automation Engine

A comprehensive AI-powered blockchain automation system built on the Celo network, featuring smart contract deployment, AI agent management, NFT operations, and DeFi integrations.

## 🌟 Features

### 🤖 AI-Powered Automation
- **Natural Language Processing**: Create automations using plain English
- **Gemini AI Integration**: Advanced AI decision-making capabilities
- **Smart Contract Deployment**: Automated contract deployment and management
- **Multi-Agent System**: Coordinated AI agents for complex operations

### 🔗 Blockchain Integration
- **Celo Network Support**: Full integration with Celo mainnet and Alfajores testnet
- **Multi-Token Support**: Native CELO, cUSD, cEUR, and cREAL tokens
- **DeFi Protocols**: Integration with Moola, Ubeswap, and Curve
- **NFT Operations**: Mint, transfer, and manage NFTs
- **Security Analysis**: Transaction risk assessment and approval workflows

### 🎨 Modern Frontend
- **Next.js 14**: Latest React framework with App Router
- **Tailwind CSS**: Beautiful, responsive UI components
- **Real-time Updates**: WebSocket integration for live data
- **Dashboard Analytics**: Comprehensive system monitoring and insights

### 🔧 Backend Services
- **REST API**: Comprehensive API for all blockchain operations
- **WebSocket Support**: Real-time communication
- **Database Integration**: SQLite for data persistence
- **Security Features**: Rate limiting, input validation, and authentication

## 📁 Project Structure

```
Build on Celo/
├── Frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and services
│   └── hooks/               # Custom React hooks
├── Backend/                 # Node.js backend services
│   ├── automation-system.js # Main automation engine
│   ├── data/                # SQLite database
│   └── examples/            # Usage examples
├── blockchain/              # Smart contracts and blockchain tools
│   ├── packages/
│   │   ├── core/            # Core blockchain functionality
│   │   ├── contracts/       # Solidity smart contracts
│   │   └── api/             # REST API server
│   └── hardhat.config.js    # Hardhat configuration
└── docs/                    # Documentation
```
## 📊 Live Deployment Status

### ✅ Successfully Deployed Contracts on Celo Alfajores Testnet

Our smart contracts are live and functional on the Celo testnet:

**Contract Deployment Details:**
- **AgentRegistry**: `0x28d19bce67566423719B2E471f578b765F4375BA`
  - Transaction: `0xe0ea61d187d2626742554a58ce5ba1f3ac47b6c92ea673db678da0c03a4a2e13`
  - Block: 60447833
  - Gas Used: 1,793,298
  - Status: ✅ Success

- **AgentTreasury**: `0x52F3f3C2d1610454E6c3345b5E02DA767dC4f4D2`
  - Transaction: `0x1ee24ac3f85a71dc0f3c1e2b2dc827fc894f0cd8e7463a82510b4fee37c980bb`
  - Block: 60447840
  - Gas Used: 2,468,811
  - Status: ✅ Success

- **AttendanceNFT**: `0xeD42659476443dE01d113322E156913EA056332F`
  - Transaction: `0x0c622edcbb59a5d4f51624e2ed0d0ccda4476a76a01380743ec5dab79391774a`
  - Block: 60447847
  - Gas Used: 3,080,093
  - Status: ✅ Success

**View on Celo Explorer:**
- [AgentRegistry Contract](https://alfajores.celoscan.io/address/0x28d19bce67566423719B2E471f578b765F4375BA)
- [AgentTreasury Contract](https://alfajores.celoscan.io/address/0x52F3f3C2d1610454E6c3345b5E02DA767dC4f4D2)
- [AttendanceNFT Contract](https://alfajores.celoscan.io/address/0xeD42659476443dE01d113322E156913EA056332F)

**Transaction Verification:**
All contracts have been successfully deployed with confirmed transactions showing:
- ✅ Contract creation transactions confirmed
- ✅ Gas optimization achieved (smaller contract sizes)
- ✅ Modular architecture implemented
- ✅ Independent contract management enabled

## 📦 Architecture

```
/celo-ai-agents/
├── packages/
│   ├── contracts/          # Smart contracts (Solidity)
│   └── core/              # Main library package (TypeScript)
├── examples/              # Usage examples
├── docs/                  # Developer documentation
└── tests/                 # Integration tests
```


## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/deep-ghosh/celo-automator.git
   cd celo-automator
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd Frontend
   npm install
   
   # Install backend dependencies
   cd ../Backend
   npm install
   
   # Install blockchain dependencies
   cd ../blockchain
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp Backend/env.example Backend/.env
   cp Frontend/env.example Frontend/.env.local
   cp blockchain/packages/api/env.example blockchain/packages/api/.env
   ```

4. **Configure Environment Variables**
   
   **Backend (.env)**
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   PRIVATE_KEY=your_wallet_private_key
   NETWORK=alfajores
   RPC_URL=https://alfajores-forno.celo-testnet.org
   PORT=3001
   ```

   **Frontend (.env.local)**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_NETWORK=alfajores
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd Backend
   npm start
   ```
   Server will run on http://localhost:3001

2. **Start the Frontend**
   ```bash
   cd Frontend
   npm run dev
   ```
   Frontend will run on http://localhost:3000

3. **Start the Blockchain API (Optional)**
   ```bash
   cd blockchain/packages/api
   npm run dev
   ```
   API will run on http://localhost:3000

## 🎯 Core Features

### 🤖 AI Automation System

The AI automation system allows you to create complex blockchain workflows using natural language:

```javascript
// Example: Create an automation
const automation = {
  name: "Treasury Rebalancing",
  description: "Automatically rebalance treasury when cUSD drops below 40%",
  trigger: "token_balance_change",
  conditions: {
    token: "cUSD",
    threshold: 0.4,
    operator: "less_than"
  },
  actions: [
    {
      type: "swap",
      from: "CELO",
      to: "cUSD",
      amount: "1000"
    }
  ]
};
```

### 🔗 Smart Contract Deployment

Deploy and manage smart contracts with ease:

```typescript
// Deploy a contract
const deployment = await deployContract({
  network: 'alfajores',
  contractName: 'AgentRegistry',
  constructorArgs: []
});

console.log('Contract deployed at:', deployment.contractAddress);
```

### 🎨 NFT Operations

Mint and manage NFTs:

```typescript
// Mint an NFT
const nft = await mintNFT({
  to: walletAddress,
  tokenURI: "https://metadata.example.com/1",
  contractAddress: "0x..."
});
```

### 📊 Analytics Dashboard

Monitor system performance and automation metrics:

- **Real-time Metrics**: Live updates on automation status
- **Performance Analytics**: Execution times and success rates
- **Cost Analysis**: Gas usage and transaction costs
- **Security Monitoring**: Risk assessment and alerts

## 🔧 API Reference

### Backend Endpoints

- `POST /api/automate` - Create new automation
- `GET /api/automations` - List all automations
- `POST /api/blockchain/function-call` - Execute blockchain function
- `GET /api/analytics` - Get system analytics
- `WebSocket /ws` - Real-time updates

### Frontend API Client

```typescript
import { ApiClient } from './lib/api-client';

const api = new ApiClient('http://localhost:3001');

// Create automation
const automation = await api.createAutomation({
  name: "My Automation",
  description: "Automated treasury management",
  // ... configuration
});

// Execute automation
const result = await api.executeAutomation(automation.id, {
  walletAddress: "0x...",
  // ... context
});
```

## 🛡️ Security Features

### Transaction Security
- **Risk Assessment**: AI-powered transaction analysis
- **Approval Workflows**: Multi-signature requirements
- **Gas Optimization**: Automatic gas limit calculation
- **Address Validation**: Comprehensive address checking

### API Security
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **Input Validation**: Sanitize all user inputs
- **Authentication**: Secure API access
- **CORS Protection**: Cross-origin request security

## 📈 Monitoring & Analytics

### Real-time Monitoring
- **System Health**: Server status and performance
- **Automation Status**: Live execution monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response times and throughput

### Analytics Dashboard
- **Usage Statistics**: User activity and patterns
- **Cost Analysis**: Gas usage and transaction costs
- **Success Rates**: Automation execution success rates
- **Trend Analysis**: Historical performance data

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd Frontend
npm test

# Integration tests
npm run test:integration
```

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability assessment

## 🚀 Deployment

### Production Deployment

1. **Environment Configuration**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export GEMINI_API_KEY=your_production_key
   export PRIVATE_KEY=your_production_key
   ```

2. **Build Applications**
   ```bash
   # Build frontend
   cd Frontend
   npm run build
   
   # Build backend
   cd Backend
   npm run build
   ```

3. **Deploy to Cloud**
   - **Frontend**: Deploy to Vercel, Netlify, or similar
   - **Backend**: Deploy to Railway, Heroku, or AWS
   - **Database**: Use PostgreSQL or MongoDB for production

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write comprehensive tests
- Update documentation
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join community discussions
- **Email**: Contact the development team

### Common Issues

**Backend Connection Refused**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Start backend if not running
cd Backend && npm start
```

**Token Balance Errors**
- Ensure you're connected to the correct network
- Check token contract addresses
- Verify wallet connection

**AI Automation Not Working**
- Check Gemini API key configuration
- Verify network connectivity
- Review automation logs

## 🎉 Acknowledgments

- **Celo Foundation** for blockchain infrastructure
- **Google AI** for Gemini integration
- **Next.js Team** for the amazing framework
- **Open Source Community** for inspiration and support

## 🔮 Roadmap

### Upcoming Features
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Advanced AI models integration
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Community marketplace for automations
- [ ] Enterprise features and support

### Version History
- **v2.0.0** - Current version with AI integration
- **v1.0.0** - Initial release with basic automation

---

**Built with ❤️ for the Celo ecosystem**

For more information, visit our [documentation](docs/) or [GitHub repository](https://github.com/deep-ghosh/celo-automator).
