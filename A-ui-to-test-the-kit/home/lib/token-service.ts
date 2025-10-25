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

// Common Celo tokens
export const COMMON_TOKENS = {
  CELO: "0x471EcE3750Da237f93B8E339c536989b8978a438",
  cUSD: "0x765DE816845861e75A25fCA122bb6bAA3c1EC160",
  cEUR: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6CA73",
  USDC: "0xEBd6F10C2E54d542953453230AC20fee40b537e9",
  USDT: "0x48065fbBE285f1C3894734382312EV95E9AD597d",
  wrapped_AAVE: "0xE4D96b840Efb757ffE68B3aBa9CdA4d090a06Ce9",
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

    const balancePromises = tokenAddresses.map((tokenAddress) =>
      getTokenBalance(tokenAddress, walletAddress)
    )
    const metadataPromises = tokenAddresses.map((tokenAddress) =>
      getTokenMetadata(tokenAddress)
    )

    const [balances, metadatas] = await Promise.all([
      Promise.all(balancePromises),
      Promise.all(metadataPromises),
    ])

    const tokens: Token[] = await Promise.all(
      metadatas.map(async (metadata, index) => {
        const price = await getTokenPrice(metadata.symbol)
        const balance = balances[index]
        const value = price ? parseFloat(balance) * price : undefined

        return {
          ...metadata,
          balance,
          price,
          value,
        }
      })
    )

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
