# AI Resume Analyzer & Interview Coach

An AI-powered platform that analyzes resumes against job descriptions using **production-grade RAG** (hybrid search + reranking) and conducts adaptive mock interviews using a **LangGraph-based agent**.

## Features

- **ATS Score Analysis** — AI-powered resume scoring with skill gap identification
- **Hybrid RAG Pipeline** — BM25 + vector search with cross-encoder reranking
- **Personalized Learning Roadmap** — Month-by-month plan based on identified gaps
- **Agentic Interview Coach** — LangGraph state machine with adaptive difficulty
- **JWT Authentication** — Secure user registration and login

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy + Alembic |
| Vector Store | ChromaDB |
| Embeddings | Sentence Transformers (all-MiniLM-L6-v2) |
| Reranker | Cross-encoder (ms-marco-MiniLM-L-6-v2) |
| LLM | Google Gemini (free tier) |
| RAG | LangChain |
| Agent | LangGraph |
| Frontend | React + TypeScript + Tailwind CSS |
| Auth | JWT (python-jose + bcrypt) |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for PostgreSQL)
- Gemini API key ([get one free](https://aistudio.google.com/apikey))

### Setup

```bash
# 1. Clone and setup
git clone <your-repo-url>
cd ai-rag-resume

# 2. Start PostgreSQL
docker-compose up -d

# 3. Backend setup
cd backend
python -m venv venv
.\venv\Scripts\Activate   # Windows
pip install -r requirements.txt

# 4. Configure environment
# Edit ../.env and add your GEMINI_API_KEY

# 5. Run migrations
alembic upgrade head

# 6. Start backend
uvicorn app.main:app --reload

# 7. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### API Docs
Once running, visit `http://localhost:8000/docs` for interactive Swagger UI.

## Architecture

```
React Frontend → FastAPI Backend → [Hybrid RAG Pipeline + LangGraph Agent]
                                        ↓              ↓           ↓
                                   PostgreSQL      ChromaDB     Gemini
```

## Project Structure

```
backend/
  app/
    main.py              # FastAPI entry point
    config.py            # Settings management
    database.py          # SQLAlchemy engine + session
    models/              # Database models (User, Resume, Analysis, Interview)
    schemas/             # Pydantic request/response schemas
    routers/             # API endpoints
    services/            # Business logic
      llm_service.py       # Abstracted Gemini LLM calls
      pdf_service.py       # PDF text extraction
      embedding_service.py # ChromaDB + chunking + embeddings
      retriever_service.py # Hybrid search + BM25 + reranking
      analysis_service.py  # ATS scoring pipeline
      interview_service.py # LangGraph interview agent
    utils/
      security.py        # JWT + password hashing
frontend/
  src/
    pages/               # React page components
    components/          # Shared UI components
    api/                 # API client
    contexts/            # Auth context
```
