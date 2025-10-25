"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAINNET_CONFIG = exports.ALFAJORES_CONFIG = exports.AgentEngine = exports.DecisionEngine = exports.BlockScanner = exports.CeloClient = void 0;
// Core exports
var celo_client_1 = require("./celo-client");
Object.defineProperty(exports, "CeloClient", { enumerable: true, get: function () { return celo_client_1.CeloClient; } });
var event_monitor_1 = require("./event-monitor");
Object.defineProperty(exports, "BlockScanner", { enumerable: true, get: function () { return event_monitor_1.BlockScanner; } });
var decision_engine_1 = require("./decision-engine");
Object.defineProperty(exports, "DecisionEngine", { enumerable: true, get: function () { return decision_engine_1.DecisionEngine; } });
var agent_engine_1 = require("./agent-engine");
Object.defineProperty(exports, "AgentEngine", { enumerable: true, get: function () { return agent_engine_1.AgentEngine; } });
// Network configurations
exports.ALFAJORES_CONFIG = {
    chainId: 44787,
    name: "Celo Alfajores",
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    explorerUrl: "https://alfajores.celoscan.io",
    contracts: {
        agentRegistry: "0x0000000000000000000000000000000000000000",
        agentTreasury: "0x0000000000000000000000000000000000000000",
        donationSplitter: "0x0000000000000000000000000000000000000000",
        yieldAggregator: "0x0000000000000000000000000000000000000000",
        masterTrading: "0x0000000000000000000000000000000000000000",
        attendanceNFT: "0x0000000000000000000000000000000000000000"
    },
    tokens: {
        cUSD: "0x874069Fa1Eb16D44d62F6a2e4c8B0C1C3b1C5C1C",
        cEUR: "0x10c892A6ECfc32b4C1C6Cb8C1C3b1C5C1C3b1C5C1C",
        cREAL: "0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC",
        CELO: "0x0000000000000000000000000000000000000000"
    },
    defiProtocols: {
        moola: "0x0000000000000000000000000000000000000000",
        ubeswap: "0x0000000000000000000000000000000000000000",
        curve: "0x0000000000000000000000000000000000000000"
    }
};
exports.MAINNET_CONFIG = {
    chainId: 42220,
    name: "Celo Mainnet",
    rpcUrl: "https://forno.celo.org",
    explorerUrl: "https://celoscan.io",
    contracts: {
        agentRegistry: "0x0000000000000000000000000000000000000000",
        agentTreasury: "0x0000000000000000000000000000000000000000",
        donationSplitter: "0x0000000000000000000000000000000000000000",
        yieldAggregator: "0x0000000000000000000000000000000000000000",
        masterTrading: "0x0000000000000000000000000000000000000000",
        attendanceNFT: "0x0000000000000000000000000000000000000000"
    },
    tokens: {
        cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
        cEUR: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
        cREAL: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787",
        CELO: "0x0000000000000000000000000000000000000000"
    },
    defiProtocols: {
        moola: "0x0000000000000000000000000000000000000000",
        ubeswap: "0x0000000000000000000000000000000000000000",
        curve: "0x0000000000000000000000000000000000000000"
    }
};
//# sourceMappingURL=index.js.map