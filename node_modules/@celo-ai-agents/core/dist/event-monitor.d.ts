import { Address } from "viem";
import { CeloClient } from "./celo-client";
import { BlockEvents, Transaction, Event } from "./types";
export declare class BlockScanner {
    private client;
    private lastScannedBlock;
    private pollingInterval;
    private isRunning;
    private eventCallbacks;
    constructor(client: CeloClient);
    start(): Promise<void>;
    stop(): Promise<void>;
    private pollLoop;
    private scanNewBlocks;
    scanBlock(blockNumber: bigint): Promise<BlockEvents>;
    getWalletTransactions(address: Address, fromBlock: bigint, toBlock: bigint): Promise<Transaction[]>;
    getContractEvents(contractAddress: Address, eventSignature: string, fromBlock: bigint, toBlock: bigint): Promise<Event[]>;
    subscribe(id: string, callback: (events: BlockEvents) => void): void;
    unsubscribe(id: string): void;
    private sleep;
    getStatus(): {
        isRunning: boolean;
        lastScannedBlock: bigint;
        subscribers: number;
    };
}
//# sourceMappingURL=event-monitor.d.ts.map