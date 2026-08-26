import uuid
from datetime import datetime

from sqlalchemy import Float, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False
    )
    job_description_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("job_descriptions.id", ondelete="SET NULL"), nullable=True
    )
    ats_score: Mapped[float] = mapped_column(Float, nullable=True)
    skill_gaps: Mapped[dict] = mapped_column(JSON, nullable=True)
    roadmap: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user = relationship("User", backref="analysis_sessions")
    resume = relationship("Resume", back_populates="analysis_sessions")
    job_description = relationship("JobDescription", backref="analysis_sessions")
