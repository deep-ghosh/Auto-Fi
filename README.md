# 🪙 n8n Tools & Workflows for Celo Chain

### Automate Web3 Tasks on the Celo Blockchain Using n8n

This project provides **ready-to-use tools, nodes, and workflows** for integrating the [Celo Blockchain](https://celo.org) into your **n8n** automation environment.
It helps developers and organizations build **Web3-native automations** like payments, contract triggers, data fetching, and notifications — without writing complex backend code.

---

## 🚀 Features

* **Smart Contract Interaction** – Call or read from smart contracts on the Celo chain
* **Wallet Management** – Generate, import, or manage wallets securely
* **Payment Automation** – Automate cUSD, cEUR, or CELO token transfers
* **On-Chain Event Triggers** – Listen to contract events and execute n8n workflows
* **Transaction Monitoring** – Track transaction status and confirmations
* **Multi-Chain Support (Optional)** – Extendable to other EVM-compatible networks
* **Web3 Gateway Integration** – Works with RPC providers like Alchemy, Infura, or Celo’s public nodes

---

## 🧩 Components

### 1. **Celo API Node (Custom Tool)**

A custom n8n node for performing the following:

* `sendTransaction`
* `getBalance`
* `deployContract`
* `readContract`
* `subscribeToEvent`

### 2. **Example Workflows**

| Workflow Name               | Description                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------- |
| **Auto-Payment Workflow**   | Send cUSD to a wallet address when a webhook is triggered (e.g., new user signup). |
| **Event Listener Workflow** | Monitor a specific smart contract event (like NFT mint or transfer).               |
| **Balance Monitor**         | Track wallet balances and alert when below threshold.                              |
| **Gas Fee Estimator**       | Fetch and log average gas fees for analytics.                                      |

---

## ⚙️ Setup Guide

### Prerequisites

* [n8n](https://n8n.io) (Self-hosted or Cloud)
* Node.js v18+
* Celo account or wallet (with CELO for gas)
* RPC endpoint (e.g., `https://forno.celo.org`)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/n8n-celo-tools.git
cd n8n-celo-tools
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Custom Node to n8n

In your n8n root folder:

```bash
n8n-nodes-add ./n8n-celo-tools
```

Or manually copy to:

```
~/.n8n/custom
```

### 4. Configure Environment

Create a `.env` file:

```bash
CELO_RPC_URL=https://forno.celo.org
PRIVATE_KEY=your_private_key_here
CELO_CHAIN=mainnet
```

### 5. Start n8n

```bash
n8n start
```

---

## 💡 Example Workflow: Auto-Payment

This workflow automatically sends cUSD when a trigger event (like form submission or webhook) occurs.

**Steps:**

1. **Webhook Trigger** → Receive payment request
2. **Celo Node (Send Transaction)** → Transfer tokens
3. **Response Node** → Send back transaction hash

**Sample JSON:**

```json
{
  "from": "{{env.PRIVATE_KEY}}",
  "to": "0xReceiverAddress",
  "amount": "5",
  "token": "cUSD"
}
```

---

## 🔔 Event Listening Example

Trigger workflow on a specific contract event (e.g., token mint):

```js
{
  "contractAddress": "0x1234...",
  "eventName": "Transfer",
  "fromBlock": "latest"
}
```

Then chain it with:

* Discord/Telegram alert
* Database log (PostgreSQL/MySQL)
* Email or webhook call

---

## 🛠️ Development

To modify or extend the Celo node:

```bash
npm run build
npm link
```

You can then use it inside your local n8n instance for testing.

---

## 🧱 Tech Stack

* **n8n** (Automation engine)
* **Node.js + TypeScript** (Node development)
* **Celo SDK** (`@celo/contractkit`)
* **Web3.js** for contract interactions
* **Dotenv** for configuration

---

## 📜 License

This project is licensed under the **MIT License** — you’re free to use, modify, and distribute.

---

## 🧠 Future Roadmap

* ✅ Add support for Celo Alfajores testnet
* 🔜 Token swap automation
* 🔜 NFT mint + transfer workflows
* 🔜 Analytics dashboard for Celo transactions
* 🔜 n8n Cloud marketplace integration

---

## 👨‍💻 Contributors

* **@your-name** – Creator / Maintainer
* Contributions welcome! Open a PR or start a discussion.
