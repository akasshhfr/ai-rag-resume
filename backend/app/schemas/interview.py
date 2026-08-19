import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class InterviewStartRequest(BaseModel):
    """Schema for starting an interview session."""
    analysis_session_id: uuid.UUID | None = None
    resume_id: uuid.UUID


class InterviewAnswerRequest(BaseModel):
    """Schema for submitting an answer to an interview question."""
    answer: str = Field(..., min_length=1)


class InterviewTurnResponse(BaseModel):
    """Schema for a single interview turn."""
    id: uuid.UUID
    question: str
    user_answer: str | None
    evaluation_score: float | None
    feedback: str | None
    difficulty_level: str
    turn_order: int

    class Config:
        from_attributes = True


class InterviewSessionResponse(BaseModel):
    """Schema for interview session data."""
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    created_at: datetime
    current_question: str | None = None
    turns: list[InterviewTurnResponse] = []

    class Config:
        from_attributes = True


class InterviewSummaryResponse(BaseModel):
    """Schema for the post-interview summary."""
    session_id: uuid.UUID
    total_turns: int
    average_score: float | None
    difficulty_progression: list[str]
    turns: list[InterviewTurnResponse]
    overall_feedback: str
