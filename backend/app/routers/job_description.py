"""Job Description router — create and retrieve job descriptions."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.resume import JobDescription
from app.schemas.resume import JobDescriptionCreate, JobDescriptionResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/job-descriptions", tags=["Job Descriptions"])


@router.post("/", response_model=JobDescriptionResponse, status_code=201)
def create_job_description(
    jd_data: JobDescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new job description for analysis."""
    jd = JobDescription(
        user_id=current_user.id,
        title=jd_data.title,
        raw_text=jd_data.raw_text,
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


@router.get("/", response_model=list[JobDescriptionResponse])
def list_job_descriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all job descriptions for the current user."""
    jds = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
        .all()
    )
    return jds


@router.get("/{jd_id}", response_model=JobDescriptionResponse)
def get_job_description(
    jd_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific job description by ID."""
    jd = (
        db.query(JobDescription)
        .filter(JobDescription.id == jd_id, JobDescription.user_id == current_user.id)
        .first()
    )
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    return jd
