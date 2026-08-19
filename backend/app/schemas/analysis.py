import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    """Schema for triggering an analysis run."""
    resume_id: uuid.UUID
    job_description_id: uuid.UUID


class SkillGap(BaseModel):
    """A single skill gap identified."""
    skill: str
    importance: str = "medium"  # low, medium, high
    description: str = ""


class RoadmapItem(BaseModel):
    """A single item in the learning roadmap."""
    month: int
    topic: str
    resources: list[str] = []
    description: str = ""


class AnalysisResponse(BaseModel):
    """Schema for analysis results returned in responses."""
    id: uuid.UUID
    resume_id: uuid.UUID
    job_description_id: uuid.UUID | None
    ats_score: float | None
    skill_gaps: dict | None
    roadmap: dict | None
    created_at: datetime

    class Config:
        from_attributes = True
