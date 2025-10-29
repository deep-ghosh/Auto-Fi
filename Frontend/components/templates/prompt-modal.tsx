"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { motion } from "framer-motion"

interface PromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateName?: string
}

export default function PromptModal({ open, onOpenChange, templateName = "Template" }: PromptModalProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    try {
      // Call your AI/model API here
      // Example: const response = await fetch('/api/generate-automation', { method: 'POST', body: JSON.stringify({ prompt }) })
      console.log("Prompt submitted:", prompt)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Success - you can add a toast notification here
      setPrompt("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error processing prompt:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Create Custom Automation
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Describe what you want to automate and let our system generate the workflow for you.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Template Info */}
          {templateName !== "Template" && (
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Based on: <span className="font-semibold text-primary">{templateName}</span>
              </p>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium text-foreground">
              Your Automation Prompt
            </label>
            <Textarea
              id="prompt"
              placeholder="Describe your automation needs... e.g., 'Send USDC payments every Monday to 5 team members from my DAO treasury, split equally'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="min-h-[120px] resize-none bg-muted/30 border-border/50 placeholder:text-muted-foreground/50"
            />
            <p className="text-xs text-muted-foreground">Tip: Press Ctrl+Enter to submit</p>
          </div>

          {/* Character Count */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {prompt.length} characters
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() => {
                  setPrompt("")
                  onOpenChange(false)
                }}
                disabled={isLoading}
                className="rounded-lg"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isLoading}
                className="bg-primary hover:bg-primary/90 rounded-lg gap-2 font-semibold shadow-lg shadow-primary/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Run
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
