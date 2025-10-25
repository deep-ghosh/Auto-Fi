"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionEngine = void 0;
class DecisionEngine {
    constructor() {
        this.triggers = new Map();
        this.rules = new Map();
        this.mlModels = new Map();
        this.agentMemory = new Map();
        this.initializeDefaultTriggers();
        this.initializeDefaultRules();
        this.initializeMLModels();
    }
    initializeDefaultTriggers() {
        const defaultTriggers = [
            {
                id: 'low_balance_alert',
                name: 'Low Balance Alert',
                type: 'threshold',
                config: {
                    threshold: {
                        metric: 'balance',
                        operator: 'lt',
                        value: 100,
                        token: '0x765DE816845861e75A25fCA122bb6898B8B1282a' // cUSD
                    }
                },
                enabled: true,
                priority: 1
            },
            {
                id: 'high_gas_price',
                name: 'High Gas Price',
                type: 'threshold',
                config: {
                    threshold: {
                        metric: 'gas_price',
                        operator: 'gt',
                        value: 20
                    }
                },
                enabled: true,
                priority: 2
            },
            {
                id: 'daily_rebalance',
                name: 'Daily Rebalance',
                type: 'schedule',
                config: {
                    schedule: {
                        interval: 'daily',
                        time: '09:00',
                        timezone: 'UTC'
                    }
                },
                enabled: true,
                priority: 3
            },
            {
                id: 'donation_received',
                name: 'Donation Received',
                type: 'event',
                config: {
                    event: {
                        contractAddress: '0x0000000000000000000000000000000000000000',
                        eventName: 'DonationReceived',
                        filter: {}
                    }
                },
                enabled: true,
                priority: 4
            },
            {
                id: 'yield_optimization',
                name: 'Yield Optimization',
                type: 'ml_prediction',
                config: {
                    ml_prediction: {
                        model: 'yield_predictor',
                        features: ['apy', 'volume', 'risk_score'],
                        threshold: 0.7
                    }
                },
                enabled: true,
                priority: 5
            },
            {
                id: 'price_arbitrage',
                name: 'Price Arbitrage Opportunity',
                type: 'threshold',
                config: {
                    threshold: {
                        metric: 'price',
                        operator: 'gt',
                        value: 0.05
                    }
                },
                enabled: true,
                priority: 6
            },
            {
                id: 'trading_volume_spike',
                name: 'Trading Volume Spike',
                type: 'threshold',
                config: {
                    threshold: {
                        metric: 'volume',
                        operator: 'gt',
                        value: 1000000
                    }
                },
                enabled: true,
                priority: 7
            }
        ];
        defaultTriggers.forEach(trigger => {
            this.triggers.set(trigger.id, trigger);
        });
    }
    initializeDefaultRules() {
        const defaultRules = [
            {
                id: 'emergency_withdrawal',
                name: 'Emergency Withdrawal',
                triggerId: 'low_balance_alert',
                conditions: [
                    {
                        metric: 'balance',
                        operator: 'lt',
                        value: 50,
                        weight: 1.0
                    }
                ],
                actions: [
                    {
                        type: 'transfer',
                        config: {
                            to: 'emergency_wallet',
                            amount: 'all',
                            token: 'cUSD'
                        }
                    }
                ],
                priority: 1,
                enabled: true
            },
            {
                id: 'gas_optimization',
                name: 'Gas Price Optimization',
                triggerId: 'high_gas_price',
                conditions: [
                    {
                        metric: 'gas_price',
                        operator: 'gt',
                        value: 20,
                        weight: 0.8
                    }
                ],
                actions: [
                    {
                        type: 'notify',
                        config: {
                            message: 'High gas prices detected, delaying transactions',
                            channel: 'telegram'
                        }
                    }
                ],
                priority: 2,
                enabled: true
            },
            {
                id: 'portfolio_rebalance',
                name: 'Portfolio Rebalance',
                triggerId: 'daily_rebalance',
                conditions: [
                    {
                        metric: 'time_since_last_rebalance',
                        operator: 'gte',
                        value: 86400,
                        weight: 1.0
                    }
                ],
                actions: [
                    {
                        type: 'stake',
                        config: {
                            protocol: 'moola',
                            token: 'cUSD',
                            amount: 'auto'
                        }
                    }
                ],
                priority: 3,
                enabled: true
            },
            {
                id: 'donation_processing',
                name: 'Process Donation',
                triggerId: 'donation_received',
                conditions: [
                    {
                        metric: 'donation_amount',
                        operator: 'gt',
                        value: 0,
                        weight: 1.0
                    }
                ],
                actions: [
                    {
                        type: 'transfer',
                        config: {
                            to: 'splitter_contract',
                            amount: 'all',
                            token: 'auto'
                        }
                    },
                    {
                        type: 'mint',
                        config: {
                            recipient: 'donor',
                            metadata: 'donation_receipt',
                            soulbound: false
                        }
                    }
                ],
                priority: 4,
                enabled: true
            },
            {
                id: 'arbitrage_trading',
                name: 'Arbitrage Trading',
                triggerId: 'price_arbitrage',
                conditions: [
                    {
                        metric: 'price_difference',
                        operator: 'gt',
                        value: 0.05,
                        weight: 1.0
                    }
                ],
                actions: [
                    {
                        type: 'buy',
                        config: {
                            token: 'auto',
                            amount: 'auto',
                            maxPrice: 'auto'
                        }
                    },
                    {
                        type: 'sell',
                        config: {
                            token: 'auto',
                            amount: 'auto',
                            minPrice: 'auto'
                        }
                    }
                ],
                priority: 5,
                enabled: true
            },
            {
                id: 'volume_based_trading',
                name: 'Volume-Based Trading',
                triggerId: 'trading_volume_spike',
                conditions: [
                    {
                        metric: 'volume',
                        operator: 'gt',
                        value: 1000000,
                        weight: 0.8
                    }
                ],
                actions: [
                    {
                        type: 'buy',
                        config: {
                            token: 'cUSD',
                            amount: '1000',
                            maxPrice: '1.02'
                        }
                    }
                ],
                priority: 6,
                enabled: true
            },
            {
                id: 'request_liquidity',
                name: 'Request Liquidity',
                triggerId: 'low_balance_alert',
                conditions: [
                    {
                        metric: 'balance',
                        operator: 'lt',
                        value: 100,
                        weight: 1.0
                    }
                ],
                actions: [
                    {
                        type: 'request',
                        config: {
                            tokenIn: 'cUSD',
                            tokenOut: 'CELO',
                            amountIn: '1000',
                            amountOut: 'auto'
                        }
                    }
                ],
                priority: 7,
                enabled: true
            }
        ];
        defaultRules.forEach(rule => {
            this.rules.set(rule.id, rule);
        });
    }
    initializeMLModels() {
        const defaultModels = [
            {
                id: 'yield_predictor',
                name: 'Yield Prediction Model',
                type: 'regression',
                features: ['apy', 'volume', 'risk_score', 'liquidity'],
                weights: [0.4, 0.3, 0.2, 0.1],
                threshold: 0.7,
                trainingData: [
                    [5.2, 1000000, 0.3, 5000000],
                    [3.8, 500000, 0.5, 2000000],
                    [7.1, 2000000, 0.2, 8000000]
                ],
                accuracy: 0.85
            },
            {
                id: 'anomaly_detector',
                name: 'Anomaly Detection Model',
                type: 'anomaly_detection',
                features: ['transaction_frequency', 'amount_variance', 'time_patterns'],
                weights: [0.5, 0.3, 0.2],
                threshold: 0.8,
                trainingData: [
                    [10, 0.1, 0.8],
                    [50, 0.3, 0.6],
                    [5, 0.05, 0.9]
                ],
                accuracy: 0.92
            },
            {
                id: 'risk_assessor',
                name: 'Risk Assessment Model',
                type: 'classification',
                features: ['volatility', 'liquidity', 'historical_performance'],
                weights: [0.4, 0.4, 0.2],
                threshold: 0.6,
                trainingData: [
                    [0.2, 0.8, 0.7],
                    [0.5, 0.6, 0.4],
                    [0.1, 0.9, 0.8]
                ],
                accuracy: 0.88
            }
        ];
        defaultModels.forEach(model => {
            this.mlModels.set(model.id, model);
        });
    }
    async evaluateTriggers(agentId, currentState, memory) {
        const activeTriggers = [];
        for (const trigger of this.triggers.values()) {
            if (!trigger.enabled)
                continue;
            const isTriggered = await this.evaluateTrigger(trigger, currentState, memory);
            if (isTriggered) {
                activeTriggers.push(trigger);
            }
        }
        return activeTriggers.sort((a, b) => a.priority - b.priority);
    }
    async evaluateTrigger(trigger, currentState, memory) {
        switch (trigger.type) {
            case 'threshold':
                return this.evaluateThresholdTrigger(trigger, currentState);
            case 'schedule':
                return this.evaluateScheduleTrigger(trigger, currentState);
            case 'event':
                return this.evaluateEventTrigger(trigger, currentState);
            case 'pattern':
                return this.evaluatePatternTrigger(trigger, memory);
            case 'ml_prediction':
                return this.evaluateMLTrigger(trigger, currentState, memory);
            default:
                return false;
        }
    }
    evaluateThresholdTrigger(trigger, currentState) {
        const config = trigger.config.threshold;
        if (!config)
            return false;
        const value = this.getMetricValue(currentState, config.metric, config.token);
        return this.compareValues(value, config.operator, config.value);
    }
    evaluateScheduleTrigger(trigger, currentState) {
        const config = trigger.config.schedule;
        if (!config)
            return false;
        const now = new Date();
        const lastRun = this.getLastRunTime(trigger.id);
        switch (config.interval) {
            case 'hourly':
                return now.getTime() - lastRun.getTime() >= 3600000;
            case 'daily':
                return now.getTime() - lastRun.getTime() >= 86400000;
            case 'weekly':
                return now.getTime() - lastRun.getTime() >= 604800000;
            case 'monthly':
                return now.getTime() - lastRun.getTime() >= 2592000000;
            default:
                return false;
        }
    }
    evaluateEventTrigger(trigger, currentState) {
        const config = trigger.config.event;
        if (!config)
            return false;
        const events = currentState.recentEvents || [];
        return events.some((event) => event.address === config.contractAddress &&
            event.name === config.eventName);
    }
    evaluatePatternTrigger(trigger, memory) {
        const config = trigger.config.pattern;
        if (!config)
            return false;
        const recentActions = memory.actions.slice(-config.sequence.length);
        const actionSequence = recentActions.map(action => action.type);
        return this.sequenceMatches(actionSequence, config.sequence) &&
            this.getConfidence(actionSequence, config.sequence) >= config.confidence;
    }
    async evaluateMLTrigger(trigger, currentState, memory) {
        const config = trigger.config.ml_prediction;
        if (!config)
            return false;
        const model = this.mlModels.get(config.model);
        if (!model)
            return false;
        const features = this.extractFeatures(currentState, memory, config.features);
        const prediction = this.runMLModel(model, features);
        return prediction >= config.threshold;
    }
    async generateDecision(agentId, currentState, memory) {
        const activeTriggers = await this.evaluateTriggers(agentId, currentState, memory);
        if (activeTriggers.length === 0) {
            return {
                action: 'none',
                params: {},
                reasoning: 'No triggers activated',
                confidence: 1.0,
                triggeredBy: []
            };
        }
        const applicableRules = this.findApplicableRules(activeTriggers, currentState, memory);
        if (applicableRules.length === 0) {
            return {
                action: 'none',
                params: {},
                reasoning: 'No applicable rules found',
                confidence: 0.5,
                triggeredBy: activeTriggers.map(t => t.id)
            };
        }
        const bestRule = this.selectBestRule(applicableRules, currentState, memory);
        const action = this.executeRule(bestRule, currentState, memory);
        return {
            action: action.type,
            params: action.config,
            reasoning: `Executed rule: ${bestRule.name} based on triggers: ${activeTriggers.map(t => t.name).join(', ')}`,
            confidence: this.calculateConfidence(bestRule, currentState, memory),
            triggeredBy: activeTriggers.map(t => t.id)
        };
    }
    findApplicableRules(triggers, currentState, memory) {
        const applicableRules = [];
        for (const rule of this.rules.values()) {
            if (!rule.enabled)
                continue;
            const isTriggered = triggers.some(trigger => trigger.id === rule.triggerId);
            if (!isTriggered)
                continue;
            const conditionsMet = this.evaluateRuleConditions(rule, currentState, memory);
            if (conditionsMet) {
                applicableRules.push(rule);
            }
        }
        return applicableRules.sort((a, b) => a.priority - b.priority);
    }
    evaluateRuleConditions(rule, currentState, memory) {
        return rule.conditions.every(condition => {
            const value = this.getMetricValue(currentState, condition.metric);
            return this.compareValues(value, condition.operator, condition.value);
        });
    }
    selectBestRule(rules, currentState, memory) {
        let bestRule = rules[0];
        let bestScore = this.calculateRuleScore(bestRule, currentState, memory);
        for (let i = 1; i < rules.length; i++) {
            const score = this.calculateRuleScore(rules[i], currentState, memory);
            if (score > bestScore) {
                bestRule = rules[i];
                bestScore = score;
            }
        }
        return bestRule;
    }
    calculateRuleScore(rule, currentState, memory) {
        let score = 0;
        for (const condition of rule.conditions) {
            const value = this.getMetricValue(currentState, condition.metric);
            const conditionMet = this.compareValues(value, condition.operator, condition.value);
            score += conditionMet ? condition.weight : 0;
        }
        return score / rule.conditions.length;
    }
    executeRule(rule, currentState, memory) {
        const action = rule.actions[0];
        if (action.config.amount === 'auto') {
            action.config.amount = this.calculateOptimalAmount(currentState, action.type);
        }
        if (action.config.to === 'emergency_wallet') {
            action.config.to = this.getEmergencyWallet();
        }
        if (action.config.token === 'auto') {
            action.config.token = this.selectOptimalToken(currentState);
        }
        return action;
    }
    getMetricValue(currentState, metric, token) {
        switch (metric) {
            case 'balance':
                return token ? currentState.tokenBalances?.[token] || 0 : currentState.celoBalance || 0;
            case 'gas_price':
                return currentState.gasPrice || 0;
            case 'apy':
                return currentState.currentAPY || 0;
            case 'volume':
                return currentState.tradingVolume || 0;
            case 'time_since_last_rebalance':
                return currentState.timeSinceLastRebalance || 0;
            case 'donation_amount':
                return currentState.donationAmount || 0;
            default:
                return 0;
        }
    }
    compareValues(actual, operator, expected) {
        switch (operator) {
            case 'gt': return actual > expected;
            case 'lt': return actual < expected;
            case 'eq': return actual === expected;
            case 'gte': return actual >= expected;
            case 'lte': return actual <= expected;
            case 'contains': return String(actual).includes(String(expected));
            case 'matches': return String(actual).match(String(expected)) !== null;
            default: return false;
        }
    }
    getLastRunTime(triggerId) {
        // For server-side environments, we'll use a simple in-memory cache
        // In production, this should be replaced with a proper database or cache
        return new Date(0);
    }
    sequenceMatches(actual, expected) {
        if (actual.length !== expected.length)
            return false;
        return actual.every((action, index) => action === expected[index]);
    }
    getConfidence(actual, expected) {
        const matches = actual.filter((action, index) => action === expected[index]).length;
        return matches / expected.length;
    }
    extractFeatures(currentState, memory, features) {
        return features.map(feature => {
            switch (feature) {
                case 'apy': return currentState.currentAPY || 0;
                case 'volume': return currentState.tradingVolume || 0;
                case 'risk_score': return this.calculateRiskScore(currentState, memory);
                case 'liquidity': return currentState.liquidity || 0;
                case 'transaction_frequency': return memory.actions.length;
                case 'amount_variance': return this.calculateAmountVariance(memory);
                case 'time_patterns': return this.calculateTimePatterns(memory);
                case 'volatility': return currentState.volatility || 0;
                case 'historical_performance': return this.calculateHistoricalPerformance(memory);
                default: return 0;
            }
        });
    }
    runMLModel(model, features) {
        if (features.length !== model.features.length)
            return 0;
        let prediction = 0;
        for (let i = 0; i < features.length; i++) {
            prediction += features[i] * model.weights[i];
        }
        switch (model.type) {
            case 'classification':
                return prediction >= (model.threshold || 0.5) ? 1 : 0;
            case 'regression':
                return Math.max(0, Math.min(1, prediction));
            case 'clustering':
                return this.performClustering(features, model);
            case 'anomaly_detection':
                return this.detectAnomaly(features, model);
            default:
                return prediction;
        }
    }
    performClustering(features, model) {
        const distances = model.trainingData.map(trainingPoint => this.calculateDistance(features, trainingPoint));
        const minDistance = Math.min(...distances);
        return 1 - (minDistance / Math.max(...distances));
    }
    detectAnomaly(features, model) {
        const distances = model.trainingData.map(trainingPoint => this.calculateDistance(features, trainingPoint));
        const avgDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
        return avgDistance > (model.threshold || 0.5) ? 1 : 0;
    }
    calculateDistance(point1, point2) {
        if (point1.length !== point2.length)
            return Infinity;
        let sum = 0;
        for (let i = 0; i < point1.length; i++) {
            sum += Math.pow(point1[i] - point2[i], 2);
        }
        return Math.sqrt(sum);
    }
    calculateRiskScore(currentState, memory) {
        const factors = [
            currentState.volatility || 0,
            (memory.actions.length / 100), // Normalize action frequency
            this.calculateAmountVariance(memory)
        ];
        return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    }
    calculateAmountVariance(memory) {
        const amounts = memory.actions
            .filter(action => action.params?.amount)
            .map(action => parseFloat(action.params.amount) || 0);
        if (amounts.length < 2)
            return 0;
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
        return Math.sqrt(variance) / mean; // Coefficient of variation
    }
    calculateTimePatterns(memory) {
        const timestamps = memory.actions.map(action => action.timestamp.getTime());
        if (timestamps.length < 2)
            return 0;
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }
        const meanInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - meanInterval, 2), 0) / intervals.length;
        return 1 - (Math.sqrt(variance) / meanInterval); // Regularity score
    }
    calculateHistoricalPerformance(memory) {
        const successfulActions = memory.actions.filter(action => action.success).length;
        return memory.actions.length > 0 ? successfulActions / memory.actions.length : 0;
    }
    calculateOptimalAmount(currentState, actionType) {
        switch (actionType) {
            case 'stake':
                return Math.min(currentState.cusdBalance * 0.8, 1000).toString();
            case 'transfer':
                return Math.min(currentState.cusdBalance * 0.1, 100).toString();
            default:
                return '100';
        }
    }
    getEmergencyWallet() {
        return '0x0000000000000000000000000000000000000000';
    }
    selectOptimalToken(currentState) {
        const balances = {
            cUSD: currentState.cusdBalance || 0,
            cEUR: currentState.ceurBalance || 0,
            CELO: currentState.celoBalance || 0
        };
        return Object.entries(balances).reduce((a, b) => balances[a[0]] > balances[b[0]] ? a : b)[0];
    }
    calculateConfidence(rule, currentState, memory) {
        const conditionScores = rule.conditions.map(condition => {
            const value = this.getMetricValue(currentState, condition.metric);
            const conditionMet = this.compareValues(value, condition.operator, condition.value);
            return conditionMet ? condition.weight : 0;
        });
        return conditionScores.reduce((sum, score) => sum + score, 0) / conditionScores.length;
    }
    addTrigger(trigger) {
        this.triggers.set(trigger.id, trigger);
    }
    addRule(rule) {
        this.rules.set(rule.id, rule);
    }
    addMLModel(model) {
        this.mlModels.set(model.id, model);
    }
    getTriggers() {
        return Array.from(this.triggers.values());
    }
    getRules() {
        return Array.from(this.rules.values());
    }
    getMLModels() {
        return Array.from(this.mlModels.values());
    }
}
exports.DecisionEngine = DecisionEngine;
//# sourceMappingURL=decision-engine.js.map