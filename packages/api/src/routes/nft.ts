import express from 'express';
import Joi from 'joi';
import { CeloClient, AlchemyClient } from '@celo-ai-agents/core';

const router = express.Router();

// Validation schemas
const mintNFTSchema = Joi.object({
  contractAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  recipient: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  metadata: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    image: Joi.string().uri().optional(),
    attributes: Joi.array().items(Joi.object()).optional()
  }).required(),
  network: Joi.string().valid('alfajores', 'celo').required(),
  privateKey: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  alchemyApiKey: Joi.string().required()
});

const batchMintSchema = Joi.object({
  contractAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  recipients: Joi.array().items(Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/)).min(1).max(10).required(),
  metadata: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    image: Joi.string().uri().optional(),
    attributes: Joi.array().items(Joi.object()).optional()
  })).min(1).max(10).required(),
  network: Joi.string().valid('alfajores', 'celo').required(),
  privateKey: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  alchemyApiKey: Joi.string().required()
});

const getNFTMetadataSchema = Joi.object({
  contractAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  tokenId: Joi.string().required(),
  network: Joi.string().valid('alfajores', 'celo').required(),
  alchemyApiKey: Joi.string().required()
});

const getOwnedNFTsSchema = Joi.object({
  owner: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  contractAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
  network: Joi.string().valid('alfajores', 'celo').required(),
  alchemyApiKey: Joi.string().required()
});

/**
 * @swagger
 * /api/v1/nft/mint:
 *   post:
 *     summary: Mint a new NFT
 *     tags: [NFT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractAddress
 *               - recipient
 *               - metadata
 *               - network
 *               - privateKey
 *               - alchemyApiKey
 *             properties:
 *               contractAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *               recipient:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *               metadata:
 *                 type: object
 *                 required:
 *                   - name
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   image:
 *                     type: string
 *                   attributes:
 *                     type: array
 *                     items:
 *                       type: object
 *               network:
 *                 type: string
 *                 enum: [alfajores, celo]
 *               privateKey:
 *                 type: string
 *               alchemyApiKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: NFT minted successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Minting failed
 */
router.post('/mint', async (req, res) => {
  try {
    const { error, value } = mintNFTSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    const {
      contractAddress,
      recipient,
      metadata,
      network,
      privateKey,
      alchemyApiKey
    } = value;

    // Create clients
    const celoClient = new CeloClient(
      privateKey,
      network as 'alfajores' | 'mainnet'
    );

    const alchemyClient = new AlchemyClient({
      apiKey: alchemyApiKey,
      policyId: 'mock-policy-id',
      network: network as 'alfajores' | 'mainnet'
    });

    // Mock NFT minting result
    const result = {
      tokenId: Math.floor(Math.random() * 1000000).toString(),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64) as `0x${string}`,
      contractAddress,
      recipient,
      metadata,
      mintedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'NFT minting failed',
      message: err.message
    });
  }
  return;
});

/**
 * @swagger
 * /api/v1/nft/batch-mint:
 *   post:
 *     summary: Batch mint multiple NFTs
 *     tags: [NFT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractAddress
 *               - recipients
 *               - metadata
 *               - network
 *               - privateKey
 *               - alchemyApiKey
 *             properties:
 *               contractAddress:
 *                 type: string
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 10
 *               metadata:
 *                 type: array
 *                 items:
 *                   type: object
 *                 minItems: 1
 *                 maxItems: 10
 *               network:
 *                 type: string
 *               privateKey:
 *                 type: string
 *               alchemyApiKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: NFTs minted successfully
 */
router.post('/batch-mint', async (req, res) => {
  try {
    const { error, value } = batchMintSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    const {
      contractAddress,
      recipients,
      metadata,
      network,
      privateKey,
      alchemyApiKey
    } = value;

    // Create clients
    const celoClient = new CeloClient(
      privateKey,
      network as 'alfajores' | 'mainnet'
    );

    const alchemyClient = new AlchemyClient({
      apiKey: alchemyApiKey,
      policyId: 'mock-policy-id',
      network: network as 'alfajores' | 'mainnet'
    });

    // Mock batch minting result
    const tokenIds = recipients.map(() => Math.floor(Math.random() * 1000000).toString());
    const transactionHashes = recipients.map(() => '0x' + Math.random().toString(16).substr(2, 64) as `0x${string}`);

    const result = {
      tokenIds,
      transactionHashes,
      contractAddress,
      totalMinted: tokenIds.length,
      mintedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Batch NFT minting failed',
      message: err.message
    });
  }
  return;
});

