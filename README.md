# 🚀 Z-Flux — AI Finance Super App

## 1. Overview

Z-Flux is a full-fledged **AI-powered Finance Super App** that enables users to manage their finances end-to-end. Combining budgeting, expense tracking, wallet management, peer-to-peer transfers, and AI-driven insights into a single unified platform, Z-Flux goes beyond passive tracking — it empowers users to actively manage, move, and optimize their money in real time.

Designed for **students**, **professionals**, and **digital-first users** who want a comprehensive, all-in-one solution for their financial life.

---

## 2. Problem

The current landscape of personal finance tools is fragmented and inadequate:

- **Lack of Unified Financial Platforms** — Users rely on multiple apps for different needs: one for budgeting, another for wallets, another for transfers, and yet another for advice. This creates data silos, poor user experience, and increased cognitive load.

- **Passive Tracking Only** — Most finance apps simply record what happened. They offer no way to actively move money, create multiple accounts, or execute transactions between users. You're limited to observation, not action.

- **No Intelligent + Actionable System** — Even apps with "insights" provide static, generic advice. There's no system that understands your specific situation and helps you make decisions that actually impact your financial health.

- **Limited Control Over Money Movement** — True financial management requires the ability to transfer funds, allocate money across different wallets, and track where money moves. Most apps lack this fundamental capability.

---

## 3. Solution

Z-Flux combines tracking, management, and execution into one powerful platform:

- **All-in-One Platform** — No more switching between apps. Z-Flux handles budgeting, wallets, transfers, expense tracking, and AI insights in a single, cohesive experience.

- **Multi-Wallet System** — Create multiple wallets for different purposes — savings, daily spending, travel fund, emergency fund. Each wallet maintains its own balance and transaction history.

- **Wallet-to-Wallet Transfers** — Move money between your own wallets or send funds to other users securely. Track every transfer with complete transparency.

- **AI-Powered Intelligence** — gpt-4o-mini (OpenAI) analyzes your spending patterns, wallet balances, and transfer history to deliver context-aware financial advice and real-time recommendations.

- **Real-Time Control** — Every action happens instantly. Add transactions, create budgets, transfer funds, and get AI responses — all in real time with immediate updates across your financial ecosystem.

---

## 4. Key Features

- **AI-powered financial insights** — Get intelligent analysis of your financial health, spending trends, and money patterns powered by gpt-4o-mini (OpenAI).
- **Budget tracking** — Set, monitor, and adjust budgets across categories with real-time progress tracking and spending alerts
- **Expense categorization** — Automatically organize transactions into meaningful categories for clear financial visibility
- **Spending analytics** — Visualize spending patterns with intuitive charts, breakdowns, and trend analysis
- **Multi-wallet system** — Create and manage multiple wallets (personal, savings, business, etc.) each with independent balances
- **Secure wallet-to-wallet transfers** — Transfer funds between your own wallets or send money to other users with full transaction history
- **Real-time recommendations** — Receive instant, actionable suggestions based on your current financial behavior and goals

---

## 5. Technical Architecture

Z-Flux uses a modern three-tier architecture optimized for real-time financial operations and AI integration.

### Stack Overview

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| AI | gpt-4o-mini (OpenAI) |
| Database | PostgreSQL + Prisma |

### System Work-Flow

![Z-Flux Workflow](./Images/Z-Flux%20Financial-2026-04-13-094944.png)


## 6. Directory Structure

```
Z-Flux/
├── client/                    # React.js frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service functions
│   │   ├── contexts/         # React context providers
│   │   ├── utils/            # Helper functions
│   │   └── styles/           # Global styles
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                    # Node.js/Express backend
│   ├── config/               # Database & environment config
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware (auth, errors)
│   ├── models/               # Prisma models / database schema
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic & AI integration
│   ├── utils/                # Helper functions
│   ├── package.json
│   └── index.js              # Entry point
│
├── .env.example              # Environment variables template
├── package.json              # Root package.json (optional)
└── README.md
```

---

## 7. Database Schema

Z-Flux uses PostgreSQL with Prisma ORM and defines five primary models/tables. Records include automatic id and timestamp fields managed by Prisma.

