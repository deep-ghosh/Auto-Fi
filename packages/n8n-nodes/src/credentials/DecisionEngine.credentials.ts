import {
  ICredentialType,
  NodePropertyTypes,
} from 'n8n-workflow';

export class DecisionEngineConfig implements ICredentialType {
  name = 'decisionEngineConfig';
  displayName = 'Decision Engine Configuration';
  properties = [
    {
      displayName: 'Decision Mode',
      name: 'decisionMode',
      type: 'options' as NodePropertyTypes,
      options: [
        { name: 'Trigger-based', value: 'triggers' },
        { name: 'ML Models', value: 'ml' },
        { name: 'Hybrid', value: 'hybrid' },
      ],
      default: 'triggers',
      description: 'The decision-making mode for the agent',
    },
    {
      displayName: 'ML Model Path',
      name: 'mlModelPath',
      type: 'string' as NodePropertyTypes,
      default: '',
      description: 'Path to custom ML model file (optional)',
    },
    {
      displayName: 'Trigger Sensitivity',
      name: 'triggerSensitivity',
      type: 'number' as NodePropertyTypes,
      default: 0.7,
      description: 'Sensitivity for trigger activation (0-1)',
      typeOptions: {
        minValue: 0,
        maxValue: 1,
        stepValue: 0.1,
      },
    },
    {
      displayName: 'Enable Pattern Recognition',
      name: 'enablePatternRecognition',
      type: 'boolean' as NodePropertyTypes,
      default: true,
      description: 'Enable pattern-based decision making',
    },
  ];
}
