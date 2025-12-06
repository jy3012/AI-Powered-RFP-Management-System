# AI-Powered RFP Management (MERN)

## Overview
Single-user RFP management system that:
- creates structured RFPs from natural language (LLM)
- stores vendors and sends RFPs via email
- receives vendor responses (IMAP), parses them using LLM
- compares proposals and presents AI-based recommendation

## Tech stack
- Frontend: React (Vite), Tailwind CSS, Framer Motion
- Backend: Node.js, Express
- DB: MongoDB
- Email: Nodemailer (SMTP) for sending, ImapFlow for receiving
- AI: OpenAI (or swap to Hugging Face / local model)

## Prerequisites
- Node.js 18+
- MongoDB (local or connection string)
- OpenAI API key (or substitute)
- SMTP credentials (Gmail / SendGrid / Mailgun / SES)
- IMAP credentials for receiving vendor replies (optional for local demo)

## Setup

### Backend
```bash
cd backend
cp .env.example .env
# edit .env with keys
npm install
node server.js
