# AI-Powered RFP Management System - Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Tech Stack](#tech-stack)
4. [Technology Choices & Rationale](#technology-choices--rationale)
5. [System Components](#system-components)
6. [Data Flow](#data-flow)
7. [Design Decisions](#design-decisions)
8. [Alternatives Considered](#alternatives-considered)

---

## System Overview

This is a **full-stack web application** for managing Request for Proposals (RFPs) with AI-powered automation. The system enables users to:
- Generate structured RFPs from natural language using AI
- Manage vendor contacts
- Send RFPs via email
- Automatically receive and parse vendor proposals via IMAP
- Compare proposals using AI and get recommendations

**Architecture Pattern**: Monolithic backend with separate frontend (decoupled architecture)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Frontend (Vite)                                   │   │
│  │  - Dashboard, CreateRfp, Vendors, RfpDetail, Chat       │   │
│  │  - React Hooks (useState, useEffect)                     │   │
│  │  - Axios for API calls                                  │   │
│  │  - Custom CSS (no framework)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express.js Backend (Node.js)                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │  Controllers │  │   Routes     │  │   Services   │    │   │
│  │  │  - RFP       │  │  - /api/rfp │  │  - AI Service │    │   │
│  │  │  - Vendor    │  │  - /api/... │  │  - Email      │    │   │
│  │  │  - Webhook   │  │             │  │  - IMAP       │    │   │
│  │  └──────────────┘  └──────────────┘  │  - Queue      │    │   │
│  │                                      └──────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌─────────▼────────┐  ┌─────────▼────────┐
│   MongoDB      │  │  Google Gemini   │  │  Email Servers   │
│   (Database)   │  │  (AI Provider)   │  │  - SMTP (Send)   │
│                │  │                  │  │  - IMAP (Receive) │
│  - RFPs        │  │  - RFP Extraction │  │                  │
│  - Vendors     │  │  - Email Parsing │  │                  │
│  - Proposals   │  │  - Comparison    │  │                  │
└────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|----------|
| **React** | 19.2.1 | UI framework |
| **Vite** | 7.2.4 | Build tool & dev server |
| **Axios** | 1.13.2 | HTTP client |
| **React Icons** | 5.5.0 | Icon library |
| **PostCSS** | 8.5.6 | CSS processing |
| **ESLint** | 9.39.1 | Code linting |

### Backend
| Technology | Version | Purpose |
|-----------|---------|----------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 4.18.2 | Web framework |
| **Mongoose** | 7.5.0 | MongoDB ODM |
| **Google Gemini AI** | 0.8.0 | AI/LLM provider |
| **Nodemailer** | 6.9.5 | SMTP email sending |
| **imap-simple** | 6.0.0 | IMAP email receiving |
| **mailparser** | 3.7.2 | Email parsing |
| **dotenv** | 17.2.3 | Environment variables |

### Database
| Technology | Purpose |
|-----------|---------|
| **MongoDB** | NoSQL document database |

### Infrastructure
| Component | Purpose |
|-----------|---------|
| **SMTP Server** | Sending emails (Gmail/SendGrid/etc.) |
| **IMAP Server** | Receiving emails |
| **MongoDB Atlas/Server** | Database hosting |

---

## Technology Choices & Rationale

### Frontend Technologies

#### ✅ React 19.2.1
**Why React?**
- **Component-based architecture**: Perfect for building reusable UI components (Dashboard, RFP cards, etc.)
- **Hooks API**: Simplifies state management without Redux complexity
- **Large ecosystem**: Massive community, extensive libraries
- **Virtual DOM**: Efficient rendering for dynamic content
- **Industry standard**: Most developers know React

**Why not Vue.js?**
- React has larger job market and community
- More third-party libraries available
- Better for complex state management

**Why not Angular?**
- Overkill for this project size
- Steeper learning curve
- More boilerplate code required
- React is lighter and faster for SPAs

**Why not Svelte?**
- Smaller ecosystem
- Less mature tooling
- React has better TypeScript support

#### ✅ Vite 7.2.4
**Why Vite?**
- **Lightning-fast HMR**: Instant feedback during development
- **Fast builds**: Uses esbuild for bundling (10-100x faster than Webpack)
- **Zero config**: Works out of the box
- **Modern ESM**: Native ES modules support
- **Smaller bundle size**: Better tree-shaking

**Why not Create React App (CRA)?**
- CRA is deprecated and slow
- Vite is 10-100x faster
- Better developer experience

**Why not Webpack?**
- Webpack is complex and slow
- Vite is simpler and faster
- Better for modern development

#### ✅ Custom CSS (No Framework)
**Why Custom CSS?**
- **Full control**: Complete design flexibility
- **No framework bloat**: Smaller bundle size
- **Modern CSS features**: CSS variables, Grid, Flexbox
- **Performance**: No runtime CSS-in-JS overhead
- **Easy customization**: Direct styling control

**Why not Tailwind CSS?**
- Initially considered, but removed for:
  - Custom design requirements
  - Smaller bundle without utility classes
  - More maintainable for this project size

**Why not Material-UI / Chakra UI?**
- Too opinionated for custom design
- Larger bundle size
- Less flexibility for unique UI

**Why not CSS-in-JS (styled-components)?**
- Runtime overhead
- Bundle size increase
- Custom CSS is simpler for this use case

#### ✅ Axios
**Why Axios?**
- **Better error handling**: Automatic JSON parsing
- **Request/Response interceptors**: Easy to add auth tokens
- **Browser & Node.js**: Works in both environments
- **Better defaults**: Automatic JSON handling

**Why not Fetch API?**
- Fetch requires manual error handling
- No request interceptors
- More verbose code
- Axios is more developer-friendly

### Backend Technologies

#### ✅ Node.js + Express.js
**Why Node.js?**
- **JavaScript everywhere**: Same language for frontend and backend
- **Non-blocking I/O**: Perfect for email polling and AI API calls
- **Large ecosystem**: npm has everything needed
- **Fast development**: Quick iteration
- **Event-driven**: Ideal for IMAP polling

**Why Express.js?**
- **Minimal & flexible**: Lightweight, unopinionated
- **Middleware ecosystem**: Easy to add CORS, auth, etc.
- **RESTful routing**: Simple API design
- **Industry standard**: Most popular Node.js framework

**Why not NestJS?**
- Overkill for this project
- More boilerplate
- Express is simpler and sufficient

**Why not Fastify?**
- Smaller ecosystem
- Express has more tutorials and examples
- Team familiarity

**Why not Python (Django/Flask)?**
- JavaScript consistency (frontend + backend)
- Node.js better for I/O-heavy tasks (IMAP polling)
- Single language reduces context switching

#### ✅ MongoDB + Mongoose
**Why MongoDB?**
- **Document-based**: Perfect for nested RFP/proposal structures
- **Flexible schema**: Easy to add fields (parsed data, scores, etc.)
- **JSON-like**: Natural fit for JavaScript
- **Scalable**: Easy horizontal scaling
- **Free tier**: MongoDB Atlas free tier available

**Why Mongoose?**
- **Schema validation**: Ensures data integrity
- **Middleware hooks**: Pre/post save hooks
- **Population**: Easy relationships (vendor, RFP)
- **Type casting**: Automatic ObjectId conversion

**Why not PostgreSQL?**
- MongoDB better for nested documents (RFP requirements, proposals)
- No need for complex joins
- Easier schema evolution

**Why not MySQL?**
- Same reasons as PostgreSQL
- MongoDB better for document storage

**Why not Firebase?**
- Vendor lock-in
- Less control
- MongoDB more flexible

#### ✅ Google Gemini AI
**Why Gemini?**
- **Free tier**: No cost for development/testing
- **Good performance**: Fast response times
- **JSON output**: Can extract structured data
- **Multiple models**: Fallback options (gemini-pro, gemini-2.5-flash)
- **Easy integration**: Simple SDK

**Why not OpenAI GPT?**
- **Cost**: GPT-4 is expensive, GPT-3.5 less capable
- **Rate limits**: Stricter on free tier
- **Gemini free tier**: Better for development

**Why not Claude (Anthropic)?**
- **Cost**: Paid only, no free tier
- **Gemini**: Free tier available

**Why not local models (Ollama)?**
- **Setup complexity**: Requires local GPU/server
- **Performance**: Cloud models faster
- **Maintenance**: No model updates needed

#### ✅ imap-simple + mailparser
**Why imap-simple?**
- **Simple API**: Easy to use
- **IMAP support**: Standard email protocol
- **Connection management**: Handles reconnection

**Why mailparser?**
- **Robust parsing**: Handles HTML, plain text, attachments
- **Well-maintained**: Active development
- **Comprehensive**: Extracts all email parts

**Why not imapflow?**
- imap-simple is simpler for basic use cases
- Sufficient for polling-based approach

**Why not Gmail API?**
- **Complexity**: OAuth setup required
- **Rate limits**: Stricter limits
- **IMAP**: Works with any email provider

#### ✅ Nodemailer
**Why Nodemailer?**
- **Industry standard**: Most popular Node.js email library
- **SMTP support**: Works with any SMTP server
- **Simple API**: Easy to use
- **Reliable**: Well-tested

**Why not SendGrid SDK?**
- Nodemailer works with SendGrid via SMTP
- More flexible (works with any provider)
- No vendor lock-in

### Development Tools

#### ✅ ESLint
**Why ESLint?**
- **Code quality**: Catches errors early
- **Consistency**: Enforces coding standards
- **React support**: Specialized React rules

#### ✅ Nodemon
**Why Nodemon?**
- **Auto-restart**: Restarts server on file changes
- **Development speed**: Faster iteration

---

## System Components

### Frontend Structure
```
frontend/
├── src/
│   ├── App.jsx              # Main app component, routing
│   ├── api.js               # API client (Axios)
│   ├── main.jsx             # Entry point
│   ├── index.css            # Global styles
│   └── pages/
│       ├── Dashboard.jsx    # RFP overview
│       ├── CreateRfp.jsx    # RFP generation
│       ├── Vendors.jsx      # Vendor management
│       ├── RfpDetail.jsx    # RFP details & proposals
│       └── Chat.jsx         # AI chat assistant
```

**Architecture Pattern**: Component-based, single-page application

### Backend Structure
```
backend/
├── server.js                # Entry point, server setup
├── controllers/             # Business logic
│   ├── rfpController.js     # RFP operations
│   ├── vendorController.js  # Vendor operations
│   └── webhookController.js # Webhook handlers
├── routes/                  # API routes
│   ├── rfpRoutes.js         # RFP endpoints
│   └── vendors.js           # Vendor endpoints
├── models/                  # Database schemas
│   ├── Rfp.js               # RFP model
│   ├── Vendor.js            # Vendor model
│   └── Proposal.js          # Proposal model
└── services/                # External services
    ├── openaiService.js     # AI integration (Gemini)
    ├── emailService.js      # Email sending (SMTP)
    ├── imapListener.js      # Email receiving (IMAP)
    └── queueService.js      # Rate limiting queue
```

**Architecture Pattern**: MVC (Model-View-Controller) with service layer

---

## Data Flow

### 1. RFP Generation Flow
```
User Input (Text) 
  → Frontend (CreateRfp.jsx)
  → API Call (POST /api/rfp/generate)
  → Backend (rfpController.generateRfp)
  → AI Service (extractRFPFromText)
  → Gemini API
  → Parse JSON Response
  → Save to MongoDB (Rfp Model)
  → Return to Frontend
  → Display Generated RFP
```

### 2. Email Sending Flow
```
User Selects RFP + Vendors
  → Frontend (RfpDetail.jsx)
  → API Call (POST /api/rfp/:id/send)
  → Backend (rfpController.sendRfp)
  → Email Service (sendRfpEmail)
  → Nodemailer (SMTP)
  → Email Server
  → Vendor Receives Email
```

### 3. Proposal Receiving Flow (Real-time)
```
Vendor Sends Email Reply
  → IMAP Server (Inbox)
  → IMAP Listener (Polling every 10s)
  → Parse Email (mailparser)
  → Find/Create Vendor
  → Match to RFP (Multiple strategies)
  → AI Service (parseVendorEmail)
  → Gemini API
  → Extract Structured Data
  → Save to MongoDB (Proposal Model)
  → Frontend Auto-refresh (Every 30s)
  → Display New Proposal
```

### 4. Proposal Comparison Flow
```
User Clicks "Compare (AI)"
  → Frontend (RfpDetail.jsx)
  → API Call (GET /api/rfp/:id/compare)
  → Backend (rfpController.compare)
  → Load RFP + Proposals
  → AI Service (compareProposals)
  → Gemini API
  → Generate Scores
  → Update Proposals (Scores)
  → Return Scores
  → Frontend Displays Rankings
```

---

## Design Decisions

### 1. **Polling vs Webhooks**
**Decision**: IMAP Polling (every 10 seconds)
- **Why**: Simpler setup, no webhook infrastructure needed
- **Trade-off**: Slight delay (up to 10s) vs instant webhooks
- **Future**: Could add webhook support for faster processing

### 2. **Rate Limiting Strategy**
**Decision**: Queue-based rate limiting (queueService.js)
- **Why**: Free tier AI APIs have strict rate limits
- **Implementation**: FIFO queue with cooldown periods
- **Benefit**: Prevents API quota exhaustion

### 3. **RFP Matching Strategy**
**Decision**: Multi-strategy matching (4 methods)
- **Why**: Vendor emails may not always include RFP ID
- **Methods**:
  1. Subject line with `[ID: xyz]`
  2. Vendor association (recent RFPs sent to vendor)
  3. Subject contains "RFP" or "Re:"
  4. Most recent RFP fallback
- **Benefit**: High match rate even with incomplete data

### 4. **Frontend State Management**
**Decision**: React Hooks (useState, useEffect)
- **Why**: No need for Redux for this app size
- **Benefit**: Simpler code, less boilerplate
- **Trade-off**: Props drilling (acceptable for this size)

### 5. **Database Schema Design**
**Decision**: Denormalized documents
- **Why**: Fast reads, no complex joins needed
- **Example**: Proposal stores vendor reference + populated data
- **Benefit**: Simple queries, good performance

### 6. **Error Handling**
**Decision**: Try-catch with user-friendly messages
- **Why**: Better UX than technical error codes
- **Implementation**: Centralized error handling in controllers
- **Benefit**: Consistent error messages

---

## Alternatives Considered

### Frontend Alternatives

| Alternative | Why Not Chosen |
|------------|----------------|
| **Next.js** | Overkill for SPA, adds SSR complexity not needed |
| **Vue.js** | React has larger ecosystem and team familiarity |
| **Svelte** | Smaller ecosystem, less TypeScript support |
| **Angular** | Too heavy, more boilerplate, steeper learning curve |
| **Tailwind CSS** | Removed for custom design flexibility |
| **Material-UI** | Too opinionated, larger bundle size |

### Backend Alternatives

| Alternative | Why Not Chosen |
|------------|----------------|
| **NestJS** | Overkill, Express is simpler and sufficient |
| **Fastify** | Smaller ecosystem, Express more familiar |
| **Python (Django/Flask)** | JavaScript consistency, Node.js better for I/O |
| **GraphQL** | REST is simpler for this use case |
| **PostgreSQL** | MongoDB better for nested documents |
| **Firebase** | Vendor lock-in, less control |

### AI Provider Alternatives

| Alternative | Why Not Chosen |
|------------|----------------|
| **OpenAI GPT-4** | Expensive, rate limits on free tier |
| **Claude** | Paid only, no free tier |
| **Local Models (Ollama)** | Setup complexity, requires GPU/server |
| **Hugging Face** | More complex integration, Gemini simpler |

### Email Alternatives

| Alternative | Why Not Chosen |
|------------|----------------|
| **Gmail API** | OAuth complexity, IMAP works with any provider |
| **SendGrid SDK** | Nodemailer works with SendGrid via SMTP, more flexible |
| **Mailgun SDK** | Same as SendGrid - SMTP is universal |
| **imapflow** | imap-simple is simpler for basic polling |

### Database Alternatives

| Alternative | Why Not Chosen |
|------------|----------------|
| **PostgreSQL** | MongoDB better for nested documents, JSON-like |
| **MySQL** | Same as PostgreSQL |
| **Firebase** | Vendor lock-in, less control |
| **Redis** | Not suitable as primary database |

---

## Performance Considerations

### Frontend
- **Vite**: Fast HMR and builds
- **Code splitting**: Automatic with Vite
- **Lazy loading**: Could add for routes if needed
- **Bundle size**: Custom CSS keeps it small

### Backend
- **IMAP polling**: 10s interval (configurable)
- **AI queue**: Prevents rate limit exhaustion
- **Database indexing**: Mongoose auto-indexes ObjectIds
- **Connection pooling**: Mongoose handles MongoDB connections

### Scalability
- **Current**: Single-user, single-server
- **Future**: Could add:
  - Redis for caching
  - Message queue (RabbitMQ) for email processing
  - Load balancer for multiple instances
  - Database sharding if needed

---

## Security Considerations

1. **Environment Variables**: All secrets in `.env` (not committed)
2. **CORS**: Configured for frontend origin only
3. **Input Validation**: Mongoose schema validation
4. **Email Security**: TLS for SMTP/IMAP
5. **API Keys**: Stored securely in environment variables

---

## Deployment Architecture

### Development
```
Local Machine
├── Frontend (Vite dev server) → localhost:5173
├── Backend (Node.js) → localhost:5000
└── MongoDB (Local or Atlas) → localhost:27017
```

### Production (Recommended)
```
┌─────────────────┐
│  Frontend       │  → Vercel / Netlify / Static Hosting
│  (Static Build) │
└─────────────────┘

┌─────────────────┐
│  Backend        │  → Railway / Render / Heroku / AWS
│  (Node.js)      │
└─────────────────┘

┌─────────────────┐
│  MongoDB        │  → MongoDB Atlas (Cloud)
│  (Database)     │
└─────────────────┘
```

---

## Future Enhancements

1. **Authentication**: Add user authentication (JWT)
2. **Multi-tenancy**: Support multiple organizations
3. **Real-time**: WebSocket for instant proposal updates
4. **File Attachments**: Parse PDF/Excel proposals
5. **Analytics**: Dashboard with proposal statistics
6. **Export**: PDF/Excel export of RFPs and proposals
7. **Notifications**: Email/SMS notifications for new proposals
8. **Version Control**: Track RFP changes over time

---

## Conclusion

This architecture prioritizes:
- ✅ **Simplicity**: Easy to understand and maintain
- ✅ **Performance**: Fast development and runtime
- ✅ **Flexibility**: Easy to extend and modify
- ✅ **Cost-effective**: Free tier services where possible
- ✅ **Developer Experience**: Modern tools and fast iteration

The tech stack is well-suited for a single-user RFP management system with room to scale as needed.

