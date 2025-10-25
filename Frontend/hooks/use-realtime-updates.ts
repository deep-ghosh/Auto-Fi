/**
 * useRealtimeUpdates Hook
 * Manages WebSocket connections for real-time blockchain and automation updates
 */

"use client"

import { useEffect, useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { blockchainIntegration, type BlockchainEvent } from "@/lib/blockchain-integration"
import { apiClient } from "@/lib/api-client"

export interface RealtimeUpdate {
  type: 'automation' | 'transaction' | 'price' | 'balance' | 'system'
  data: any
  timestamp: number
}

export function useRealtimeUpdates() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null)
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const { 
    wallet, 
    automations, 
    updateAutomation, 
    refreshWalletInfo,
    loadAnalytics 
  } = useStore()

  // Connect to WebSocket
  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      // Connect to Backend WebSocket
      const ws = apiClient.connectWebSocket((data: any) => {
        handleWebSocketMessage(data)
      })
      
      ws.onopen = () => {
        console.log('Backend WebSocket connected')
        setIsConnected(true)
      }
      
      ws.onclose = () => {
        console.log('Backend WebSocket disconnected')
        setIsConnected(false)
      }
      
      ws.onerror = (error) => {
        console.error('Backend WebSocket error:', error)
        setIsConnected(false)
      }
      
      wsRef.current = ws
      
      // Also connect to blockchain integration for direct blockchain events
      blockchainIntegration.connectWebSocket()
      blockchainIntegration.addEventListener('transaction', handleTransactionUpdate)
      blockchainIntegration.addEventListener('automation', handleAutomationUpdate)
      blockchainIntegration.addEventListener('price', handlePriceUpdate)
      blockchainIntegration.addEventListener('balance', handleBalanceUpdate)
      
    } catch (error) {
      console.error('[useRealtimeUpdates] Failed to connect:', error)
      setIsConnected(false)
    }
  }

  // Handle WebSocket messages from Backend
  const handleWebSocketMessage = (data: any) => {
    try {
      const update: RealtimeUpdate = {
        type: data.type || 'system',
        data: data.payload || data,
        timestamp: data.timestamp || Date.now()
      }
      
      setLastUpdate(update)
      setUpdates(prev => [update, ...prev.slice(0, 49)]) // Keep last 50 updates
      
      // Handle specific update types
      switch (data.type) {
        case 'automation_update':
          handleAutomationUpdate({
            type: 'automation',
            data: data.payload,
            timestamp: Date.now()
          })
          break
        case 'transaction_update':
          handleTransactionUpdate({
            type: 'transaction',
            data: data.payload,
            timestamp: Date.now()
          })
          break
        case 'price_update':
          handlePriceUpdate({
            type: 'price',
            data: data.payload,
            timestamp: Date.now()
          })
          break
        case 'balance_update':
          handleBalanceUpdate({
            type: 'balance',
            data: data.payload,
            timestamp: Date.now()
          })
          break
      }
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error)
    }
  }

  // Disconnect from WebSocket
  const disconnect = () => {
    if (wsRef.current) {
      apiClient.disconnectWebSocket()
      blockchainIntegration.disconnectWebSocket()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  // Handle transaction updates
  const handleTransactionUpdate = (event: BlockchainEvent) => {
    const update: RealtimeUpdate = {
      type: 'transaction',
      data: event.data,
      timestamp: event.timestamp
    }
    
    setLastUpdate(update)
    setUpdates(prev => [update, ...prev.slice(0, 49)]) // Keep last 50 updates
    
    // Refresh wallet info if it's our transaction
    if (wallet.address && event.data.from === wallet.address) {
      refreshWalletInfo(wallet.address)
    }
  }

  // Handle automation updates
  const handleAutomationUpdate = (event: BlockchainEvent) => {
    const update: RealtimeUpdate = {
      type: 'automation',
      data: event.data,
      timestamp: event.timestamp
    }
    
    setLastUpdate(update)
    setUpdates(prev => [update, ...prev.slice(0, 49)])
    
    // Update automation status if it's one of ours
    if (event.data.automationId) {
      const automation = automations.find(a => a.id === event.data.automationId)
      if (automation) {
        updateAutomation(event.data.automationId, {
          status: event.data.status,
          progress: event.data.progress || automation.progress
        })
      }
    }
  }

  // Handle price updates
  const handlePriceUpdate = (event: BlockchainEvent) => {
    const update: RealtimeUpdate = {
      type: 'price',
      data: event.data,
      timestamp: event.timestamp
    }
    
    setLastUpdate(update)
    setUpdates(prev => [update, ...prev.slice(0, 49)])
  }

  // Handle balance updates
  const handleBalanceUpdate = (event: BlockchainEvent) => {
    const update: RealtimeUpdate = {
      type: 'balance',
      data: event.data,
      timestamp: event.timestamp
    }
    
    setLastUpdate(update)
    setUpdates(prev => [update, ...prev.slice(0, 49)])
    
    // Refresh wallet info if it's our address
    if (wallet.address && event.data.address === wallet.address) {
      refreshWalletInfo(wallet.address)
    }
  }

  // Auto-connect when wallet is connected
  useEffect(() => {
    if (wallet.isConnected && !isConnected) {
      connect()
    } else if (!wallet.isConnected && isConnected) {
      disconnect()
    }
  }, [wallet.isConnected, isConnected])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  // Clear updates
  const clearUpdates = () => {
    setUpdates([])
    setLastUpdate(null)
  }

  // Get updates by type
  const getUpdatesByType = (type: RealtimeUpdate['type']) => {
    return updates.filter(update => update.type === type)
  }

  // Get recent updates (last N minutes)
  const getRecentUpdates = (minutes: number = 5) => {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return updates.filter(update => update.timestamp > cutoff)
  }

  return {
    isConnected,
    lastUpdate,
    updates,
    connect,
    disconnect,
    clearUpdates,
    getUpdatesByType,
    getRecentUpdates
  }
}
