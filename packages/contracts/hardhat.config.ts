import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";





















const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 44787,
    },
    celo: {
      url: "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/1a3ETMqJJ0QMjFNP2Z6GNdp1mCsxNpEO",
      accounts: ["ea988f9144ae3f162df531b665a4c4be421253fda546cb22eae2cf4c43ce67b7"],
      chainId: 11155111,
    },
    celoSepolia: {
      url: "https://rpc.sepolia.org",
      accounts: ["ea988f9144ae3f162df531b665a4c4be421253fda546cb22eae2cf4c43ce67b7"],
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
