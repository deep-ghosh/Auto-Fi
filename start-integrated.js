#!/usr/bin/env node

/**
 * Integrated Startup Script
 * Starts both Backend and Frontend with proper integration
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class IntegratedStarter {
  constructor() {
    this.backendProcess = null
    this.frontendProcess = null
    this.isShuttingDown = false
  }

  async start() {
    console.log('🚀 Starting Celo AI Automation Platform (Integrated)')
    console.log('================================================\n')

    // Check if Backend exists
    const backendPath = join(__dirname, 'Backend')
    const frontendPath = join(__dirname, 'Frontend')

    if (!fs.existsSync(backendPath)) {
      console.error('❌ Backend directory not found!')
      process.exit(1)
    }

    if (!fs.existsSync(frontendPath)) {
      console.error('❌ Frontend directory not found!')
      process.exit(1)
    }

    // Start Backend first
    await this.startBackend()
    
    // Wait a bit for Backend to initialize
    await this.sleep(3000)
    
    // Start Frontend
    await this.startFrontend()

    // Setup graceful shutdown
    this.setupGracefulShutdown()
  }

  async startBackend() {
    console.log('🔧 Starting Backend...')
    
    return new Promise((resolve, reject) => {
      this.backendProcess = spawn('node', ['automation-system.js'], {
        cwd: join(__dirname, 'Backend'),
        stdio: 'pipe',
        shell: true
      })

      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString()
        if (output.includes('Server running on port')) {
          console.log('✅ Backend started successfully')
          resolve()
        }
        console.log(`[Backend] ${output.trim()}`)
      })

      this.backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data.toString().trim()}`)
      })

      this.backendProcess.on('error', (error) => {
        console.error('❌ Failed to start Backend:', error.message)
        reject(error)
      })

      this.backendProcess.on('exit', (code) => {
        if (code !== 0 && !this.isShuttingDown) {
          console.error(`❌ Backend exited with code ${code}`)
        }
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.backendProcess.killed) {
          console.log('✅ Backend startup timeout reached (assuming started)')
          resolve()
        }
      }, 30000)
    })
  }

  async startFrontend() {
    console.log('🎨 Starting Frontend...')
    
    return new Promise((resolve, reject) => {
      this.frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: join(__dirname, 'Frontend'),
        stdio: 'pipe',
        shell: true
      })

      this.frontendProcess.stdout.on('data', (data) => {
        const output = data.toString()
        if (output.includes('Local:') || output.includes('Ready in')) {
          console.log('✅ Frontend started successfully on port 3002')
          resolve()
        }
        console.log(`[Frontend] ${output.trim()}`)
      })

      this.frontendProcess.stderr.on('data', (data) => {
        console.error(`[Frontend Error] ${data.toString().trim()}`)
      })

      this.frontendProcess.on('error', (error) => {
        console.error('❌ Failed to start Frontend:', error.message)
        reject(error)
      })

      this.frontendProcess.on('exit', (code) => {
        if (code !== 0 && !this.isShuttingDown) {
          console.error(`❌ Frontend exited with code ${code}`)
        }
      })

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!this.frontendProcess.killed) {
          console.log('✅ Frontend startup timeout reached (assuming started)')
          resolve()
        }
      }, 60000)
    })
  }

  setupGracefulShutdown() {
    const shutdown = () => {
      if (this.isShuttingDown) return
      this.isShuttingDown = true

      console.log('\n🛑 Shutting down integrated platform...')

      if (this.frontendProcess) {
        console.log('Stopping Frontend...')
        this.frontendProcess.kill('SIGTERM')
      }

      if (this.backendProcess) {
        console.log('Stopping Backend...')
        this.backendProcess.kill('SIGTERM')
      }

      setTimeout(() => {
        console.log('✅ Shutdown complete')
        process.exit(0)
      }, 2000)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    process.on('exit', shutdown)
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Start the integrated platform
const starter = new IntegratedStarter()
starter.start().catch(error => {
  console.error('❌ Failed to start integrated platform:', error)
  process.exit(1)
})
