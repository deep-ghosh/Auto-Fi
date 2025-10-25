import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class CeloWalletApi implements ICredentialType {
  name = 'celoWallet';
  displayName = 'Celo Wallet';
  documentationUrl = 'https://docs.celo.org/';
  properties: INodeProperties[] = [
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Private key for the Celo wallet',
    },
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        {
          name: 'Alfajores Testnet',
          value: 'alfajores',
        },
        {
          name: 'Celo Mainnet',
          value: 'mainnet',
        },
      ],
      default: 'alfajores',
      description: 'Celo network to connect to',
    },
    {
      displayName: 'RPC URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      description: 'Custom RPC URL (optional, will use default if empty)',
    },
    {
      displayName: 'Agent Registry Address',
      name: 'agentRegistryAddress',
      type: 'string',
      default: '',
      description: 'Address of the deployed AgentRegistry contract',
    },
    {
      displayName: 'Agent Treasury Address',
      name: 'agentTreasuryAddress',
      type: 'string',
      default: '',
      description: 'Address of the deployed AgentTreasury contract',
    },
    {
      displayName: 'Donation Splitter Address',
      name: 'donationSplitterAddress',
      type: 'string',
      default: '',
      description: 'Address of the deployed DonationSplitter contract',
    },
    {
      displayName: 'Yield Aggregator Address',
      name: 'yieldAggregatorAddress',
      type: 'string',
      default: '',
      description: 'Address of the deployed YieldAggregator contract',
    },
    {
      displayName: 'Governance Proxy Address',
      name: 'governanceProxyAddress',
      type: 'string',
      default: '',
      description: 'Address of the deployed GovernanceProxy contract',
    },
    {
      displayName: 'Attendance NFT Address',
      name: 'attendanceNFTAddress',
      type: 'string',
      default: '',
      description: 'Address of the deployed AttendanceNFT contract',
    },
  ];
}
