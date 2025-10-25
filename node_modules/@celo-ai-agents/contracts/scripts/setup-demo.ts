import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentConfig {
  agentRegistry: string;
  agentTreasury: string;
  donationSplitter: string;
  yieldAggregator: string;
  governanceProxy: string;
  attendanceNFT: string;
  network: string;
  timestamp: number;
}

async function main() {
  console.log("🎭 Setting up demo data for Celo AI Agent Library...");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  // Load deployment config
  const configPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  
  if (!fs.existsSync(configPath)) {
    console.error("❌ Deployment config not found. Please run deploy-all.ts first.");
    process.exit(1);
  }

  const deploymentConfig: DeploymentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  console.log("📋 Loaded deployment config for network:", network.name);

  // Get contract instances
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const AgentTreasury = await ethers.getContractFactory("AgentTreasury");
  const DonationSplitter = await ethers.getContractFactory("DonationSplitter");
  const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
  const GovernanceProxy = await ethers.getContractFactory("GovernanceProxy");
  const AttendanceNFT = await ethers.getContractFactory("AttendanceNFT");

  const agentRegistry = AgentRegistry.attach(deploymentConfig.agentRegistry);
  const agentTreasury = AgentTreasury.attach(deploymentConfig.agentTreasury);
  const donationSplitter = DonationSplitter.attach(deploymentConfig.donationSplitter);
  const yieldAggregator = YieldAggregator.attach(deploymentConfig.yieldAggregator);
  const governanceProxy = GovernanceProxy.attach(deploymentConfig.governanceProxy);
  const attendanceNFT = AttendanceNFT.attach(deploymentConfig.attendanceNFT);

  console.log("🔗 Connected to deployed contracts");

  // 1. Register demo agents
  console.log("\n🤖 Registering demo agents...");
  
  const treasuryAgentId = await agentRegistry.registerAgent(
    "TreasuryManager",
    deployer.address, // Using deployer as agent wallet for demo
    ethers.parseEther("1000"), // 1000 CELO daily limit
    ethers.parseEther("100")   // 100 CELO per-tx limit
  );
  console.log("✅ Treasury Manager Agent registered with ID:", treasuryAgentId.toString());

  const donationAgentId = await agentRegistry.registerAgent(
    "DonationSplitter",
    deployer.address,
    ethers.parseEther("500"),  // 500 CELO daily limit
    ethers.parseEther("50")    // 50 CELO per-tx limit
  );
  console.log("✅ Donation Splitter Agent registered with ID:", donationAgentId.toString());

  const yieldAgentId = await agentRegistry.registerAgent(
    "YieldOptimizer",
    deployer.address,
    ethers.parseEther("2000"), // 2000 CELO daily limit
    ethers.parseEther("200")   // 200 CELO per-tx limit
  );
  console.log("✅ Yield Optimizer Agent registered with ID:", yieldAgentId.toString());

  const nftAgentId = await agentRegistry.registerAgent(
    "NFTMinter",
    deployer.address,
    ethers.parseEther("100"),  // 100 CELO daily limit
    ethers.parseEther("10")    // 10 CELO per-tx limit
  );
  console.log("✅ NFT Minter Agent registered with ID:", nftAgentId.toString());

  const governanceAgentId = await agentRegistry.registerAgent(
    "GovernanceParticipant",
    deployer.address,
    ethers.parseEther("0"),   // No spending limit for governance
    ethers.parseEther("0")      // No per-tx limit for governance
  );
  console.log("✅ Governance Participant Agent registered with ID:", governanceAgentId.toString());

  // 2. Set agent permissions
  console.log("\n🔐 Setting agent permissions...");
  
  const permissions = [
    "TRANSFER",
    "SWAP", 
    "STAKE",
    "UNSTAKE",
    "CLAIM_REWARDS",
    "VOTE",
    "MINT_NFT"
  ];

  const allowed = new Array(permissions.length).fill(true);

  await agentRegistry.setAgentPermissions(treasuryAgentId, permissions, allowed);
  console.log("✅ Treasury Manager permissions set");

  await agentRegistry.setAgentPermissions(donationAgentId, permissions, allowed);
  console.log("✅ Donation Splitter permissions set");

  await agentRegistry.setAgentPermissions(yieldAgentId, permissions, allowed);
  console.log("✅ Yield Optimizer permissions set");

  await agentRegistry.setAgentPermissions(nftAgentId, permissions, allowed);
  console.log("✅ NFT Minter permissions set");

  await agentRegistry.setAgentPermissions(governanceAgentId, ["VOTE"], [true]);
  console.log("✅ Governance Participant permissions set");

  // 3. Fund demo wallets (if on testnet)
  if (network.name === "alfajores") {
    console.log("\n💰 Funding demo wallets...");
    console.log("ℹ️  Please fund the deployer wallet with testnet tokens from:");
    console.log("   - Celo Faucet: https://faucet.celo.org/");
    console.log("   - Or use the Celo Terminal wallet");
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Current balance:", ethers.formatEther(balance), "CELO");
    
    if (balance < ethers.parseEther("1")) {
      console.log("⚠️  Low balance detected. Please fund the wallet for demo setup.");
    }
  }

  // 4. Configure donation splitter
  console.log("\n🎁 Configuring donation splitter...");
  
  // Create demo recipient addresses (using deterministic addresses for demo)
  const operationsWallet = ethers.getCreateAddress({
    from: deployer.address,
    nonce: 1000
  });
  const ngoWallet = ethers.getCreateAddress({
    from: deployer.address,
    nonce: 1001
  });

  const recipients = [operationsWallet, ngoWallet];
  const percentages = [8000, 2000]; // 80% to operations, 20% to NGO

  await donationSplitter.configureSplit(
    ethers.ZeroAddress, // Native CELO
    recipients,
    percentages
  );
  console.log("✅ Donation splitter configured for CELO");
  console.log("   Operations wallet (80%):", operationsWallet);
  console.log("   NGO wallet (20%):", ngoWallet);

  // Set minimum threshold
  await donationSplitter.setMinimumThreshold(
    ethers.ZeroAddress,
    ethers.parseEther("0.01") // 0.01 CELO minimum
  );
  console.log("✅ Minimum threshold set to 0.01 CELO");

  // 5. Add DeFi protocols to yield aggregator
  console.log("\n📈 Adding DeFi protocols...");
  
  // Mock protocol addresses (in real implementation, these would be actual protocol addresses)
  const moolaProtocol = ethers.getCreateAddress({
    from: deployer.address,
    nonce: 2000
  });
  const ubeswapProtocol = ethers.getCreateAddress({
    from: deployer.address,
    nonce: 2001
  });
  const curveProtocol = ethers.getCreateAddress({
    from: deployer.address,
    nonce: 2002
  });

  await yieldAggregator.addProtocol(
    ethers.keccak256(ethers.toUtf8Bytes("MOOLA")),
    moolaProtocol,
    500 // 5% APY
  );
  console.log("✅ Moola protocol added (5% APY)");

  await yieldAggregator.addProtocol(
    ethers.keccak256(ethers.toUtf8Bytes("UBESWAP")),
    ubeswapProtocol,
    800 // 8% APY
  );
  console.log("✅ Ubeswap protocol added (8% APY)");

  await yieldAggregator.addProtocol(
    ethers.keccak256(ethers.toUtf8Bytes("CURVE")),
    curveProtocol,
    1200 // 12% APY
  );
  console.log("✅ Curve protocol added (12% APY)");

  // 6. Set up governance voting power
  console.log("\n🗳️ Setting up governance...");
  
  await governanceProxy.setVotingPower(
    deployer.address,
    ethers.parseEther("1000") // 1000 voting power
  );
  console.log("✅ Voting power set for deployer");

  // Create a demo proposal
  const proposalId = await governanceProxy.createProposal(
    "Demo Proposal: Increase Agent Spending Limits",
    "This is a demo proposal to increase the daily spending limits for AI agents to improve their operational efficiency.",
    Math.floor(Date.now() / 1000) + 3600 // Start in 1 hour
  );
  console.log("✅ Demo proposal created with ID:", proposalId.toString());

  // 7. Authorize NFT minter
  console.log("\n🎫 Setting up NFT minter...");
  
  await attendanceNFT.setMinterAgent(nftAgentId, true);
  console.log("✅ NFT Minter Agent authorized");

  // 8. Create demo data summary
  const demoData = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    agents: {
      treasuryManager: treasuryAgentId.toString(),
      donationSplitter: donationAgentId.toString(),
      yieldOptimizer: yieldAgentId.toString(),
      nftMinter: nftAgentId.toString(),
      governanceParticipant: governanceAgentId.toString()
    },
    contracts: deploymentConfig,
    demoWallets: {
      operations: operationsWallet,
      ngo: ngoWallet
    },
    protocols: {
      moola: moolaProtocol,
      ubeswap: ubeswapProtocol,
      curve: curveProtocol
    },
    setupTimestamp: Date.now()
  };

  const demoPath = path.join(__dirname, "..", "deployments", `${network.name}-demo.json`);
  fs.writeFileSync(demoPath, JSON.stringify(demoData, null, 2));
  console.log("\n💾 Demo data saved to:", demoPath);

  console.log("\n🎉 Demo setup completed successfully!");
  console.log("\n📋 Demo Summary:");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("\n🤖 Registered Agents:");
  console.log("Treasury Manager:", treasuryAgentId.toString());
  console.log("Donation Splitter:", donationAgentId.toString());
  console.log("Yield Optimizer:", yieldAgentId.toString());
  console.log("NFT Minter:", nftAgentId.toString());
  console.log("Governance Participant:", governanceAgentId.toString());
  
  console.log("\n🔗 Contract Addresses:");
  console.log("AgentRegistry:", deploymentConfig.agentRegistry);
  console.log("AgentTreasury:", deploymentConfig.agentTreasury);
  console.log("DonationSplitter:", deploymentConfig.donationSplitter);
  console.log("YieldAggregator:", deploymentConfig.yieldAggregator);
  console.log("GovernanceProxy:", deploymentConfig.governanceProxy);
  console.log("AttendanceNFT:", deploymentConfig.attendanceNFT);

  console.log("\n🚀 Next Steps:");
  console.log("1. Fund the deployer wallet with testnet tokens");
  console.log("2. Test agent operations using the registered agents");
  console.log("3. Send donations to test the splitter");
  console.log("4. Vote on the demo proposal");
  console.log("5. Mint demo NFTs");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
