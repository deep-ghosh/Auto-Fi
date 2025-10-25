import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentConfig {
  agentRegistry: string;
  agentTreasury: string;
  donationSplitter: string;
  yieldAggregator: string;
  masterTrading: string;
  attendanceNFT: string;
  network: string;
  timestamp: number;
}

async function main() {
  console.log("🚀 Starting Celo AI Agent Library deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  // 1. Deploy AgentRegistry
  console.log("\n📋 Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("AgentRegistry deployed to:", agentRegistryAddress);

  // 2. Deploy AgentTreasury
  console.log("\n💰 Deploying AgentTreasury...");
  const AgentTreasury = await ethers.getContractFactory("AgentTreasury");
  const agentTreasury = await AgentTreasury.deploy(agentRegistryAddress);
  await agentTreasury.waitForDeployment();
  const agentTreasuryAddress = await agentTreasury.getAddress();
  console.log("AgentTreasury deployed to:", agentTreasuryAddress);

  // 3. Deploy DonationSplitter
  console.log("\n🎁 Deploying DonationSplitter...");
  const DonationSplitter = await ethers.getContractFactory("DonationSplitter");
  const donationSplitter = await DonationSplitter.deploy(agentRegistryAddress);
  await donationSplitter.waitForDeployment();
  const donationSplitterAddress = await donationSplitter.getAddress();
  console.log("DonationSplitter deployed to:", donationSplitterAddress);

  // 4. Deploy YieldAggregator
  console.log("\n📈 Deploying YieldAggregator...");
  const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
  const yieldAggregator = await YieldAggregator.deploy(agentRegistryAddress);
  await yieldAggregator.waitForDeployment();
  const yieldAggregatorAddress = await yieldAggregator.getAddress();
  console.log("YieldAggregator deployed to:", yieldAggregatorAddress);

  // 5. Deploy MasterTradingContract
  console.log("\n💱 Deploying MasterTradingContract...");
  const MasterTradingContract = await ethers.getContractFactory("MasterTradingContract");
  const masterTrading = await MasterTradingContract.deploy(agentRegistryAddress);
  await masterTrading.waitForDeployment();
  const masterTradingAddress = await masterTrading.getAddress();
  console.log("MasterTradingContract deployed to:", masterTradingAddress);

  // 6. Deploy AttendanceNFT
  console.log("\n🎫 Deploying AttendanceNFT...");
  const AttendanceNFT = await ethers.getContractFactory("AttendanceNFT");
  const attendanceNFT = await AttendanceNFT.deploy(
    "Celo Attendance NFT",
    "CAN",
    agentRegistryAddress
  );
  await attendanceNFT.waitForDeployment();
  const attendanceNFTAddress = await attendanceNFT.getAddress();
  console.log("AttendanceNFT deployed to:", attendanceNFTAddress);

  // 7. Save deployment config
  const deploymentConfig: DeploymentConfig = {
    agentRegistry: agentRegistryAddress,
    agentTreasury: agentTreasuryAddress,
    donationSplitter: donationSplitterAddress,
    yieldAggregator: yieldAggregatorAddress,
    masterTrading: masterTradingAddress,
    attendanceNFT: attendanceNFTAddress,
    network: network.name,
    timestamp: Date.now()
  };

  const configPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(deploymentConfig, null, 2));
  console.log("\n💾 Deployment config saved to:", configPath);

  // 8. Verify contracts (if not local network)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n🔍 Verifying contracts on Celoscan...");
    
    try {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      await agentRegistry.deploymentTransaction()?.wait(5);
      await ethers.run("verify:verify", {
        address: agentRegistryAddress,
        constructorArguments: [],
      });
      console.log("✅ AgentRegistry verified");
    } catch (error) {
      console.log("❌ AgentRegistry verification failed:", error);
    }

    try {
      await ethers.run("verify:verify", {
        address: agentTreasuryAddress,
        constructorArguments: [agentRegistryAddress],
      });
      console.log("✅ AgentTreasury verified");
    } catch (error) {
      console.log("❌ AgentTreasury verification failed:", error);
    }

    try {
      await ethers.run("verify:verify", {
        address: donationSplitterAddress,
        constructorArguments: [agentRegistryAddress],
      });
      console.log("✅ DonationSplitter verified");
    } catch (error) {
      console.log("❌ DonationSplitter verification failed:", error);
    }

    try {
      await ethers.run("verify:verify", {
        address: yieldAggregatorAddress,
        constructorArguments: [agentRegistryAddress],
      });
      console.log("✅ YieldAggregator verified");
    } catch (error) {
      console.log("❌ YieldAggregator verification failed:", error);
    }

    try {
      await ethers.run("verify:verify", {
        address: governanceProxyAddress,
        constructorArguments: [agentRegistryAddress],
      });
      console.log("✅ GovernanceProxy verified");
    } catch (error) {
      console.log("❌ GovernanceProxy verification failed:", error);
    }

    try {
      await ethers.run("verify:verify", {
        address: attendanceNFTAddress,
        constructorArguments: ["Celo Attendance NFT", "CAN", agentRegistryAddress],
      });
      console.log("✅ AttendanceNFT verified");
    } catch (error) {
      console.log("❌ AttendanceNFT verification failed:", error);
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("AgentRegistry:", agentRegistryAddress);
  console.log("AgentTreasury:", agentTreasuryAddress);
  console.log("DonationSplitter:", donationSplitterAddress);
  console.log("YieldAggregator:", yieldAggregatorAddress);
  console.log("GovernanceProxy:", governanceProxyAddress);
  console.log("AttendanceNFT:", attendanceNFTAddress);

  console.log("\n🔗 Explorer Links:");
  const explorerBase = network.name === "alfajores" 
    ? "https://alfajores.celoscan.io/address" 
    : "https://celoscan.io/address";
  
  console.log(`AgentRegistry: ${explorerBase}/${agentRegistryAddress}`);
  console.log(`AgentTreasury: ${explorerBase}/${agentTreasuryAddress}`);
  console.log(`DonationSplitter: ${explorerBase}/${donationSplitterAddress}`);
  console.log(`YieldAggregator: ${explorerBase}/${yieldAggregatorAddress}`);
  console.log(`GovernanceProxy: ${explorerBase}/${governanceProxyAddress}`);
  console.log(`AttendanceNFT: ${explorerBase}/${attendanceNFTAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
