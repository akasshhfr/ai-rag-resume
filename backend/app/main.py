"""
FastAPI application entry point.

This is where the app is created, middleware is configured,
and all routers are registered.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, auth, resume, job_description, analysis, interview

# Create the FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="AI-powered resume analyzer with hybrid RAG and agentic interview coach",
    version="1.0.0",
)

# CORS middleware — allows the React frontend to call the API.
# Without this, browsers block cross-origin requests (frontend on :5173,
# backend on :8000 are different origins).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative dev port
        "https://ai-resume-coach-xi.vercel.app",       # Vercel production
        "https://ai-resume-coach.vercel.app",           # Vercel alias
        "https://ai-rag-resume-production.up.railway.app",  # Railway self
    ],
    allow_credentials=True,
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],     # Allow all headers (including Authorization for JWT)
)

# Register routers — each router handles a group of related endpoints
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(job_description.router)
app.include_router(analysis.router)
app.include_router(interview.router)


@app.get("/")
def root():
    """Root endpoint — basic API info."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
    }
