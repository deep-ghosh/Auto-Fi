import { Address } from "viem";
import { AgentMemory } from "./types";
export interface Trigger {
    id: string;
    name: string;
    type: 'threshold' | 'schedule' | 'event' | 'pattern' | 'ml_prediction';
    config: TriggerConfig;
    enabled: boolean;
    priority: number;
}
export interface TriggerConfig {
    threshold?: {
        metric: 'balance' | 'price' | 'volume' | 'apy' | 'gas_price';
        operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
        value: number;
        token?: Address;
    };
    schedule?: {
        interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
        time?: string;
        timezone?: string;
    };
    event?: {
        contractAddress: Address;
        eventName: string;
        filter?: Record<string, any>;
    };
    pattern?: {
        sequence: string[];
        timeframe: number;
        confidence: number;
    };
    ml_prediction?: {
        model: string;
        features: string[];
        threshold: number;
    };
}
export interface DecisionRule {
    id: string;
    name: string;
    triggerId: string;
    conditions: DecisionCondition[];
    actions: ActionTemplate[];
    priority: number;
    enabled: boolean;
}
export interface DecisionCondition {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'matches';
    value: any;
    weight: number;
}
export interface ActionTemplate {
    type: 'transfer' | 'swap' | 'stake' | 'unstake' | 'claim' | 'buy' | 'sell' | 'request' | 'mint' | 'notify';
    config: Record<string, any>;
    conditions?: DecisionCondition[];
}
export interface MLModel {
    id: string;
    name: string;
    type: 'classification' | 'regression' | 'clustering' | 'anomaly_detection';
    features: string[];
    weights: number[];
    threshold?: number;
    trainingData: number[][];
    accuracy: number;
}
export declare class DecisionEngine {
    private triggers;
    private rules;
    private mlModels;
    private agentMemory;
    constructor();
    private initializeDefaultTriggers;
    private initializeDefaultRules;
    private initializeMLModels;
    evaluateTriggers(agentId: bigint, currentState: any, memory: AgentMemory): Promise<Trigger[]>;
    private evaluateTrigger;
    private evaluateThresholdTrigger;
    private evaluateScheduleTrigger;
    private evaluateEventTrigger;
    private evaluatePatternTrigger;
    private evaluateMLTrigger;
    generateDecision(agentId: bigint, currentState: any, memory: AgentMemory): Promise<{
        action: string;
        params: any;
        reasoning: string;
        confidence: number;
        triggeredBy: string[];
    }>;
    private findApplicableRules;
    private evaluateRuleConditions;
    private selectBestRule;
    private calculateRuleScore;
    private executeRule;
    private getMetricValue;
    private compareValues;
    private getLastRunTime;
    private sequenceMatches;
    private getConfidence;
    private extractFeatures;
    private runMLModel;
    private performClustering;
    private detectAnomaly;
    private calculateDistance;
    private calculateRiskScore;
    private calculateAmountVariance;
    private calculateTimePatterns;
    private calculateHistoricalPerformance;
    private calculateOptimalAmount;
    private getEmergencyWallet;
    private selectOptimalToken;
    private calculateConfidence;
    addTrigger(trigger: Trigger): void;
    addRule(rule: DecisionRule): void;
    addMLModel(model: MLModel): void;
    getTriggers(): Trigger[];
    getRules(): DecisionRule[];
    getMLModels(): MLModel[];
}
//# sourceMappingURL=decision-engine.d.ts.map