import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ResumeResponse(BaseModel):
    """Schema for resume data returned in responses."""
    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    raw_text: str | None = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    """Schema for listing resumes (without full text)."""
    id: uuid.UUID
    filename: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class JobDescriptionCreate(BaseModel):
    """Schema for creating a job description."""
    title: str = Field(..., min_length=1, max_length=255)
    raw_text: str = Field(..., min_length=10)


class JobDescriptionResponse(BaseModel):
    """Schema for job description data returned in responses."""
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    raw_text: str
    created_at: datetime

    class Config:
        from_attributes = True
