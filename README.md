# AI Agent with Next.js 15, LangChain, Clerk, Convex, and IBM Watsonx.ai

## 🚀 Overview
This project is an AI-powered agent built with **Next.js 15**, utilizing **LangChain, Clerk, Convex, TypeScript, and IBM Watsonx.ai** to create an advanced AI assistant capable of using various tools and handling complex tasks. The AI integrates **LangChain's langgraph framework**, **IBM Wxflows for AI workflows**, and **Convex for real-time data handling**.

## 🛠️ Tech Stack
- **Next.js 15** – Modern React framework
- **TypeScript** – Ensuring type safety
- **LangChain & langgraph** – For AI workflow orchestration
- **Clerk** – Authentication & Passkeys
- **Convex** – Backend database and real-time updates
- **IBM Watsonx.ai (Wxflows)** – AI workflow engine
- **Anthropic Claude** – LLM integration
- **Shadcn/ui** – UI components
- **Vercel** – Deployment

## 📜 IBM Watsonx.ai Engine (Wxflows)
IBM Watsonx.ai **(Wxflows)** is a powerful AI engine that enables:
- **AI-powered automation**
- **Tool integration** for enhanced functionality
- **Seamless data processing**
- **Workflow-based AI orchestration**

This build integrates **Wxflows** to power AI-driven automation and dynamic tool execution.

---

## 📌 Build Breakdown
### 🔹 Initial Setup
- Project structure and dependencies setup
- Authentication setup using Clerk
- Initializing the Next.js project

### 🔹 Setting Up Key Services
- Configuring IBM Watsonx.ai (Wxflows)
- Implementing Clerk for user authentication
- Setting up Convex for real-time data storage
- Integrating Clerk and Convex together

### 🔹 Frontend UI Development
- Designing the Landing Page and Dashboard
- Implementing Clerk Passkeys for authentication
- Creating reusable UI components (Sidebar, Header, Chat Interface, etc.)
- Managing state using React 19's `use` hook

### 🔹 Backend & AI Integration
- Implementing chat functionalities (Create, Delete, and real-time updates)
- Setting up LangChain & langgraph for AI workflow orchestration
- Integrating Anthropic Claude for AI responses
- Implementing IBM Wxflows to enhance AI tool handling
- Enabling prompt caching and system message handling

### 🔹 Finalizing the Build
- Implementing streaming responses
- Enhancing UI with **Shadcn/ui** components
- Debugging and testing the entire system
- Deploying to Vercel

---

## 🔧 Installation & Setup
### 1️⃣ Clone the Repository
```

### 2️⃣ Install Dependencies
```sh
yarn install  # or npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env.local` file and configure API keys for **Clerk, Convex, LangChain, and IBM Watsonx.ai**:
```sh
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOY_KEY=your_convex_key
NEXT_PUBLIC_LANGCHAIN_API_KEY=your_langchain_key
NEXT_PUBLIC_IBM_WXFLOWS_API_KEY=your_ibm_key
```

### 4️⃣ Run the Development Server
```sh
yarn dev  # or npm run dev
```
Visit `http://localhost:3000` to access the AI Agent.

---

## 📢 Contribution
Feel free to contribute by submitting PRs or opening issues.

## 🏆 Credits
Built with ❤️ by Govind Raj Gupta