### Users

Stores user account information and authentication data.

| Field | Type | Description |
|-------|------|-------------|
| email | String | Unique user email |
| password | String | Hashed password (bcrypt) |
| name | String | User's display name |
| createdAt | Date | Account creation timestamp |
| updatedAt | Date | Last profile update |

**Relationship:** One-to-Many with Wallets, Transactions, and Budgets

---

### Wallets

Manages multiple wallets per user with independent balances.

| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key referencing Users (Prisma) |
| walletId | String | Unique wallet identifier |
| name | String | Wallet name (e.g., "Main", "Savings") |
| balance | Decimal | Current wallet balance |
| walletType | String | Type: "personal", "savings", "business" |
| currency | String | Currency code (default: "USD") |
| isActive | Boolean | Wallet status |
| createdAt | DateTime | Wallet creation timestamp (Prisma DateTime) |
| updatedAt | DateTime | Last balance update |

**Relationship:** Many-to-One with Users, One-to-Many with Transfers (as sender/receiver)

---

### Transactions

Records all income and expense entries across wallets.

| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key referencing Users (Prisma) |
| walletId | UUID | Foreign key referencing Wallets (Prisma) |
| amount | Decimal | Transaction amount |
| type | String | "income" or "expense" |
| category | String | Transaction category |
| description | String | Optional notes |
| date | DateTime | Transaction date |
| createdAt | DateTime | Record creation timestamp |

**Relationship:** Many-to-One with Users, Many-to-One with Wallets

---

### Budgets

Manages user-defined budget limits per category.

| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key referencing Users (Prisma) |
| category | String | Budget category |
| limit | Decimal | Spending limit |
| spent | Decimal | Current amount spent |
| period | String | Period: "monthly", "weekly" |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relationship:** Many-to-One with Users

---

### Transfers

Records all wallet-to-wallet and user-to-user transfers.

| Field | Type | Description |
|-------|------|-------------|
| senderWalletId | UUID | Foreign key referencing sender's Wallet (Prisma) |
| receiverWalletId | UUID | Foreign key referencing receiver's Wallet (Prisma) |
| amount | Decimal | Transfer amount |
| status | String | "completed", "pending", "failed" |
| description | String | Optional transfer note |
| timestamp | DateTime | Transfer execution time |
| createdAt | DateTime | Record creation timestamp |

**Relationship:** Many-to-One with Wallets (both sender and receiver)

---

### Schema Relationships Summary

```
Users (1) ──────< Wallets (Many)
    │
    ├──< Transactions (Many)
    │
    ├──< Budgets (Many)
    │
    │
Wallets (1) ──────< Transfers (Many) >───── (1) Wallets
```

---

## 8. Installation Guide

### Clone Repository

```bash
git clone https://github.com/your-username/z-flux.git
cd z-flux
```

---

### Environment Setup

Create `.env` files in both `client/` and `server/` directories based on the examples below.

**Server (.env):**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DB_URI=mongodb://localhost:27017/zflux

# AI Integration
OPENAI_API_KEY=your_openai_api_key_here

# Authentication
JWT_SECRET=your_jwt_secret_key_here
```

**Client (.env):**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### Run the project

```bash
npm install
npm run dev
```

Application available at `http://localhost:3000`

---

## 9. Privacy and Security

Z-Flux implements comprehensive security measures to protect financial data and user privacy:

- **Password Hashing** — All user passwords are securely hashed using bcrypt before storage. Plaintext credentials are never saved.
- **Secure Transactions** — Wallet-to-wallet transfers include validation, status tracking, and atomic balance updates to ensure transaction integrity.
- **API Key Protection** — All API keys (including OpenAI) are stored exclusively in server-side environment variables and never exposed to the client.
- **Environment Variable Protection** — Sensitive credentials are managed through `.env` files excluded from version control via `.gitignore`.
- **User Data Isolation** — Authentication ensures each user can only access their own wallets, transactions, budgets, and transfer history.
- **Safe Financial Handling** — Financial data is processed only for app functionality — no sharing with third parties, no unnecessary data collection.

---

*Z-Flux — Your complete AI-powered financial command center.*