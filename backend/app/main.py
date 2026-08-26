"""
FastAPI application entry point.

This is where the app is created, middleware is configured,
database tables are initialized, and all routers are registered.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
import app.models  # Import all models so Base knows about them
from app.routers import health, auth, resume, job_description, analysis, interview


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically on startup if they don't exist
    Base.metadata.create_all(bind=engine)
    yield


# Create the FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="AI-powered resume analyzer with hybrid RAG and agentic interview coach",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ai-resume-coach-xi.vercel.app",
        "https://ai-resume-coach.vercel.app",
        "https://ai-rag-resume-production.up.railway.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
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
