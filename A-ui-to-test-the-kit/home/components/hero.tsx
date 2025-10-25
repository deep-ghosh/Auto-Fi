"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import React, { useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { useRouter } from "next/navigation"

function HeroCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)

      setDisplayValue(Math.floor(value * progress))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{displayValue}</span>
}

export default function Hero() {
  const { connect, wallet } = useWallet()
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      await connect()
      // Redirect to dashboard after successful connection
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      setIsConnecting(false)
    }
  }
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-linear-to-b from-background via-background to-muted/20">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-10 w-80 h-80 bg-primary/12 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-80 h-80 bg-secondary/12 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-full mb-8 glass-dark hover:border-primary/50 transition-smooth"
        >
          <motion.span
            className="w-2.5 h-2.5 bg-success rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <span className="text-sm font-semibold text-primary">Web3 Automation on Celo</span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight"
        >
          Automate Payments, NFTs, Swaps & DAO Tasks
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Transparent, low-cost, mobile-first blockchain automation for everyone. Build powerful workflows without code.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth hover-lift group w-full sm:w-auto font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 rounded-full"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-smooth" size={20} />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/tools">
              <Button
                size="lg"
                variant="outline"
                className="border-primary/40 hover:bg-primary/8 bg-transparent transition-smooth hover-lift w-full sm:w-auto font-semibold rounded-full"
              >
                <Sparkles size={18} className="mr-2" />
                Explore Tools
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
          {[
            { value: 50, label: "Automation Tools", icon: "⚡" },
            { value: 1000, label: "Active Users", icon: "👥" },
            { value: 10, label: "Supported Chains", icon: "🔗" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="p-5 bg-card/40 glass rounded-full border border-border/40 hover:border-primary/50 transition-smooth hover-lift group backdrop-blur-sm"
              whileHover={{ y: -6 }}
            >
              <motion.div className="text-3xl mb-2" whileHover={{ scale: 1.2 }}>
                {stat.icon}
              </motion.div>
              <motion.div className="text-2xl sm:text-3xl font-bold text-primary group-hover:scale-110 transition-smooth">
                <HeroCounter value={stat.value} />
                {stat.label === "Automation Tools" && "+"}
              </motion.div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
