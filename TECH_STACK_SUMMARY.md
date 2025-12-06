# Tech Stack Quick Reference

## 🎯 Core Stack

### Frontend
- **React 19.2.1** - UI framework
- **Vite 7.2.4** - Build tool (10-100x faster than Webpack)
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Custom CSS** - No framework (full control, smaller bundle)

### Backend
- **Node.js 18+** - Runtime
- **Express.js 4.18.2** - Web framework
- **Mongoose 7.5.0** - MongoDB ODM
- **Google Gemini AI** - LLM provider (free tier)

### Database
- **MongoDB** - NoSQL document database

### Email
- **Nodemailer** - SMTP sending
- **imap-simple** - IMAP receiving
- **mailparser** - Email parsing

---

## 🚀 Why These Choices?

### React over Vue/Angular
- ✅ Larger ecosystem
- ✅ Better job market
- ✅ More libraries
- ✅ Industry standard

### Vite over Webpack/CRA
- ✅ 10-100x faster builds
- ✅ Instant HMR
- ✅ Zero config
- ✅ Modern ESM

### MongoDB over PostgreSQL
- ✅ Better for nested documents (RFPs, proposals)
- ✅ JSON-like (natural for JavaScript)
- ✅ Flexible schema
- ✅ Free tier available

### Gemini over OpenAI/Claude
- ✅ Free tier available
- ✅ Good performance
- ✅ Easy integration
- ✅ Multiple model fallbacks

### Custom CSS over Tailwind/MUI
- ✅ Full design control
- ✅ Smaller bundle
- ✅ No framework bloat
- ✅ Better performance

### Express over NestJS/Fastify
- ✅ Simpler for this project
- ✅ Large ecosystem
- ✅ Team familiarity
- ✅ Minimal boilerplate

---

## 📊 Architecture Pattern

**Frontend**: Component-based SPA (Single Page Application)
**Backend**: MVC with Service Layer
**Database**: Document-based (MongoDB)
**Communication**: RESTful API

---

## 🔄 Data Flow

1. **RFP Generation**: User → Frontend → API → AI → MongoDB → Frontend
2. **Email Sending**: User → Frontend → API → SMTP → Vendor
3. **Proposal Receiving**: Vendor Email → IMAP → AI Parse → MongoDB → Frontend (auto-refresh)
4. **Comparison**: User → Frontend → API → AI → Scores → Frontend

---

## 🎨 Project Structure

```
ai-rfp/
├── frontend/          # React + Vite
│   └── src/
│       ├── pages/     # Components
│       └── api.js     # API client
└── backend/           # Node.js + Express
    ├── controllers/   # Business logic
    ├── routes/        # API endpoints
    ├── models/        # Database schemas
    └── services/      # External integrations
```

---

## 🔧 Key Features

- ✅ Real-time email processing (IMAP polling)
- ✅ AI-powered RFP generation
- ✅ Automatic proposal parsing
- ✅ AI comparison & scoring
- ✅ Auto-refresh frontend (30s)
- ✅ Rate limiting queue (AI API protection)

---

## 📈 Scalability

**Current**: Single-user, single-server
**Future**: Can add Redis, message queues, load balancers

---

## 🔒 Security

- Environment variables for secrets
- CORS configured
- TLS for email
- Input validation (Mongoose)

---

For detailed architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)