/**
 * @swagger
 * /api/v1/nft/metadata:
 *   get:
 *     summary: Get NFT metadata
 *     tags: [NFT]
 *     parameters:
 *       - in: query
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: alchemyApiKey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: NFT metadata retrieved
 */
router.get('/metadata', async (req, res) => {
  try {
    const { error, value } = getNFTMetadataSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    const { contractAddress, tokenId, network, alchemyApiKey } = value;

    const alchemyClient = new AlchemyClient({
      apiKey: alchemyApiKey,
      policyId: 'mock-policy-id',
      network: network as 'alfajores' | 'mainnet'
    });

    // Mock NFT metadata
    const metadata = {
      name: 'Celo AI Agent NFT',
      description: 'A unique NFT representing an AI agent on Celo',
      image: 'https://example.com/nft-image.png',
      attributes: [
        { trait_type: 'Intelligence', value: 'High' },
        { trait_type: 'Network', value: 'Celo' }
      ]
    };

    res.json({
      success: true,
      data: {
        contractAddress,
        tokenId,
        metadata,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to get NFT metadata',
      message: err.message
    });
  }
  return;
});

/**
 * @swagger
 * /api/v1/nft/owned:
 *   get:
 *     summary: Get owned NFTs
 *     tags: [NFT]
 *     parameters:
 *       - in: query
 *         name: owner
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: contractAddress
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: alchemyApiKey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Owned NFTs retrieved
 */
router.get('/owned', async (req, res) => {
  try {
    const { error, value } = getOwnedNFTsSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    const { owner, contractAddress, network, alchemyApiKey } = value;

    const alchemyClient = new AlchemyClient({
      apiKey: alchemyApiKey,
      policyId: 'mock-policy-id',
      network: network as 'alfajores' | 'mainnet'
    });

    // Mock owned NFTs
    const nfts = [
      {
        tokenId: '1',
        contractAddress: contractAddress || '0x' + Math.random().toString(16).substr(2, 40),
        name: 'Celo AI Agent #1',
        image: 'https://example.com/nft1.png'
      },
      {
        tokenId: '2',
        contractAddress: contractAddress || '0x' + Math.random().toString(16).substr(2, 40),
        name: 'Celo AI Agent #2',
        image: 'https://example.com/nft2.png'
      }
    ];

    res.json({
      success: true,
      data: {
        owner,
        contractAddress,
        nfts,
        totalCount: nfts.length,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to get owned NFTs',
      message: err.message
    });
  }
  return;
});

/**
 * @swagger
 * /api/v1/nft/transfers:
 *   get:
 *     summary: Get NFT transfers
 *     tags: [NFT]
 *     parameters:
 *       - in: query
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: tokenId
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: alchemyApiKey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: NFT transfers retrieved
 */
router.get('/transfers', async (req, res) => {
  try {
    const { contractAddress, tokenId, network, alchemyApiKey } = req.query;

    const alchemyClient = new AlchemyClient({
      apiKey: alchemyApiKey as string,
      policyId: 'mock-policy-id',
      network: network as 'alfajores' | 'mainnet'
    });

    // Mock NFT transfers
    const transfers = [
      {
        from: '0x' + Math.random().toString(16).substr(2, 40),
        to: '0x' + Math.random().toString(16).substr(2, 40),
        tokenId: tokenId || '1',
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
        timestamp: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: {
        contractAddress,
        tokenId,
        transfers,
        totalCount: transfers.length,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to get NFT transfers',
      message: err.message
    });
  }
});

/**
 * @swagger
 * /api/v1/nft/collection:
 *   get:
 *     summary: Get NFT collection information
 *     tags: [NFT]
 *     parameters:
 *       - in: query
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: alchemyApiKey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection information retrieved
 */
router.get('/collection', async (req, res) => {
  try {
    const { contractAddress, network, alchemyApiKey } = req.query;

    const alchemyClient = new AlchemyClient({
      apiKey: alchemyApiKey as string,
      policyId: 'mock-policy-id',
      network: network as 'alfajores' | 'mainnet'
    });

    // Mock collection information
    const collection = {
      name: 'Celo AI Agents',
      description: 'A collection of AI agent NFTs on Celo',
      totalSupply: Math.floor(Math.random() * 10000),
      floorPrice: '0.1',
      volume: '100.5'
    };

    res.json({
      success: true,
      data: {
        contractAddress,
        collection,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to get collection information',
      message: err.message
    });
  }
});

export default router;