# 🧠 ArbiterAI - Multi-AI Committee System

> **Multi-Agent AI Orchestration Platform** - Intelligent Complex Decision Making

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5%20Pro-FF9900?style=flat-square)](https://ai.google.dev)
[![Zod](https://img.shields.io/badge/Zod-4.1.12-3E67AC?style=flat-square)](https://zod.dev)

---

## 📋 Table of Contents

- [🎯 Project Vision](#-project-vision)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🤖 AI Agents](#-ai-agents)
- [🛠️ Technology Stack](#️-technology-stack)
- [⚙️ Installation & Configuration](#️-installation--configuration)
- [🚀 Getting Started](#-getting-started)
- [📁 Code Folder Analysis](#-code-folder-analysis)
- [📚 API Documentation](#-api-documentation)
- [🎨 User Interface](#-user-interface)
- [🔌 Integrations](#-integrations)
- [📊 System Flow](#-system-flow)
- [🧪 Testing](#-testing)
- [📈 Performance Optimizations](#-performance-optimizations)
- [🔒 Security](#-security)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎯 Project Vision

**ArbiterAI** is a web application that creates an AI-powered **"Artificial Committee"** system for analyzing software development tasks. Equipped with three different personalities and perspectives, AI agents evaluate complex technical decisions from multiple angles, producing **better, more balanced, and more implementable solutions**.

### Core Concept

When any software development idea, question, or task is presented:

1. **VisionaryDev** 🚀 - Amplifies the potential by 10x with innovative ideas
2. **LazyDev** ⚡ - Shows the simple path to build MVP with minimum effort
3. **CriticalDev** 🔴 - Ruthlessly questions risks and failure scenarios

Then **ArbiterAI** synthesizes these three perspectives to create a solid, actionable **final decision** and **step-by-step implementation plan**.

---

## ✨ Key Features

### 🧠 Multi-Perspective Analysis
- **Visionary Perspective**: Futuristic and innovative ideas
- **Pragmatic Perspective**: Fast MVP and minimal complexity
- **Critical Perspective**: System weaknesses and risks
- **Synthesis**: Balanced combination of all three

### 🔄 Real-Time Streaming
- Live analysis process via Server-Sent Events (SSE)
- Instant visualization of thinking steps
- Real-time tool calls and results
- Interactive Process Timeline display

### 🎯 Structured Output
- JSON schema validated final decisions
- Step-by-step implementation plans
- Detailed justifications
- Rich markdown formatted text

### 🔍 Research Capabilities
- **Google Custom Search API** for real-time web search
- Current technology and trend information
- Code examples and implementation details
- Dynamic tool calling system

### 💬 Conversation History
- Multi-turn chat support
- Context-aware continued analysis
- References to previous decisions

### 🎨 Modern UI/UX
- Responsive and mobile-friendly design
- Code syntax highlighting
- Smooth scrolling and animations
- User-friendly welcome screen

### 📁 Code Folder Analysis
- **Drag & Drop Upload**: Simply drag your project folder
- **Auto-Filtering**: Automatically ignores `node_modules`, `venv`, `.git`, build outputs
- **Multi-Language Support**: 80+ file types and programming languages
- **File Management**: View, search, and manage uploaded files
- **Syntax Highlighting**: Code viewer with line numbers and copy functionality
- **Smart Analysis**: AI analyzes entire codebase and provides insights

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          Frontend (Next.js/React)       │
│  - UI Components (ThinkingProcess)      │
│  - Process Timeline Viewer              │
│  - Real-time Event Handling             │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼───────┐
        │   API Layer  │
        │ /api/orchestrate
        └──────┬───────┘
               │
        ┌──────▼──────────────────────────┐
        │ OrchestratorService (Main Flow) │
        │  - Agent Management             │
        │  - Event Streaming              │
        │  - Error Handling               │
        └──────┬──────────────────────────┘
               │
     ┌─────────┼──────────────┬────────────┐
     │         │              │            │
 ┌───▼──-┐ ┌─────▼───┐ ┌──────▼────┐ ┌────▼────┐
 │Arbiter│ │ Refiner │ │ Chief     │ │  Tools  │
 │Agent  │ │ Agent   │ │ Architect │ │  Search │
 └───────┘ └─────────┘ └───────────┘ └─────────┘
     │          │              │            │
     └──────────┼──────────────┴────────────┘
                │
         ┌──────▼────────────────┐
         │  Gemini AI Models     │
         │  - 2.5 Pro (Primary)  │
         │  - 2.5 Flash (Fallback)
         └───────────────────────┘
```

### Layers

#### 🎯 **Frontend Layer**
- **pages/index.tsx** - Main chat interface
- **components/** - Reusable React components
- **styles/** - CSS modules and styling
- **hooks/useOrchestration** - State management and API communication

#### 🔗 **API Layer**
- **pages/api/orchestrate.ts** - SSE stream endpoint
- **pages/api/committee.ts** - Configuration endpoint

#### 🎮 **Orchestration Layer**
- **OrchestratorService** - Main orchestration and agent management
- **ArbiterService** - Legacy system (deprecated)
- Event stream management and error handling

#### 🤖 **Agent Layer**
- **ArbiterAgent** - Initial analysis and research
- **RefinerAgent** - Analysis refinement
- **ChiefArchitectAgent** - Final plan creation

#### 🛠️ **Tools Layer**
- **performSearch** - Google Custom Search API
- **searchCodeExamples** - Code example search
- Dynamic function calling system

---

## 🤖 AI Agents

### 1️⃣ **ArbiterAgent** - Initial Analysis

**Role**: Analyzes the presented task and produces initial findings.

**System Prompt Features:**
- Simulates VisionaryDev, LazyDev, and CriticalDev perspectives
- Synthesizes between three perspectives
- Creates final decision and implementation plan

**Tools:**
- `performSearch` - Technology research
- `searchCodeExamples` - Code example search

**Output:**
- Thought steps in stream format
- Tool calls and results
- Final chunk: Complete initial analysis

---

### 2️⃣ **RefinerAgent** - Analysis Refiner

**Role**: Examines ArbiterAgent's output to make it more robust.

**System Prompt Features:**
- Expert CTO perspective with 30 years experience
- Finds hidden assumptions and dependencies
- Questions bottlenecks and alternative solutions
- Makes plan more solid and efficient

**Tools:**
- No research tools (only refines)

**Output:**
- Improved and refined analysis
- More detailed justification
- Optimized implementation plan

---

### 3️⃣ **ChiefArchitectAgent** - Structured Plan Creator

**Role**: Creates technical architecture and structured output.

**System Prompt Features:**
- Self-critique and critical thinking
- Analysis → Critique → Synthesis phases
- JSON schema structured output
- Fallback and retry mechanisms

**Tools:**
- `submitFinalPlan` - Submit structured plan
- `performSearch` - Research
- `searchCodeExamples` - Code examples

**Output:**
```json
{
  "finalDecision": "Concise final decision",
  "justification": "Detailed reasoning",
  "implementationPlan": [
    {
      "step": 1,
      "title": "Title",
      "details": "Details"
    }
  ]
}
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.5.4 | React framework and API routes |
| **React** | 19.1.0 | UI components |
| **React DOM** | 19.1.0 | DOM rendering |
| **TypeScript** | 5 | Type safety |
| **React Markdown** | 10.1.0 | Markdown rendering |
| **react-syntax-highlighter** | 15.6.6 | Code syntax highlighting |

### Backend & AI
| Technology | Version | Purpose |
|-----------|---------|---------|
| **@google/generative-ai** | 0.24.1 | Gemini AI API |
| **Zod** | 4.1.12 | Schema validation |

### Utilities
| Technology | Version | Purpose |
|-----------|---------|---------|
| **uuid** | 13.0.0 | Unique ID generation |

### Dev Tools
| Technology | Version | Purpose |
|-----------|---------|---------|
| **ESLint** | 9 | Code linting |
| **@types/** | Latest | TypeScript types |

---

## ⚙️ Installation & Configuration

### 📋 Prerequisites

```bash
# Node.js >= 18.17.0 required
node --version

# npm or yarn
npm --version
# or
yarn --version
```

### 🔧 Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/ai-komitesi.git
cd ai-komitesi
```

### 📦 Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### 🔑 Step 3: Set Environment Variables

Create a `.env.local` file and add the following variables:

```env
# Google Generative AI API Key
# https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=your_google_api_key_here

# Google Custom Search API
# https://programmablesearchengine.google.com/
CUSTOM_SEARCH_API_KEY=your_custom_search_api_key_here
SEARCH_ENGINE_ID=your_search_engine_id_here

# Model Selection (Optional)
DEFAULT_AGENT_MODEL=gemini-2.5-pro
```

### 🔐 How to Get API Keys?

#### **Google Generative AI (Gemini)**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key" button
3. Create a new project or select existing one
4. Copy the API key

#### **Google Custom Search API**
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Custom Search API
4. Create an API key
5. Create a search engine on [Programmable Search Engine](https://programmablesearchengine.google.com/)
6. Copy the Search Engine ID (cx)

### 🚀 Step 4: Run the Application

#### Development Mode
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

#### Production Build
```bash
npm run build
npm start
```

### 🧹 Step 5: Linting (Optional)

```bash
npm run lint
```

---

## 🚀 Getting Started

### First Chat

1. **Open the app** - `http://localhost:3000`
2. **Enter a question** - Example:
   ```
   Compare React Hook Form vs Formik
   ```
3. **Press Enter** or click the Send button
4. **Watch the Analysis Process** - Real-time steps will appear
5. **Review Results** - Final plan and recommendations

### Example Questions

#### 📱 Web Application Design
```
Create a step-by-step plan for building a responsive e-commerce page 
with Next.js and TailwindCSS.
```

#### 🔐 Security & Authentication
```
What is the best JWT authentication implementation for a 
Node.js and Express.js project?
```

#### 🗄️ Database Selection
```
Compare PostgreSQL vs MongoDB. Which is better for a SaaS 
application that starts small but grows?
```

#### 🚀 Deployment Strategies
```
How should I deploy my Next.js application to production? 
Choose between Vercel, AWS, and DigitalOcean.
```

---

## 📁 Code Folder Analysis

### Overview
One of the most powerful features of ArbiterAI is the ability to analyze entire project folders. Simply drag and drop your project, and the system intelligently processes all code files while automatically filtering out unnecessary folders and build artifacts.

### How It Works

#### Step 1: Select Your Project
```
1. Click on "📁 Code Folder Analysis" card on welcome screen
2. Click "Select Folder" button
3. Choose your project's root directory
4. System automatically begins processing
```

#### Step 2: Automatic Filtering
The system automatically ignores:
- **Dependencies**: `node_modules/`, `venv/`, `env/`, `.venv/`
- **Build Outputs**: `dist/`, `build/`, `.next/`, `.nuxt/`
- **Version Control**: `.git/`, `.gitignore`
- **IDE Config**: `.vscode/`, `.idea/`
- **Cache Dirs**: `__pycache__/`, `.pytest_cache/`, `.cache/`
- **OS Files**: `.DS_Store`, `Thumbs.db`

#### Step 3: File Review
```
1. View all uploaded files in the list
2. Click any file to view with syntax highlighting
3. Remove unwanted files if needed
4. Click "🔍 Analyze" to start AI analysis
```

#### Step 4: Get Insights
AI analyzes your entire codebase and provides:
- Code quality assessment
- Security vulnerabilities
- Performance optimization opportunities
- Architecture recommendations
- Missing features and improvements
- Step-by-step implementation plan

### Supported Languages & Formats

**80+ file types supported including:**
- JavaScript/TypeScript (`.js`, `.ts`, `.tsx`)
- Python (`.py`, `.pyx`)
- Java, Go, Rust, C/C++, C#
- Ruby, PHP, Swift, Kotlin, Dart
- HTML, CSS, SCSS, Markdown
- JSON, XML, YAML, SQL, GraphQL
- Config files: `package.json`, `tsconfig.json`, `Dockerfile`, etc.

### Limitations & Best Practices

**Size Limits:**
- Maximum file size: 5MB
- Maximum total size: 50MB
- Maximum 100 files per upload

**Best Practices:**
1. Upload complete projects for comprehensive analysis
2. System auto-filters unnecessary folders
3. Includes config files automatically (package.json, etc.)
4. Optimal: 10-50 code files per analysis
5. Multiple analyses support context from previous results

### Example Scenarios

**React Project:**
```
my-react-app/
├── src/           ✅ All uploaded
├── public/        ✅ Uploaded
├── package.json   ✅ Uploaded
├── tsconfig.json  ✅ Uploaded
├── node_modules/  ❌ Automatically ignored
└── .next/         ❌ Automatically ignored
Result: ~20 files analyzed
```

**Python Project:**
```
my-python-app/
├── src/           ✅ All .py files
├── tests/         ✅ Uploaded
├── requirements.txt ✅ Uploaded
├── venv/          ❌ Automatically ignored
└── __pycache__/   ❌ Automatically ignored
Result: ~15 files analyzed
```

### Advanced Features

- **Code Viewer**: Syntax-highlighted code with line numbers
- **File Search**: Filter files by name in the list
- **Copy to Clipboard**: One-click code copying
- **Session Management**: Temporary file storage, auto-cleanup after 1 hour
- **Real-time Streaming**: Live analysis results as they're processed

---

## 📚 API Documentation

### POST `/api/orchestrate`

**Purpose**: Initiates task analysis and AI orchestration.

**Request Format:**
```json
{
  "task": "Question or task text",
  "history": [
    {
      "role": "user",
      "parts": [{"text": "Previous question"}]
    },
    {
      "role": "model",
      "parts": [{"text": "Previous response"}]
    }
  ]
}
```

**Response Format:** Server-Sent Events (SSE)

```
data: {"source":"orchestrator","type":"status","payload":{"status":"running",...},"timestamp":1234567890}

data: {"source":"arbiter","type":"thought","payload":{"message":"Thought..."},"timestamp":1234567891}

data: {"source":"arbiter","type":"tool_call","payload":{"functionName":"performSearch",...},"timestamp":1234567892}

data: {"source":"arbiter","type":"tool_result","payload":{"result":"Result..."},"timestamp":1234567893}

data: {"source":"chief_architect","type":"final_plan","payload":{"finalDecision":"...",...},"timestamp":1234567894}

data: {"source":"orchestrator","type":"status","payload":{"status":"completed",...},"timestamp":1234567895}
```

**Event Types:**

| Type | Source | Description |
|------|--------|-------------|
| `status` | All Agents | Status update |
| `thought` | Agents | Thinking process |
| `tool_call` | Agents | Tool invocation |
| `tool_result` | Agents | Tool result |
| `final_chunk` | Agents | Final text |
| `final_plan` | ChiefArchitectAgent | Structured plan |
| `error` | All Agents | Error message |

**HTTP Status Codes:**
- `200` - Success (SSE stream starts)
- `400` - Invalid request
- `405` - Method Not Allowed
- `500` - Server error

---

## 🎨 User Interface

### Component Structure

```
pages/index.tsx (Main Page)
├── WelcomeScreen
│   └── Suggestion Cards
├── MessageList
│   ├── User Messages
│   ├── Model Messages (ModelMessageComponent)
│   └── Loading State
│       ├── ThinkingProcess (Initial loading)
│       └── ProcessTimeline
│           ├── StepRenderer Components
│           │   ├── ThoughtStepView
│           │   ├── ToolCallStepView
│           │   ├── ToolResultStepView
│           │   ├── FinalAnswerStepView
│           │   └── FinalPlanStepView
│           └── FinalStepRenderer
└── Input Footer
    ├── Auto-growing Textarea
    └── Send Button
```

### UI Components

#### 📌 **WelcomeScreen**
Welcome screen shown on first visit.
- Smart suggestion cards
- Quick start options
- Responsive grid layout

#### ⏱️ **ThinkingProcess**
Loading indicator shown when analysis starts.
- Animated phase messages
- Progress bar animation
- Memory efficient implementation

#### 📊 **ProcessTimeline**
Displays real-time analysis steps.
- Chronological order
- Status indicators
- Inline syntax highlighting

#### 🧩 **Step Renderers**
Specialized render components for each step type:
- **ThoughtStepView** - Thinking steps
- **ToolCallStepView** - Tool invocations
- **ToolResultStepView** - Tool results
- **FinalAnswerStepView** - Final answers
- **FinalPlanStepView** - Structured plans

### Responsive Design

```css
/* Mobile First Approach */
- Small screens: 320px+
- Tablets: 640px+
- Desktops: 1024px+
- Large screens: 1280px+
```

### Styling

- **Theme**: Dark mode compatible design
- **Colors**: Brand colors + accessibility
- **Typography**: Clear hierarchy
- **Spacing**: Consistent grid (8px base)
- **Animations**: Smooth transitions

---

## 🔌 Integrations

### Google Custom Search API

**What it does**: Performs real-time web search and returns best results.

**Implementation** (`services/tools.ts`):
```typescript
export async function performSearch(query: string): Promise<string> {
  const apiKey = process.env.CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // Format and return
  return formattedResults;
}
```

**Limitations**:
- 100 searches per day (free plan)
- 10,000 searches per day (pro plan)

### Google Generative AI (Gemini)

**Models:**
- **gemini-2.5-pro** - Primary model (more powerful)
- **gemini-2.5-flash** - Fallback model (faster)

**Fallback Mechanism**:
```typescript
const modelsToTry = [this.primaryModelName, this.fallbackModelName];

for (const modelName of modelsToTry) {
  try {
    result = await model.generateContent({...});
    break; // Success, exit loop
  } catch (error) {
    // Retry or try next model
  }
}
```

### Zod Validation

**Schema Example** (`lib/schemas.ts`):
```typescript
export const FinalPlanSchema = z.object({
  finalDecision: z.string(),
  justification: z.string(),
  implementationPlan: z.array(z.object({
    step: z.number(),
    title: z.string(),
    details: z.string(),
  })),
});
```

---

## 📊 System Flow

### 1. User Input

```
User: "Compare Next.js and Express.js"
    ↓
Input validation
    ↓
History format: [{ role: 'user', parts: [{ text: ... }] }]
    ↓
POST /api/orchestrate
```

### 2. Orchestration Start

```
OrchestratorService.run()
    ↓
Event: orchestrator/status/RUNNING
    ↓
Initialize ArbiterAgent
```

### 3. ArbiterAgent - Initial Analysis

```
ArbiterAgent.execute()
    ↓
Gemini initial analysis (Function Calling enabled)
    ↓
├─ performSearch("Next.js advantages") → Tool Result
├─ searchCodeExamples("Express.js") → Tool Result
└─ Analysis synthesis
    ↓
Events: thought, tool_call, tool_result, final_chunk, status
    ↓
Return: fullAnalysis text
```

### 4. RefinerAgent - Refine

```
RefinerAgent.execute(initialAnalysis)
    ↓
Gemini refines analysis
    ↓
Events: thought, final_chunk, status
    ↓
Return: refinedAnalysis text
```

### 5. ChiefArchitectAgent - Structured Plan

```
ChiefArchitectAgent.execute()
    ↓
Gemini structured output (JSON schema)
    ↓
├─ Analysis phase
├─ Critique phase
└─ Synthesis phase
    ↓
submitFinalPlan function call
    ↓
Zod validation
    ↓
Events: final_plan, status
```

### 6. Frontend Updates

```
useOrchestration hook
    ↓
Event batch processing (100ms intervals)
    ↓
Event handlers (eventHandlers.ts)
    ↓
ProcessStep[] state update
    ↓
React re-render
    ↓
ProcessTimeline display
    ↓
Result: Final plan display
```

---

## 🧪 Testing

### Basic Test Scenarios

#### ✅ Test 1: Simple Question
```
Input: "What is React?"
Expected: Quick and concise analysis
```

#### ✅ Test 2: Comparison Question
```
Input: "Compare REST API vs GraphQL"
Expected: Detailed comparison + implementation plan
```

#### ✅ Test 3: Architecture Question
```
Input: "Best practices for microservices architecture"
Expected: Structured plan + implementation steps
```

#### ✅ Test 4: Multi-turn Conversation
```
1. Input: "How to write backend with Node.js?"
   Response: Backend setup steps
2. Input: "PostgreSQL or Redis for database?"
   Response: Answer based on previous context (history consideration)
```

#### ✅ Test 5: Error Handling
```
- Network error followed by fallback model test
- Invalid API key test
- Timeout handling test
```

### Manual Testing Checklist

- [ ] **Frontend**
  - [ ] Responsive design (mobile, tablet, desktop)
  - [ ] Textarea auto-grow working?
  - [ ] Keyboard shortcuts (Enter, Shift+Enter)
  - [ ] Message history scrolling smooth?
  - [ ] Syntax highlighting working?

- [ ] **Backend**
  - [ ] SSE streaming working?
  - [ ] Event batching working correctly?
  - [ ] Error events displaying?

- [ ] **AI Agents**
  - [ ] Tool calling working?
  - [ ] Retry mechanism working?
  - [ ] JSON validation successful?

---

## 📈 Performance Optimizations

### 1. Event Batching
```typescript
// Process events in batches every 100ms
const BATCH_INTERVAL = 100;

// Process multiple events in single render
for (const event of batch) {
  handler(event);
}
```

### 2. Component Memoization
```typescript
// Prevent unnecessary re-renders
const FinalStepRenderer = React.memo(({ steps }) => {
  const finalSteps = useMemo(() => 
    steps.filter(s => s.type === 'FINAL_PLAN'),
    [steps]
  );
  
  return ...;
});
```

### 3. Memory Management
```typescript
// Keep maximum 30 steps (clean up old ones)
const MAX_STEPS = 30;

if (newSteps.length > MAX_STEPS) {
  const finalSteps = newSteps.filter(s => s.type === 'FINAL_ANSWER');
  const otherSteps = newSteps.slice(-(MAX_STEPS - finalSteps.length));
  newSteps = [...otherSteps, ...finalSteps];
}
```

### 4. Streaming Optimization
- SSE for continuous data transfer
- Progressive rendering on frontend
- Chunk-based processing on backend

### 5. Model Fallback Strategy
```
Primary: gemini-2.5-pro (powerful)
    ↓ (3s timeout)
Fallback: gemini-2.5-flash (faster)
```

---

## 🔒 Security

### 🔐 API Key Protection

**✅ Implemented:**
- Stored in `.env.local` file (in .gitignore)
- Processed server-side (not sent to client)
- Read from process.env

**✅ Best Practices:**
```bash
# .gitignore
.env.local
.env.*.local
```

### 🛡️ Input Validation

```typescript
// Request validation
if (!task || typeof task !== 'string') {
  return res.status(400).json({ error: 'Invalid task' });
}

if (!history || !Array.isArray(history)) {
  return res.status(400).json({ error: 'Invalid history' });
}
```

### 🔍 Zod Schema Validation

```typescript
// Output validation
const validationResult = FinalPlanSchema.safeParse(data);
if (!validationResult.success) {
  // Handle validation error
}
```

### ⚠️ Error Handling

**Sensitive Info Leak Prevention:**
```typescript
// ❌ WRONG
throw new Error(`API Key: ${apiKey} failed`);

// ✅ RIGHT
throw new Error('Authentication failed');
```

### 🌐 CORS (Recommended)

Add proper CORS policy in production:
```typescript
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
res.setHeader('Access-Control-Allow-Methods', 'POST');
```

### 🔒 Rate Limiting (Recommended)

For abuse prevention:
```typescript
// Add rate limiting to API calls
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.post('/api/orchestrate', limiter, handler);
```

---

## 🤝 Contributing

### Development Guidelines

1. **Branch Naming**
   ```
   feature/new-feature
   fix/bug-name
   refactor/code-improvement
   ```

2. **Commit Messages**
   ```
   feat: Add new feature
   fix: Fix specific bug
   docs: Update documentation
   style: Code formatting
   refactor: Code refactoring
   ```

3. **Code Standards**
   - TypeScript strict mode
   - ESLint compliance
   - 2 space indentation
   - Meaningful variable names

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request
6. Pass all checks
7. Request review

### Development Roadmap

- [ ] **Phase 2**: Parallel agent execution
- [ ] **Phase 3**: Multi-language support
- [ ] **Phase 4**: Custom prompts library
- [ ] **Phase 5**: Plugin system
- [ ] **Phase 6**: Analytics dashboard
- [ ] **Phase 7**: Team collaboration features

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## 👨‍💻 Author

**Barış** - Full Stack Developer

- 📧 Email: [email@example.com]
- 🔗 GitHub: [@username]
- 💼 LinkedIn: [linkedin.com/in/profile]

---

## 🙏 Acknowledgments

- Google Gemini AI team
- Next.js community
- React community
- All open-source library contributors

---

## ❓ Frequently Asked Questions (FAQ)

### Q: Why three different AI perspectives?
**A**: Because real-world decisions are multi-dimensional. Visionary, pragmatic, and critical perspectives from different angles produce more balanced and robust solutions.

### Q: How long does it take?
**A**: Usually between 30 seconds to 2 minutes, depending on question complexity.

### Q: Does it work offline?
**A**: No, Gemini API and Google Custom Search API are required.

### Q: Is conversation history saved?
**A**: Currently in localStorage (browser), can be stored in database for production.

### Q: Is it free?
**A**: You can host the frontend yourself. Google APIs are paid but have free tiers.

### Q: Are other languages supported?
**A**: Currently Turkish and English prompts can be prepared.

---

## 📞 Support

For questions or issues:

- 🐛 Bug Report: [GitHub Issues](https://github.com/yourusername/ai-komitesi/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/ai-komitesi/discussions)
- 📧 Email: [email@example.com]

---

## 🎉 Let's Get Started!

Make better AI-powered decisions with ArbiterAI! 🚀

**Happy Coding!** ✨
