"use client"

import { useEffect } from "react"
import { useStore, type Automation } from "@/lib/store"
import Navbar from "@/components/navbar"
import DashboardOverview from "@/components/dashboard/overview"
import DashboardCards from "@/components/dashboard/cards"
import RecentActivity from "@/components/dashboard/recent-activity"
import { motion } from "framer-motion"

export default function Dashboard() {
  const { wallet, automations, addAutomation, setLoading, setError } = useStore()

  useEffect(() => {
    // Initialize with sample data if empty
    if (automations.length === 0) {
      setLoading(true)
      try {
        const sampleAutomations: Automation[] = [
          {
            id: "1",
            name: "Weekly Payroll",
            type: "transaction",
            status: "active",
            progress: 85,
            nextRun: "In 2 days",
            createdAt: new Date(),
          },
          {
            id: "2",
            name: "Price Alert - CELO/USD",
            type: "swap",
            status: "active",
            progress: 100,
            nextRun: "Monitoring",
            createdAt: new Date(),
          },
          {
            id: "3",
            name: "NFT Airdrop Campaign",
            type: "nft",
            status: "paused",
            progress: 45,
            nextRun: "Manual trigger",
            createdAt: new Date(),
          },
          {
            id: "4",
            name: "DAO Treasury Split",
            type: "dao",
            status: "active",
            progress: 60,
            nextRun: "In 5 days",
            createdAt: new Date(),
          },
        ]
        sampleAutomations.forEach((auto) => addAutomation(auto))
      } catch (error) {
        setError("Failed to load automations")
        console.error("[v0] Error loading automations:", error)
      } finally {
        setLoading(false)
      }
    }
  }, [automations.length, addAutomation, setLoading, setError])

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardOverview />
        <DashboardCards />
        <RecentActivity />
      </motion.div>
    </main>
  )
}
