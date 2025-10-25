"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIApi = void 0;
class OpenAIApi {
    constructor() {
        this.name = 'openAI';
        this.displayName = 'OpenAI';
        this.documentationUrl = 'https://platform.openai.com/docs/api-reference';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                description: 'OpenAI API key',
            },
            {
                displayName: 'Model',
                name: 'model',
                type: 'options',
                options: [
                    {
                        name: 'GPT-4',
                        value: 'gpt-4',
                    },
                    {
                        name: 'GPT-4 Turbo',
                        value: 'gpt-4-turbo-preview',
                    },
                    {
                        name: 'GPT-3.5 Turbo',
                        value: 'gpt-3.5-turbo',
                    },
                ],
                default: 'gpt-4',
                description: 'OpenAI model to use',
            },
            {
                displayName: 'Temperature',
                name: 'temperature',
                type: 'number',
                typeOptions: {
                    minValue: 0,
                    maxValue: 2,
                    numberPrecision: 1,
                },
                default: 0.7,
                description: 'Controls randomness in the response (0-2)',
            },
            {
                displayName: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                typeOptions: {
                    minValue: 1,
                    maxValue: 4000,
                },
                default: 1000,
                description: 'Maximum number of tokens to generate',
            },
        ];
    }
}
exports.OpenAIApi = OpenAIApi;
//# sourceMappingURL=OpenAI.credentials.js.map