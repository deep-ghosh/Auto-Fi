"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, CheckCircle, AlertCircle, Zap } from "lucide-react"
import { motion } from "framer-motion"

interface StatItem {
  label: string
  value: string | number
  trend: string
  icon: typeof TrendingUp
  color: string
  delay: number
}

const stats: StatItem[] = [
  {
    label: "Total Transactions",
    value: "1,234",
    trend: "↑ 12% this month",
    icon: TrendingUp,
    color: "border-l-primary",
    delay: 0,
  },
  {
    label: "Success Rate",
    value: "98.5%",
    trend: "↑ 2.3% improvement",
    icon: CheckCircle,
    color: "border-l-success",
    delay: 0.1,
  },
  {
    label: "Total Volume",
    value: "$234.5K",
    trend: "↑ 45% this month",
    icon: Zap,
    color: "border-l-accent",
    delay: 0.2,
  },
  {
    label: "Failed Executions",
    value: "18",
    trend: "↓ 5 from last month",
    icon: AlertCircle,
    color: "border-l-destructive",
    delay: 0.3,
  },
]

export default function AnalyticsStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay, duration: 0.5 }}
          >
            <Card className={`p-6 ${stat.color} border-l-4 glass hover:glass-dark transition-smooth hover-lift group`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2 group-hover:text-primary transition-smooth">
                    {stat.value}
                  </p>
                  <p className="text-xs text-success mt-1">{stat.trend}</p>
                </div>
                <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                  <Icon className="group-hover:scale-110 transition-smooth" size={32} />
                </motion.div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
