/**
 * Token Service - Fetches and manages token data
 * Includes ERC20 token balances, prices, and metadata
 */

import { ethers } from "ethers"
import { getProvider } from "./wallet-service"

// ERC20 ABI (minimal)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function totalSupply() view returns (uint256)",
]

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  balance: string
  price?: number | null
  value?: number
}

// Common Celo tokens (Alfajores testnet)
export const COMMON_TOKENS = {
  CELO: "0x471EcE3750Da237f93B8E339c536989b8978a438",
  cUSD: "0x874069Fa1Eb16D44d62F6a2e4c8B0C1C3b1C5C1C",
  cEUR: "0x10c892A6ECfc32b4C1C6Cb8C1C3b1C5C1C3b1C5C1C",
  cREAL: "0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC",
}

/**
 * Fetch token balance for an address
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<string> {
  try {
    const provider = getProvider()
    if (!provider) throw new Error("Provider not available")

    // Validate addresses
    if (!ethers.isAddress(tokenAddress)) {
      console.warn(`[Token Service] Invalid token address: ${tokenAddress}`)
      return "0"
    }
    if (!ethers.isAddress(walletAddress)) {
      console.warn(`[Token Service] Invalid wallet address: ${walletAddress}`)
      return "0"
    }

    const contract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    )

    const [balance, decimals] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals(),
    ])

    return ethers.formatUnits(balance, decimals)
  } catch (error) {
    console.error("[Token Service] Balance fetch error:", error)
    return "0"
  }
}

/**
 * Fetch token metadata
 */
export async function getTokenMetadata(
  tokenAddress: string
): Promise<Omit<Token, "balance" | "price" | "value">> {
  try {
    const provider = getProvider()
    if (!provider) throw new Error("Provider not available")

    // Validate address
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error(`Invalid token address: ${tokenAddress}`)
    }

    const contract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    )

    const [symbol, name, decimals] = await Promise.all([
      contract.symbol(),
      contract.name(),
      contract.decimals(),
    ])

    return {
      address: tokenAddress,
      symbol,
      name,
      decimals,
    }
  } catch (error) {
    console.error("[Token Service] Metadata fetch error:", error)
    throw error
  }
}

/**
 * Fetch token prices from CoinGecko
 */
export async function getTokenPrice(tokenSymbol: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbol.toLowerCase()}&vs_currencies=usd`
    )
    const data = await response.json()
    return data[tokenSymbol.toLowerCase()]?.usd || null
  } catch (error) {
    console.error("[Token Service] Price fetch error:", error)
    return null
  }
}

/**
 * Fetch multiple token balances for a wallet
 */
export async function getMultipleTokenBalances(
  tokenAddresses: string[],
  walletAddress: string
): Promise<Token[]> {
  try {
    const provider = getProvider()
    if (!provider) throw new Error("Provider not available")

    // Filter out invalid addresses
    const validAddresses = tokenAddresses.filter(addr => ethers.isAddress(addr))
    if (validAddresses.length === 0) {
      console.warn("[Token Service] No valid token addresses provided")
      return []
    }

    const balancePromises = validAddresses.map(async (tokenAddress) => {
      try {
        return await getTokenBalance(tokenAddress, walletAddress)
      } catch (error) {
        console.warn(`[Token Service] Failed to get balance for ${tokenAddress}:`, error)
        return "0"
      }
    })
    
    const metadataPromises = validAddresses.map(async (tokenAddress) => {
      try {
        return await getTokenMetadata(tokenAddress)
      } catch (error) {
        console.warn(`[Token Service] Failed to get metadata for ${tokenAddress}:`, error)
        return null
      }
    })

    const [balances, metadatas] = await Promise.all([
      Promise.all(balancePromises),
      Promise.all(metadataPromises),
    ])

    const tokens: Token[] = []
    for (let i = 0; i < metadatas.length; i++) {
      const metadata = metadatas[i]
      if (!metadata) continue

      try {
        const price = await getTokenPrice(metadata.symbol)
        const balance = balances[i]
        const value = price ? parseFloat(balance) * price : undefined

        tokens.push({
          ...metadata,
          balance,
          price,
          value,
        })
      } catch (error) {
        console.warn(`[Token Service] Failed to process token ${metadata.symbol}:`, error)
      }
    }

    return tokens
  } catch (error) {
    console.error("[Token Service] Multiple balances fetch error:", error)
    return []
  }
}

/**
 * Fetch CELO native token balance
 */
export async function getCeloBalance(walletAddress: string): Promise<string> {
  try {
    const provider = getProvider()
    if (!provider) throw new Error("Provider not available")

    const balance = await provider.getBalance(walletAddress)
    return ethers.formatEther(balance)
  } catch (error) {
    console.error("[Token Service] CELO balance fetch error:", error)
    return "0"
  }
}

/**
 * Get all Celo common tokens with balances
 */
export async function getCeloCommonTokens(
  walletAddress: string
): Promise<Token[]> {
  try {
    const tokenAddresses = Object.values(COMMON_TOKENS)
    const tokens = await getMultipleTokenBalances(tokenAddresses, walletAddress)

    // Add native CELO token
    const celoBalance = await getCeloBalance(walletAddress)
    const celoPrice = await getTokenPrice("celo")

    const celoToken: Token = {
      address: "0x0000000000000000000000000000000000000000",
      symbol: "CELO",
      name: "Celo Native Token",
      decimals: 18,
      balance: celoBalance,
      price: celoPrice || undefined,
      value: celoPrice ? parseFloat(celoBalance) * celoPrice : undefined,
    }

    return [celoToken, ...tokens].filter((token) => parseFloat(token.balance) > 0)
  } catch (error) {
    console.error("[Token Service] Common tokens fetch error:", error)
    return []
  }
}

/**
 * Get token info for a single token
 */
export async function getTokenInfo(
  tokenAddress: string,
  walletAddress: string
): Promise<Token | null> {
  try {
    const [metadata, balance] = await Promise.all([
      getTokenMetadata(tokenAddress),
      getTokenBalance(tokenAddress, walletAddress),
    ])

    const price = await getTokenPrice(metadata.symbol)
    const value = price ? parseFloat(balance) * price : undefined

    return {
      ...metadata,
      balance,
      price,
      value,
    }
  } catch (error) {
    console.error("[Token Service] Token info fetch error:", error)
    return null
  }
}

/**
 * Send token transfer
 */
export async function transferToken(
  tokenAddress: string,
  toAddress: string,
  amount: string
): Promise<string> {
  try {
    const provider = getProvider()
    if (!provider) throw new Error("Provider not available")

    const signer = await provider.getSigner()

    // For CELO native token
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
      })
      return tx.hash
    }

    // For ERC20 tokens
    const contract = new ethers.Contract(
      tokenAddress,
      [
        ...ERC20_ABI,
        "function transfer(address to, uint256 amount) returns (bool)",
      ],
      signer
    )

    const decimals = await contract.decimals()
    const tx = await contract.transfer(
      toAddress,
      ethers.parseUnits(amount, decimals)
    )

    return tx.hash
  } catch (error) {
    console.error("[Token Service] Transfer error:", error)
    throw error
  }
}
